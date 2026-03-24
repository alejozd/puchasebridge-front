import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { AutoComplete, type AutoCompleteCompleteEvent, type AutoCompleteChangeEvent } from 'primereact/autocomplete';
import { InputNumber, type InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
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
    productoSistema?: string;
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
    const [filteredProducts, setFilteredProducts] = useState<ProductoMapeo[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
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
            setFilteredProducts(mapped);
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

    useEffect(() => {
        if (!searchTerm) {
            setFilteredProducts(productos);
        } else {
            const lowSearch = searchTerm.toLowerCase();
            setFilteredProducts(productos.filter(p =>
                p.nombreProducto.toLowerCase().includes(lowSearch) ||
                p.referenciaXML.toLowerCase().includes(lowSearch)
            ));
        }
    }, [searchTerm, productos]);

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
        const query = (event.query || '').trim();

        updateRowState(rowData.referenciaXML, { searching: true });
        try {
            const suggestions = await erpService.searchErpProductos(query);
            updateRowState(rowData.referenciaXML, { erpSuggestions: suggestions, searching: false });
        } catch {
            updateRowState(rowData.referenciaXML, { searching: false });
        }
    };

    const onErpProductSelect = (selected: ErpProducto, rowData: ProductoMapeo) => {
        const matchingUnit = unidades.find(u => u.sigla === selected.unidadDefault);

        const update: Partial<ProductoMapeo> = {
            referenciaErp: selected.referencia,
            productoSistema: `[${selected.referencia}] - ${selected.nombre}`,
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
                <div className="flex flex-column gap-1 py-1 product-system-display">
                    <span className="text-sm font-semibold text-primary">
                        {rowData.productoSistema || rowData.referenciaErp}
                    </span>
                    <div className="flex align-items-center gap-1">
                        <span className="text-xs text-secondary font-medium">Unidad ERP:</span>
                        <span className="text-xs font-bold text-dark">{rowData.unidadErpLabel || rowData.unidadErp || '---'}</span>
                    </div>
                </div>
            );
        }

        const itemTemplate = (item: ErpProducto) => {
            return (
                <div className="flex flex-column erp-item-suggestion py-1">
                    <span className="erp-item-code font-bold text-sm text-primary">[{item.referencia}]</span>
                    <span className="erp-item-name text-xs text-secondary mt-1">{item.nombre}</span>
                </div>
            );
        };

        return (
            <div className="flex flex-column gap-1">
                <div className="p-input-icon-left w-full">
                    <i className="pi pi-search text-xs" style={{ left: '0.75rem', zIndex: 1 }} />
                    <AutoComplete
                        value={rowData.productoSistema || rowData.referenciaErp}
                        suggestions={rowData.erpSuggestions || []}
                        completeMethod={(e) => searchErpProducts(e, rowData)}
                        onChange={(e: AutoCompleteChangeEvent) => {
                            const val = typeof e.value === 'string' ? e.value : `[${e.value.referencia}] - ${e.value.nombre}`;
                            updateRowState(rowData.referenciaXML, { productoSistema: val });
                        }}
                        onSelect={(e) => onErpProductSelect(e.value as ErpProducto, rowData)}
                        itemTemplate={itemTemplate}
                        placeholder="Buscar producto en ERP..."
                        className="w-full"
                        inputClassName="p-inputtext-sm w-full pl-5"
                        panelClassName="erp-autocomplete-panel"
                        loadingIcon="pi pi-spin pi-spinner"
                        delay={300}
                        minLength={1}
                    />
                </div>
                {rowData.referenciaErp && (
                     <div className="flex align-items-center gap-1 mt-1">
                        <span className="unit-tag-inline">
                            <i className="pi pi-tag" style={{ fontSize: '9px' }}></i>
                            UND: {rowData.unidadErpLabel || rowData.unidadErp || '---'}
                        </span>
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

        if (isEditing) {
            return (
                <div className="actions-cell flex gap-2 justify-content-center">
                    <Button
                        icon="pi pi-check"
                        text
                        rounded
                        severity="success"
                        onClick={() => handleSaveRow(rowData)}
                        loading={rowData.loading}
                        disabled={rowData.loading || rowData.searching || !rowData.referenciaErp}
                        tooltip="Guardar Cambios"
                    />
                    <Button
                        icon="pi pi-times"
                        text
                        rounded
                        severity="secondary"
                        onClick={() => updateRowState(rowData.referenciaXML, { isEditing: false })}
                        tooltip="Cancelar"
                    />
                </div>
            );
        }

        if (isHomologado) {
            return (
                <div className="actions-cell flex gap-2 justify-content-center">
                    <Button
                        icon="pi pi-pencil"
                        text
                        rounded
                        severity="info"
                        onClick={() => updateRowState(rowData.referenciaXML, { isEditing: true })}
                        tooltip="Editar Homologación"
                    />
                    <Button
                        icon="pi pi-trash"
                        text
                        rounded
                        severity="danger"
                        onClick={() => {
                            updateRowState(rowData.referenciaXML, {
                                referenciaErp: '',
                                productoSistema: '',
                                unidadErp: '',
                                unidadErpLabel: '',
                                estado: 'pendiente',
                                isEditing: false
                            });
                        }}
                        tooltip="Eliminar Homologación"
                    />
                </div>
            );
        }

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
            </div>
        );
    };

    return (
        <Dialog
            header={
                <div className="detail-modal-header">
                    <div className="flex align-items-center justify-content-between w-full">
                        <div className="flex align-items-center gap-3">
                            <i className="pi pi-sync text-primary text-2xl"></i>
                            <div>
                                <h2 className="detail-modal-title m-0">Homologación de Productos</h2>
                                <small className="text-secondary font-medium">{fileName}</small>
                            </div>
                        </div>
                        <div className="flex align-items-center gap-3 pr-4">
                            <span className="p-input-icon-left">
                                <i className="pi pi-search text-secondary" />
                                <InputText
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Filtrar productos..."
                                    className="p-inputtext-sm"
                                    style={{ width: '250px' }}
                                />
                            </span>
                            <Tag value={`${productos.length} Ítems`} severity="info" className="p-px-3" />
                        </div>
                    </div>
                </div>
            }
            visible={visible}
            onHide={onHide}
            className="detail-dialog-v2"
            style={{ width: '90vw', maxWidth: '1300px' }}
            draggable={false}
            resizable={false}
            modal
            blockScroll
            footer={
                <div className="flex align-items-center justify-content-between p-3 border-top-1 border-gray-200">
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-info-circle text-secondary"></i>
                        <span className="text-xs font-medium text-secondary italic">
                            Tip: El sistema autoselecciona la unidad predeterminada del producto Helisa.
                        </span>
                    </div>
                    <div className="flex align-items-center gap-3">
                         <div className="text-xs text-secondary font-bold uppercase">
                            Resumen: <span className="text-primary">{productos.filter(p => p.estado?.toLowerCase() === 'homologado').length}</span> de <span className="text-primary">{productos.length}</span> homologados
                        </div>
                        <Button label="Cerrar Ventana" icon="pi pi-times" onClick={onHide} className="p-button-text p-button-secondary font-bold" />
                    </div>
                </div>
            }
        >
            <Toast ref={toast} />
            <div className="modal-body-content py-1">
                <DataTable
                    value={filteredProducts}
                    loading={loading}
                    className="p-datatable-sm items-table modern-erp-table"
                    emptyMessage="No hay productos pendientes por homologar."
                    scrollable
                    scrollHeight="550px"
                    stripedRows
                    rowHover
                    rowClassName={(data) => {
                        const estado = data.estado ? data.estado.toLowerCase() : 'pendiente';
                        return { 'row-pending': estado === 'pendiente' || estado === 'requiere homologación' };
                    }}
                >
                    <Column
                        header="PRODUCTO XML"
                        body={(rowData: ProductoMapeo) => (
                            <div className="flex flex-column gap-1">
                                <div className="text-sm font-semibold text-dark line-height-2">{rowData.nombreProducto}</div>
                                <div className="text-xs text-secondary opacity-70 font-mono">{rowData.referenciaXML}</div>
                            </div>
                        )}
                        headerClassName="table-header-cell"
                        style={{ width: '35%' }}
                    />
                    <Column
                        header="UND XML"
                        body={(rowData: ProductoMapeo) => (
                            <div className="flex flex-column gap-1">
                                <span className="text-xs font-bold text-dark uppercase">{rowData.unidadXMLNombre || '---'}</span>
                                <span className="text-xs text-secondary font-medium">({rowData.unidadXML})</span>
                            </div>
                        )}
                        headerClassName="table-header-cell"
                        style={{ width: '7%' }}
                    />
                    <Column header="PRODUCTO EN ERP" body={productErpTemplate} style={{ width: '35%' }} headerClassName="table-header-cell" />
                    <Column header="FACTOR" body={factorEditor} style={{ width: '8%' }} headerClassName="table-header-cell" />
                    <Column field="estado" header="ESTADO" body={statusBodyTemplate} style={{ width: '10%' }} align="center" headerClassName="table-header-cell" />
                    <Column header="ACCIONES" body={actionTemplate} style={{ width: '5%' }} align="center" headerClassName="table-header-cell" />
                </DataTable>
            </div>
        </Dialog>
    );
};

export default HomologacionModal;
