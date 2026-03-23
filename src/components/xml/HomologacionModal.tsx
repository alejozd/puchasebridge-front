import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { AutoComplete, type AutoCompleteCompleteEvent, type AutoCompleteChangeEvent } from 'primereact/autocomplete';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { InputNumber, type InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import * as xmlService from '../../services/xmlService';
import * as erpService from '../../services/erpService';
import type { ProductoPendiente, HomologarPayload } from '../../types/xml';
import type { ErpProducto, ErpUnidad } from '../../services/erpService';

interface HomologacionModalProps {
    visible: boolean;
    onHide: () => void;
    fileName: string;
    onSuccess: () => void;
}

interface ProductoMapeo extends ProductoPendiente {
    referenciaErp: string;
    unidadErp: string;
    unidadErpLabel?: string;
    factor: number;
    loading?: boolean;
    searching?: boolean;
    erpSuggestions?: ErpProducto[];
}

const HomologacionModal: React.FC<HomologacionModalProps> = ({ visible, onHide, fileName, onSuccess }) => {
    const [productos, setProductos] = useState<ProductoMapeo[]>([]);
    const [unidades, setUnidades] = useState<ErpUnidad[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [pendingProducts, erpUnits] = await Promise.all([
                xmlService.getProductosPendientes(fileName),
                erpService.getErpUnidades()
            ]);

            setProductos(pendingProducts.map(p => ({
                ...p,
                referenciaErp: '',
                unidadErp: '',
                unidadErpLabel: '',
                factor: 1
            })));
            setUnidades(erpUnits);
        } catch {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar los datos necesarios.',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    }, [fileName]);

    useEffect(() => {
        if (visible && fileName) {
            loadData();
        }
    }, [visible, fileName, loadData]);

    const handleSaveRow = async (rowData: ProductoMapeo) => {
        if (!rowData.referenciaErp || !rowData.unidadErp) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Campos requeridos',
                detail: 'Referencia ERP y Unidad ERP son obligatorios.',
                life: 3000
            });
            return;
        }

        if (!rowData.factor || rowData.factor <= 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Valor inválido',
                detail: 'El factor debe ser mayor a 0.',
                life: 3000
            });
            return;
        }

        updateRowState(rowData.referenciaXml, { loading: true });
        try {
            const payload: HomologarPayload = {
                fileName,
                referenciaXml: rowData.referenciaXml,
                unidadXml: rowData.unidadXml,
                referenciaErp: rowData.referenciaErp,
                unidadErp: rowData.unidadErp,
                factor: rowData.factor
            };
            const res = await xmlService.homologarProducto(payload);
            if (res.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: res.mensaje || 'Producto homologado correctamente.',
                    life: 3000
                });

                setProductos(prev => {
                    const updated = prev.filter(p => p.referenciaXml !== rowData.referenciaXml);
                    if (updated.length === 0) {
                        onSuccess();
                    }
                    return updated;
                });
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: res.mensaje,
                    life: 3000
                });
            }
        } catch {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al intentar homologar el producto.',
                life: 3000
            });
        } finally {
            updateRowState(rowData.referenciaXml, { loading: false });
        }
    };

    const updateRowState = (referenciaXml: string, newState: Partial<ProductoMapeo>) => {
        setProductos(prev => prev.map(p =>
            p.referenciaXml === referenciaXml ? { ...p, ...newState } : p
        ));
    };

    const searchErpProducts = async (event: AutoCompleteCompleteEvent, rowData: ProductoMapeo) => {
        updateRowState(rowData.referenciaXml, { searching: true });
        try {
            const suggestions = await erpService.searchErpProductos(event.query);
            updateRowState(rowData.referenciaXml, { erpSuggestions: suggestions, searching: false });
        } catch {
            updateRowState(rowData.referenciaXml, { searching: false });
        }
    };

    const onErpProductSelect = (selected: ErpProducto, rowData: ProductoMapeo) => {
        const update: Partial<ProductoMapeo> = {
            referenciaErp: selected.referencia
        };

        // Auto-select unit if available in ERP product
        if (selected.unidadDefault) {
            const matchingUnit = unidades.find(u => u.sigla === selected.unidadDefault);
            if (matchingUnit) {
                update.unidadErp = matchingUnit.codigo;
                update.unidadErpLabel = matchingUnit.sigla;
            }
        }

        updateRowState(rowData.referenciaXml, update);
    };

    const erpReferenceEditor = (rowData: ProductoMapeo) => (
        <div className="flex align-items-center">
            <AutoComplete
                value={rowData.referenciaErp}
                suggestions={rowData.erpSuggestions?.map(s => `[${s.referencia}] - ${s.nombre}`) || []}
                completeMethod={(e) => searchErpProducts(e, rowData)}
                onChange={(e: AutoCompleteChangeEvent) => updateRowState(rowData.referenciaXml, { referenciaErp: e.value })}
                onSelect={(e) => {
                    const selectedStr = e.value as string;
                    const match = rowData.erpSuggestions?.find(s => `[${s.referencia}] - ${s.nombre}` === selectedStr);
                    if (match) onErpProductSelect(match, rowData);
                }}
                placeholder="Buscar por referencia o nombre..."
                className="w-full"
                inputClassName="p-inputtext-sm w-full"
                loadingIcon="pi pi-spin pi-spinner"
            />
        </div>
    );

    const erpUnitEditor = (rowData: ProductoMapeo) => (
        <Dropdown
            value={rowData.unidadErp}
            options={unidades}
            optionLabel="sigla"
            optionValue="codigo"
            onChange={(e: DropdownChangeEvent) => {
                const selectedUnit = unidades.find(u => u.codigo === e.value);
                updateRowState(rowData.referenciaXml, {
                    unidadErp: e.value,
                    unidadErpLabel: selectedUnit?.sigla
                });
            }}
            placeholder="Unidad"
            className="w-full p-inputtext-sm"
            disabled={rowData.referenciaErp !== '' && rowData.erpSuggestions?.some(s => s.referencia === rowData.referenciaErp)}
            tooltip={rowData.referenciaErp !== '' ? "La unidad se asigna automáticamente según el producto seleccionado" : ""}
            tooltipOptions={{ position: 'top' }}
        />
    );

    const factorEditor = (rowData: ProductoMapeo) => (
        <InputNumber
            value={rowData.factor}
            onValueChange={(e: InputNumberValueChangeEvent) => updateRowState(rowData.referenciaXml, { factor: e.value ?? 0 })}
            min={0}
            minFractionDigits={0}
            maxFractionDigits={4}
            className="w-full p-inputtext-sm"
            inputClassName="w-full"
        />
    );

    const actionTemplate = (rowData: ProductoMapeo) => (
        <Button
            icon="pi pi-save"
            text
            rounded
            severity="success"
            onClick={() => handleSaveRow(rowData)}
            loading={rowData.loading}
            disabled={rowData.loading || rowData.searching}
        />
    );

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-sync text-primary" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                        <h3 className="m-0 text-primary font-bold">Homologación de Productos</h3>
                        <small className="text-secondary font-medium">{fileName}</small>
                    </div>
                </div>
            }
            visible={visible}
            onHide={onHide}
            style={{ width: '85vw', maxWidth: '1200px' }}
            draggable={false}
            resizable={false}
            modal
            blockScroll
        >
            <Toast ref={toast} />
            <div className="py-2">
                <DataTable
                    value={productos}
                    loading={loading}
                    className="p-datatable-sm items-table"
                    emptyMessage="No hay productos pendientes por homologar."
                    responsiveLayout="scroll"
                    rowHover
                >
                    <Column field="referenciaXml" header="REF XML" style={{ width: '12%' }} className="font-semibold text-xs" />
                    <Column field="nombre" header="NOMBRE PRODUCTO" style={{ width: '22%' }} className="text-xs" />
                    <Column field="unidadXml" header="UND XML" style={{ width: '8%' }} align="center" className="text-xs" />
                    <Column header="REF ERP (Buscador)" body={erpReferenceEditor} style={{ width: '25%' }} />
                    <Column header="UND ERP" body={erpUnitEditor} style={{ width: '15%' }} />
                    <Column header="FACTOR" body={factorEditor} style={{ width: '10%' }} />
                    <Column header="ACCIONES" body={actionTemplate} style={{ width: '8%' }} align="center" />
                </DataTable>
            </div>
            <div className="flex justify-content-end mt-4 gap-2">
                <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text text-secondary font-bold" />
            </div>
        </Dialog>
    );
};

export default HomologacionModal;
