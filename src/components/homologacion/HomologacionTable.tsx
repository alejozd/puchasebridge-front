import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { InputNumber, type InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { AutoComplete, type AutoCompleteCompleteEvent, type AutoCompleteChangeEvent } from 'primereact/autocomplete';
import type { ProductoMapeoPage, ProductoERP, UnidadERP } from '../../types/homologacion';

interface HomologacionTableProps {
    items: ProductoMapeoPage[];
    setItems: React.Dispatch<React.SetStateAction<ProductoMapeoPage[]>>;
    productosERP: ProductoERP[];
    unidadesERP: UnidadERP[];
    loading?: boolean;
    modo?: 'modal' | 'page';
    onSearchProductos?: (query: string) => Promise<ProductoERP[]>;
}

const HomologacionTable: React.FC<HomologacionTableProps> = ({
    items,
    setItems,
    productosERP,
    unidadesERP,
    loading = false,
    modo = 'page',
    onSearchProductos
}) => {
    const updateItem = (referenciaXML: string, changes: Partial<ProductoMapeoPage>) => {
        setItems(prev => prev.map(item => item.referenciaXML === referenciaXML ? { ...item, ...changes } : item));
    };

    const validateItems = (): boolean => {
        return items.every(item => {
            const isHomologado = item.estado?.toLowerCase() === 'homologado';
            if (isHomologado && !item.isEditing) return true;

            const hasProduct = !!item.referenciaErp && item.codigoErp !== undefined && item.subcodigoErp !== undefined;
            const hasUnit = !!item.unidadErp;
            const validFactor = Number(item.factor) > 0;
            return hasProduct && hasUnit && validFactor;
        });
    };

    const overallValid = validateItems();

    const unitOptions = unidadesERP.map(unit => ({
        label: `${unit.sigla} - ${unit.nombre}`,
        value: unit.codigo
    }));

    const statusBodyTemplate = (rowData: ProductoMapeoPage) => {
        const estado = rowData.estado?.toLowerCase() === 'homologado' ? 'HOMOLOGADO' : 'PENDIENTE';
        return <Tag value={estado} severity={estado === 'HOMOLOGADO' ? 'success' : 'warning'} />;
    };

    const xmlProductTemplate = (rowData: ProductoMapeoPage) => (
        <div className="flex flex-column gap-1">
            <span className="text-sm font-semibold text-dark">{rowData.nombreProducto}</span>
            <span className="text-xs text-secondary font-mono">{rowData.referenciaXML}</span>
        </div>
    );

    const xmlUnitTemplate = (rowData: ProductoMapeoPage) => (
        <div className="flex flex-column gap-1 align-items-center">
            <span className="text-xs font-bold text-dark uppercase">{rowData.unidadXMLNombre || rowData.unidadXML || '---'}</span>
            <span className="text-xs text-secondary">({rowData.unidadXML})</span>
        </div>
    );

    const handleSearch = async (event: AutoCompleteCompleteEvent, rowData: ProductoMapeoPage) => {
        const query = (event.query || '').trim();
        if (!query) {
            updateItem(rowData.referenciaXML, { suggestions: [], searching: false });
            return;
        }

        updateItem(rowData.referenciaXML, { searching: true });
        try {
            const remoteSuggestions = onSearchProductos ? await onSearchProductos(query) : [];
            const suggestions = remoteSuggestions.length > 0
                ? remoteSuggestions
                : productosERP.filter(prod => (`${prod.referencia} ${prod.nombre}`).toLowerCase().includes(query.toLowerCase()));

            updateItem(rowData.referenciaXML, { suggestions, searching: false });
        } catch {
            updateItem(rowData.referenciaXML, { searching: false });
        }
    };

    const erpItemTemplate = (item: ProductoERP) => (
        <div className="flex flex-column gap-1 py-1">
            <span className="text-sm font-semibold text-primary">[{item.referencia}]</span>
            <span className="text-xs text-secondary">{item.nombre}</span>
        </div>
    );

    const erpProductTemplate = (rowData: ProductoMapeoPage) => {
        const isHomologado = rowData.estado?.toLowerCase() === 'homologado';
        const canEdit = !isHomologado || rowData.isEditing;

        if (!canEdit) {
            return <span className="text-sm font-semibold text-primary">{rowData.productoSistema || 'Sin asignar'}</span>;
        }

        return (
            <AutoComplete
                value={rowData.productoSistema || rowData.referenciaErp || ''}
                suggestions={rowData.suggestions || []}
                completeMethod={(event) => handleSearch(event, rowData)}
                onChange={(event: AutoCompleteChangeEvent) => {
                    const value = typeof event.value === 'string'
                        ? event.value
                        : `[${event.value.referencia}] - ${event.value.nombre}`;
                    updateItem(rowData.referenciaXML, { productoSistema: value });
                }}
                onSelect={(event) => {
                    const selected = event.value as ProductoERP;
                    const matchingUnit = unidadesERP.find(unit => unit.sigla === selected.unidadDefault);
                    updateItem(rowData.referenciaXML, {
                        productoSistema: `[${selected.referencia}] - ${selected.nombre}`,
                        referenciaErp: selected.referencia,
                        codigoErp: selected.codigo,
                        subcodigoErp: selected.subcodigo,
                        nombreErp: selected.nombre,
                        unidadErp: matchingUnit?.codigo || rowData.unidadErp || ''
                    });
                }}
                itemTemplate={erpItemTemplate}
                placeholder="Buscar producto en ERP..."
                className="w-full"
                inputClassName="w-full"
                minLength={1}
                delay={100}
            />
        );
    };

    const erpUnitTemplate = (rowData: ProductoMapeoPage) => {
        const isHomologado = rowData.estado?.toLowerCase() === 'homologado';
        const canEdit = !isHomologado || rowData.isEditing;

        if (!canEdit) {
            const selectedLabel = unidadesERP.find(unit => unit.codigo === rowData.unidadErp)?.sigla || rowData.unidadErp || '---';
            return <span className="text-xs font-bold">{selectedLabel}</span>;
        }

        return (
            <Dropdown
                value={rowData.unidadErp}
                options={unitOptions}
                onChange={(e: DropdownChangeEvent) => updateItem(rowData.referenciaXML, { unidadErp: e.value })}
                placeholder="Unidad ERP"
                className="w-full"
                filter
            />
        );
    };

    const factorTemplate = (rowData: ProductoMapeoPage) => {
        const isHomologado = rowData.estado?.toLowerCase() === 'homologado';
        const canEdit = !isHomologado || rowData.isEditing;
        const unitXml = rowData.unidadXMLNombre || rowData.unidadXML;
        const unitErp = unidadesERP.find(unit => unit.codigo === rowData.unidadErp)?.sigla || 'UND_ERP';

        if (!canEdit) {
            return <span className="text-xs font-semibold">1 {unitXml} = {rowData.factor} {unitErp}</span>;
        }

        return (
            <div className="flex flex-column gap-1">
                <span className="text-xs">1 {unitXml} = {rowData.factor || 0} {unitErp}</span>
                <InputNumber
                    value={rowData.factor}
                    onValueChange={(e: InputNumberValueChangeEvent) => updateItem(rowData.referenciaXML, { factor: e.value ?? 0 })}
                    min={0}
                    mode="decimal"
                    maxFractionDigits={4}
                    inputClassName="w-full text-center"
                    className="w-full"
                />
            </div>
        );
    };

    const actionTemplate = (rowData: ProductoMapeoPage) => {
        const isHomologado = rowData.estado?.toLowerCase() === 'homologado';

        if (!isHomologado) return null;

        return (
            <Button
                icon={rowData.isEditing ? 'pi pi-times' : 'pi pi-pencil'}
                text
                rounded
                severity={rowData.isEditing ? 'secondary' : 'info'}
                onClick={() => updateItem(rowData.referenciaXML, { isEditing: !rowData.isEditing })}
                tooltip={rowData.isEditing ? 'Cancelar edición' : 'Editar homologación'}
            />
        );
    };

    return (
        <div className="flex flex-column gap-2">
            {!overallValid && (
                <small className="text-orange-600 font-semibold">
                    Hay registros con datos incompletos: producto ERP, unidad ERP y factor (&gt; 0) son obligatorios.
                </small>
            )}

            <DataTable
                value={items}
                loading={loading}
                className="p-datatable-sm modern-erp-table"
                rowHover
                stripedRows
                scrollable
                scrollHeight={modo === 'modal' ? '520px' : '600px'}
                emptyMessage="No hay productos para homologar."
            >
                <Column header="PRODUCTO XML" body={xmlProductTemplate} style={{ width: modo === 'modal' ? '32%' : '28%' }} />
                <Column header="UND XML" body={xmlUnitTemplate} style={{ width: '10%' }} align="center" />
                <Column header="PRODUCTO ERP" body={erpProductTemplate} style={{ width: modo === 'modal' ? '33%' : '30%' }} />
                <Column header="UNIDAD ERP" body={erpUnitTemplate} style={{ width: '14%' }} />
                <Column header="FACTOR" body={factorTemplate} style={{ width: modo === 'modal' ? '17%' : '14%' }} />
                <Column header="ESTADO" body={statusBodyTemplate} style={{ width: '8%' }} align="center" />
                {modo === 'modal' && <Column header="" body={actionTemplate} style={{ width: '4%' }} align="center" />}
            </DataTable>
        </div>
    );
};

export default HomologacionTable;
