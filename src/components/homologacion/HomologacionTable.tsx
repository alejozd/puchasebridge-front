import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { InputNumber, type InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import type { ProductoMapeoPage, ProductoERP, UnidadERP } from '../../types/homologacion';

interface HomologacionTableProps {
    items: ProductoMapeoPage[];
    setItems: React.Dispatch<React.SetStateAction<ProductoMapeoPage[]>>;
    productosERP: ProductoERP[];
    unidadesERP: UnidadERP[];
    loading?: boolean;
    modo?: 'modal' | 'page';
}

const HomologacionTable: React.FC<HomologacionTableProps> = ({
    items,
    setItems,
    productosERP,
    unidadesERP,
    loading = false,
    modo = 'page'
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

    const productOptions = productosERP.map(prod => ({
        label: `[${prod.referencia}] - ${prod.nombre}`,
        value: prod
    }));

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

    const erpProductTemplate = (rowData: ProductoMapeoPage) => {
        const isHomologado = rowData.estado?.toLowerCase() === 'homologado';
        const canEdit = !isHomologado || rowData.isEditing;

        if (!canEdit) {
            return <span className="text-sm font-semibold text-primary">{rowData.productoSistema || 'Sin asignar'}</span>;
        }

        const selectedProduct = productosERP.find(prod => prod.referencia === rowData.referenciaErp) || null;

        return (
            <Dropdown
                value={selectedProduct}
                options={productOptions}
                onChange={(e: DropdownChangeEvent) => {
                    const selected = e.value as ProductoERP | null;
                    if (!selected) {
                        updateItem(rowData.referenciaXML, {
                            productoSistema: '',
                            referenciaErp: '',
                            codigoErp: undefined,
                            subcodigoErp: undefined,
                            nombreErp: '',
                            unidadErp: ''
                        });
                        return;
                    }

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
                placeholder="Seleccionar producto ERP"
                className="w-full"
                filter
                showClear
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
