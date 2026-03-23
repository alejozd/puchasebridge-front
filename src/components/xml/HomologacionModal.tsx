import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { AutoComplete, type AutoCompleteCompleteEvent, type AutoCompleteChangeEvent } from 'primereact/autocomplete';
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
    isEditing?: boolean;
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

            const mapped = pendingProducts.map(p => ({
                referenciaXML: p.referenciaXML,
                nombreProducto: p.nombreProducto,
                unidadXML: p.unidadXML,
                unidadXMLNombre: p.unidadXMLNombre,
                estado: p.estado || 'PENDIENTE',
                referenciaErp: '',
                unidadErp: '',
                unidadErpLabel: '',
                factor: 1
            }));

            setProductos(mapped);
            setUnidades(erpUnits);
            return mapped;
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

        updateRowState(rowData.referenciaXML, { loading: true });
        try {
            const payload: HomologarPayload = {
                fileName,
                referenciaXml: rowData.referenciaXML,
                unidadXml: rowData.unidadXML,
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

                // Reload list to get updated states or remove homologated item
                const freshItems = await loadData();

                // If the list is now empty, notify success
                if (freshItems && freshItems.length === 0) {
                    onSuccess();
                }
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
            updateRowState(rowData.referenciaXML, { loading: false });
        }
    };

    const updateRowState = (referenciaXML: string, newState: Partial<ProductoMapeo>) => {
        setProductos(prev => prev.map(p =>
            p.referenciaXML === referenciaXML ? { ...p, ...newState } : p
        ));
    };

    const searchErpProducts = async (event: AutoCompleteCompleteEvent, rowData: ProductoMapeo) => {
        updateRowState(rowData.referenciaXML, { searching: true });
        try {
            const suggestions = await erpService.searchErpProductos(event.query);
            updateRowState(rowData.referenciaXML, { erpSuggestions: suggestions, searching: false });
        } catch {
            updateRowState(rowData.referenciaXML, { searching: false });
        }
    };

    const onErpProductSelect = (selected: ErpProducto, rowData: ProductoMapeo) => {
        const matchingUnit = unidades.find(u => u.sigla === selected.unidadDefault);

        const update: Partial<ProductoMapeo> = {
            referenciaErp: selected.referencia,
            unidadErp: matchingUnit?.codigo || '',
            unidadErpLabel: matchingUnit?.sigla || ''
        };

        updateRowState(rowData.referenciaXML, update);
    };

    const statusBodyTemplate = (rowData: ProductoMapeo) => {
        const estado = rowData.estado ? rowData.estado.toLowerCase() : 'pendiente';
        const severity = estado === 'homologado' ? 'success' : 'warning';

        return <Tag value={estado.toUpperCase()} severity={severity} />;
    };

    const productErpTemplate = (rowData: ProductoMapeo) => {
        const isHomologado = rowData.estado?.toLowerCase() === 'homologado';
        const showEditor = !isHomologado || rowData.isEditing;

        if (!showEditor) {
            return (
                <div className="flex flex-column gap-1 py-1">
                    <span className="text-sm font-semibold text-primary">{rowData.referenciaErp}</span>
                    <span className="text-xs text-secondary font-medium">Unidad ERP: <span className="text-dark">{rowData.unidadErpLabel || rowData.unidadErp || '---'}</span></span>
                </div>
            );
        }

        return (
            <div className="flex flex-column gap-2">
                <AutoComplete
                    value={rowData.referenciaErp}
                    suggestions={rowData.erpSuggestions?.map(s => `[${s.referencia}] - ${s.nombre}`) || []}
                    completeMethod={(e) => searchErpProducts(e, rowData)}
                    onChange={(e: AutoCompleteChangeEvent) => updateRowState(rowData.referenciaXML, { referenciaErp: e.value })}
                    onSelect={(e) => {
                        const selectedStr = e.value as string;
                        const match = rowData.erpSuggestions?.find(s => `[${s.referencia}] - ${s.nombre}` === selectedStr);
                        if (match) onErpProductSelect(match, rowData);
                    }}
                    placeholder="Buscar producto..."
                    className="w-full"
                    inputClassName="p-inputtext-sm w-full"
                    loadingIcon="pi pi-spin pi-spinner"
                />
                {rowData.referenciaErp && (
                     <div className="px-2 py-1 bg-bluegray-50 border-round">
                        <span className="text-xs font-bold text-secondary text-uppercase">UNIDAD ASIGNADA: </span>
                        <span className="text-xs font-bold text-primary">{rowData.unidadErpLabel || rowData.unidadErp || 'SIN UNIDAD'}</span>
                    </div>
                )}
            </div>
        );
    };


    const factorEditor = (rowData: ProductoMapeo) => (
        <InputNumber
            value={rowData.factor}
            onValueChange={(e: InputNumberValueChangeEvent) => updateRowState(rowData.referenciaXML, { factor: e.value ?? 0 })}
            min={0}
            minFractionDigits={0}
            maxFractionDigits={4}
            className="w-full p-inputtext-sm"
            inputClassName="w-full"
        />
    );

    const actionTemplate = (rowData: ProductoMapeo) => {
        const estado = rowData.estado ? rowData.estado.toLowerCase() : 'pendiente';
        const isHomologado = estado === 'homologado';
        const isEditing = rowData.isEditing;

        if (!isHomologado || isEditing) {
            return (
                <div className="actions-cell flex gap-2 justify-content-center">
                    <Button
                        icon="pi pi-save"
                        text
                        rounded
                        severity="success"
                        onClick={() => handleSaveRow(rowData)}
                        loading={rowData.loading}
                        disabled={rowData.loading || rowData.searching || !rowData.referenciaErp}
                        tooltip="Guardar"
                    />
                    {isEditing && (
                        <Button
                            icon="pi pi-times"
                            text
                            rounded
                            severity="secondary"
                            onClick={() => updateRowState(rowData.referenciaXML, { isEditing: false })}
                            tooltip="Cancelar"
                        />
                    )}
                </div>
            );
        }

        return (
            <div className="actions-cell flex gap-2 justify-content-center">
                <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    severity="info"
                    onClick={() => updateRowState(rowData.referenciaXML, { isEditing: true })}
                    tooltip="Editar"
                />
                <Button
                    icon="pi pi-refresh"
                    text
                    rounded
                    severity="danger"
                    onClick={() => {
                        updateRowState(rowData.referenciaXML, {
                            referenciaErp: '',
                            unidadErp: '',
                            unidadErpLabel: '',
                            estado: 'pendiente',
                            isEditing: false
                        });
                    }}
                    tooltip="Limpiar"
                />
            </div>
        );
    };

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
                    <Column
                        header="PRODUCTO XML"
                        body={(rowData: ProductoMapeo) => (
                            <div className="flex flex-column gap-1">
                                <div className="font-bold text-dark">{rowData.nombreProducto}</div>
                                <div className="text-xs text-secondary font-mono">{rowData.referenciaXML}</div>
                            </div>
                        )}
                        headerClassName="table-header-cell"
                        style={{ width: '25%' }}
                    />
                    <Column
                        header="UND XML"
                        body={(rowData: ProductoMapeo) => (
                            <div className="text-xs font-semibold">
                                {rowData.unidadXML}{rowData.unidadXMLNombre ? ` - ${rowData.unidadXMLNombre}` : ''}
                            </div>
                        )}
                        headerClassName="table-header-cell"
                        style={{ width: '15%' }}
                    />
                    <Column header="PRODUCTO EN ERP" body={productErpTemplate} style={{ width: '35%' }} headerClassName="table-header-cell" />
                    <Column header="FACTOR" body={factorEditor} style={{ width: '8%' }} headerClassName="table-header-cell" />
                    <Column field="estado" header="ESTADO" body={statusBodyTemplate} style={{ width: '10%' }} align="center" headerClassName="table-header-cell" />
                    <Column header="ACCIONES" body={actionTemplate} style={{ width: '8%' }} align="center" headerClassName="table-header-cell" />
                </DataTable>
            </div>
            <div className="flex justify-content-end mt-4 gap-2">
                <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text text-secondary font-bold" />
            </div>
        </Dialog>
    );
};

export default HomologacionModal;
