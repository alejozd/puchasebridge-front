import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { AutoComplete, type AutoCompleteCompleteEvent, type AutoCompleteChangeEvent } from 'primereact/autocomplete';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tooltip } from 'primereact/tooltip';
import PageTitle from '../../components/common/PageTitle';
import * as xmlService from '../../services/xmlService';
import * as erpService from '../../services/erpService';
import type { ProductoPendiente, XMLFile, HomologarPayload } from '../../types/xml';
import type { ErpProducto, ErpUnidad } from '../../services/erpService';
import '../../styles/homologacion.css';

interface ProductoMapeoPage extends ProductoPendiente {
    productoSistema?: string;
    referenciaErp?: string;
    codigoErp?: number;
    subcodigoErp?: number;
    nombreErp?: string;
    unidadErp?: string;
    factor: number;
    suggestions?: ErpProducto[];
    isEditing?: boolean;
    isSuggested?: boolean;
}

const HomologacionPage: React.FC = () => {
    const [items, setItems] = useState<ProductoMapeoPage[]>([]);
    const [xmlFiles, setXmlFiles] = useState<XMLFile[]>([]);
    const [selectedXml, setSelectedXml] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'homologado'>('todos');
    const [globalFilter, setGlobalFilter] = useState('');
    const [unidades, setUnidades] = useState<ErpUnidad[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);

    const loadXmlFiles = useCallback(async () => {
        try {
            const files = await xmlService.getXMLList();
            setXmlFiles(files);
        } catch {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo cargar la lista de archivos XML.',
                life: 3000
            });
        }
    }, []);

    const getAutoSuggestion = useCallback(async (item: ProductoMapeoPage) => {
        // Mock suggestion logic: if name contains certain keywords or a simple search returns a close match
        if (item.estado?.toLowerCase() === 'homologado' || item.productoSistema) return null;

        try {
            const results = await erpService.searchErpProductos(item.nombreProducto.substring(0, 15));
            if (results && results.length > 0) {
                // Return the first match as a suggestion
                return results[0];
            }
        } catch (e) {
            return null;
        }
        return null;
    }, []);

    const loadProducts = useCallback(async (fileName: string) => {
        setLoading(true);
        try {
            const [documentData, erpUnits] = await Promise.all([
                xmlService.getProductosDocumento(fileName),
                erpService.getErpUnidades()
            ]);

            const mappedItems: ProductoMapeoPage[] = documentData.productos.map(p => ({
                referenciaXML: p.referenciaXML,
                nombreProducto: p.nombreProducto,
                unidadXML: p.unidadXML,
                unidadXMLNombre: p.unidadXMLNombre,
                estado: p.estado || 'PENDIENTE',
                factor: p.factor || 1,
                productoSistema: p.referenciaErp ? `[${p.referenciaErp}] - ${p.nombreErp}` : '',
                referenciaErp: p.referenciaErp,
                codigoErp: p.codigoErp,
                subcodigoErp: p.subcodigoErp,
                nombreErp: p.nombreErp,
                unidadErp: p.unidadErp
            }));

            setItems(mappedItems);
            setUnidades(erpUnits);

            // Apply suggestions for pending items in batch to avoid multiple re-renders
            const pendingItems = mappedItems.filter(i => i.estado?.toLowerCase() === 'pendiente');
            const suggestionsResults = await Promise.all(
                pendingItems.map(async (item) => {
                    const suggestion = await getAutoSuggestion(item);
                    return { item, suggestion };
                })
            );

            setItems(prev => prev.map(p => {
                const suggestionEntry = suggestionsResults.find(s => s.item.referenciaXML === p.referenciaXML && s.suggestion);
                if (suggestionEntry && !p.productoSistema) {
                    const { suggestion } = suggestionEntry;
                    const matchingUnit = erpUnits.find(u => u.sigla === suggestion!.unidadDefault);
                    return {
                        ...p,
                        productoSistema: `[${suggestion!.referencia}] - ${suggestion!.nombre}`,
                        referenciaErp: suggestion!.referencia,
                        codigoErp: suggestion!.codigo,
                        subcodigoErp: suggestion!.subcodigo,
                        nombreErp: suggestion!.nombre,
                        unidadErp: matchingUnit?.codigo || '',
                        isSuggested: true
                    };
                }
                return p;
            }));

        } catch {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar los productos del archivo.',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadXmlFiles();
    }, [loadXmlFiles]);

    useEffect(() => {
        if (selectedXml) {
            loadProducts(selectedXml);
        } else {
            setItems([]);
        }
    }, [selectedXml, loadProducts]);

    const filteredItems = React.useMemo(() => {
        let result = items;

        if (statusFilter !== 'todos') {
            result = result.filter(item => {
                const estado = item.estado ? item.estado.toLowerCase() : 'pendiente';
                return estado === statusFilter;
            });
        }

        if (globalFilter) {
            const query = globalFilter.toLowerCase();
            result = result.filter(item => {
                const nombre = item.nombreProducto?.toLowerCase() || '';
                const ref = item.referenciaXML?.toLowerCase() || '';
                const sistema = item.productoSistema?.toLowerCase() || '';
                return nombre.includes(query) || ref.includes(query) || sistema.includes(query);
            });
        }

        return result;
    }, [items, statusFilter, globalFilter]);

    const searchProduct = async (event: AutoCompleteCompleteEvent, rowData: ProductoMapeoPage) => {
        const query = (event.query || '').trim();

        try {
            const suggestions = await erpService.searchErpProductos(query);
            setItems(prev => prev.map(item =>
                item.referenciaXML === rowData.referenciaXML ? { ...item, suggestions } : item
            ));
        } catch {
            // Silently fail
        }
    };

    const onProductSelect = (erpProd: ErpProducto, rowData: ProductoMapeoPage) => {
        const matchingUnit = unidades.find(u => u.sigla === erpProd.unidadDefault);

        setItems(prev => prev.map(item => {
            if (item.referenciaXML === rowData.referenciaXML) {
                return {
                    ...item,
                    productoSistema: `[${erpProd.referencia}] - ${erpProd.nombre}`,
                    referenciaErp: erpProd.referencia,
                    codigoErp: erpProd.codigo,
                    subcodigoErp: erpProd.subcodigo,
                    nombreErp: erpProd.nombre,
                    unidadErp: matchingUnit?.codigo || '',
                };
            }
            return item;
        }));
    };

    const handleSave = async (item: ProductoMapeoPage, silent = false) => {
        if (
            !item.referenciaErp ||
            !item.unidadErp ||
            !item.codigoErp ||
            item.subcodigoErp === undefined ||
            !item.nombreErp
        ) {
            if (!silent) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Atención',
                    detail: 'Debe seleccionar un producto del ERP válido (Código, Subcódigo y Nombre son requeridos).',
                    life: 3000
                });
            }
            return false;
        }

        try {
            const payload: HomologarPayload = {
                fileName: selectedXml!,
                referenciaXml: item.referenciaXML,
                unidadXml: item.unidadXML,
                codigoH: item.codigoErp!,
                subCodigoH: item.subcodigoErp!,
                nombreH: item.nombreErp!,
                referenciaErp: item.referenciaErp,
                unidadErp: item.unidadErp,
                factor: item.factor
            };

            const res = await xmlService.homologarProducto(payload);
            if (res.success) {
                if (!silent) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: res.mensaje || 'Homologación guardada con éxito.',
                        life: 3000
                    });
                    loadProducts(selectedXml!);
                }
                return true;
            } else {
                if (!silent) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.mensaje,
                        life: 3000
                    });
                }
                return false;
            }
        } catch {
            if (!silent) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo guardar la homologación.',
                    life: 3000
                });
            }
            return false;
        }
    };

    const handleClear = (referenciaXML: string) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.referenciaXML === referenciaXML) {
                return {
                    ...item,
                    productoSistema: '',
                    referenciaErp: '',
                    codigoErp: undefined,
                    subcodigoErp: undefined,
                    nombreErp: '',
                    unidadErp: '',
                    estado: 'pendiente',
                    isEditing: false
                };
            }
            return item;
        }));
    };

    const handleEdit = (referenciaXML: string) => {
        setItems(prevItems => prevItems.map(item =>
            item.referenciaXML === referenciaXML ? { ...item, isEditing: true } : item
        ));
    };

    const handleExport = () => {
        if (!selectedXml || filteredItems.length === 0) return;

        const dataToExport = filteredItems.map(item => ({
            referenciaXML: item.referenciaXML,
            nombreXML: item.nombreProducto,
            referenciaERP: item.referenciaErp || '',
            nombreERP: item.nombreErp || '',
            unidadERP: unidades.find(u => u.codigo === item.unidadErp)?.sigla || item.unidadErp || ''
        }));

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mapeo-${selectedXml}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.current?.show({
            severity: 'success',
            summary: 'Exportación completada',
            detail: 'El archivo de mapeo ha sido descargado.',
            life: 3000
        });
    };

    const handleSaveAll = async () => {
        const toSave = items.filter(i => i.estado?.toLowerCase() === 'pendiente' && i.referenciaErp);

        if (toSave.length === 0) {
            toast.current?.show({
                severity: 'info',
                summary: 'Sin cambios',
                detail: 'No hay productos pendientes con asignación ERP para guardar.',
                life: 3000
            });
            return;
        }

        setLoading(true);
        try {
            const results = await Promise.all(toSave.map(item => handleSave(item, true)));
            const savedCount = results.filter(r => r).length;

            if (savedCount > 0) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Guardado Masivo',
                    detail: `Se han guardado ${savedCount} homologaciones con éxito.`,
                    life: 3000
                });
                loadProducts(selectedXml!);
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron guardar los cambios.',
                    life: 3000
                });
            }
        } catch (e) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Ocurrió un error inesperado al guardar los cambios.',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async () => {
        if (!selectedXml) return;

        setLoading(true);
        try {
            const res = await xmlService.procesarArchivo(selectedXml);
            if (res.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Procesamiento Exitoso',
                    detail: res.mensaje || 'El archivo ha sido procesado correctamente.',
                    life: 5000
                });
                // Reload list and items
                loadXmlFiles();
                loadProducts(selectedXml);
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error de Procesamiento',
                    detail: res.mensaje,
                    life: 5000
                });
            }
        } catch (e) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo procesar el archivo.',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const statusBodyTemplate = (rowData: ProductoMapeoPage) => {
        const estado = rowData.estado ? rowData.estado.toLowerCase() : 'pendiente';
        const isHomologated = estado === 'homologado';
        const severity = isHomologated ? 'success' : 'warning';
        const value = isHomologated ? 'COMPLETO' : 'PENDIENTE';

        return (
            <Tag
                value={value}
                severity={severity}
                className="status-tag"
            />
        );
    };

    const productSystemTemplate = (rowData: ProductoMapeoPage) => {
        const isHomologado = rowData.estado?.toLowerCase() === 'homologado';
        const showEditor = !isHomologado || rowData.isEditing;

        if (!showEditor) {
            const unitLabel = unidades.find(u => u.codigo === rowData.unidadErp)?.sigla || rowData.unidadErp || '---';
            return (
                <div className="flex flex-column gap-1 py-1 product-system-display">
                    <span className="text-sm font-semibold text-primary">{rowData.productoSistema}</span>
                    <span className="text-xs text-secondary font-medium">Unidad ERP: <span className="text-dark">{unitLabel}</span></span>
                </div>
            );
        }

        const selectedUnitLabel = unidades.find(u => u.codigo === rowData.unidadErp)?.sigla || '';

        const itemTemplate = (item: ErpProducto) => {
            return (
                <div className="flex flex-column erp-item-suggestion py-1">
                    <span className="erp-item-code font-bold text-sm text-primary">[{item.referencia}]</span>
                    <span className="erp-item-name text-xs text-secondary mt-1">{item.nombre}</span>
                </div>
            );
        };

        return (
            <div className="flex flex-column gap-2">
                <div className="autocomplete-wrapper p-input-icon-right">
                    <AutoComplete
                        value={rowData.productoSistema || ''}
                        suggestions={rowData.suggestions || []}
                        completeMethod={(e) => searchProduct(e, rowData)}
                        onChange={(e: AutoCompleteChangeEvent) => {
                            const val = typeof e.value === 'string' ? e.value : `[${e.value.referencia}] - ${e.value.nombre}`;
                            setItems(prev => prev.map(item =>
                                item.referenciaXML === rowData.referenciaXML ? { ...item, productoSistema: val } : item
                            ));
                        }}
                        onSelect={(e) => onProductSelect(e.value as ErpProducto, rowData)}
                        itemTemplate={itemTemplate}
                        placeholder="Buscar producto en ERP..."
                        className="w-full"
                        inputClassName="product-autocomplete-input pr-5"
                        panelClassName="erp-autocomplete-panel"
                        delay={100}
                        minLength={1}
                    />
                    <i className="pi pi-search search-icon" style={{ zIndex: 1 }}></i>
                </div>
                {rowData.referenciaErp && (
                    <div className="px-2 py-1 bg-bluegray-50 border-round">
                        <span className="text-xs font-bold text-secondary">UNIDAD ASIGNADA: </span>
                        <span className="text-xs font-bold text-primary">{selectedUnitLabel || rowData.unidadErp || 'SIN UNIDAD'}</span>
                    </div>
                )}
            </div>
        );
    };

    const actionBodyTemplate = (rowData: ProductoMapeoPage) => {
        const estado = rowData.estado ? rowData.estado.toLowerCase() : 'pendiente';
        const isHomologado = estado === 'homologado';
        const isEditing = rowData.isEditing;

        if (!isHomologado || isEditing) {
            return (
                <div className="actions-cell">
                    <Button
                        icon="pi pi-check-circle"
                        text
                        rounded
                        severity="success"
                        onClick={() => handleSave(rowData)}
                        tooltip="Confirmar y Guardar"
                        disabled={!rowData.referenciaErp}
                    />
                    {isEditing && (
                         <Button
                            icon="pi pi-times-circle"
                            text
                            rounded
                            severity="secondary"
                            onClick={() => {
                                setItems(prev => prev.map(item =>
                                    item.referenciaXML === rowData.referenciaXML ? { ...item, isEditing: false } : item
                                ));
                            }}
                            tooltip="Descartar Cambios"
                        />
                    )}
                </div>
            );
        }

        return (
            <div className="actions-cell">
                <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    severity="info"
                    onClick={() => handleEdit(rowData.referenciaXML)}
                    tooltip="Editar Homologación"
                />
                <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    severity="danger"
                    onClick={() => handleClear(rowData.referenciaXML)}
                    tooltip="Eliminar Homologación"
                />
            </div>
        );
    };

    const pendingCount = items.filter(i => i.estado?.toLowerCase() === 'pendiente').length;
    const isReadyToProcess = items.length > 0 && pendingCount === 0;

    const xmlValueTemplate = (option: any, props: any) => {
        if (option) {
            return (
                <div className="flex align-items-center truncate-text" style={{ maxWidth: '250px' }}>
                    <span className="truncate-text" data-pr-tooltip={option.label}>{option.label}</span>
                </div>
            );
        }
        return props.placeholder;
    };

    const xmlItemTemplate = (option: any) => {
        return (
            <div className="flex align-items-center truncate-text">
                <span className="truncate-text" data-pr-tooltip={option.label}>{option.label}</span>
            </div>
        );
    };

    return (
        <div className="homologacion-container">
            <Toast ref={toast} />
            <Tooltip target=".truncate-text [data-pr-tooltip]" position="top" />

            <div className="homologacion-header">
                <div className="title-area">
                    <PageTitle title="Homologación de Productos" />
                    <p className="header-description">Vincule los items recibidos del XML con el catálogo maestro de Helisa.</p>
                </div>
                <div className="header-actions">
                    <Button
                        label="Exportar Mapeo"
                        icon="pi pi-download"
                        outlined
                        className="btn-export"
                        onClick={handleExport}
                        disabled={!selectedXml || filteredItems.length === 0}
                    />
                    <Button
                        label="Guardar Cambios Seleccionados"
                        icon="pi pi-check-circle"
                        onClick={handleSaveAll}
                        className="btn-save-main"
                        disabled={!selectedXml}
                    />
                </div>
            </div>

            <div className="filters-section">
                <div className="filter-card xml-filter">
                    <label>ARCHIVO FUENTE (XML)</label>
                    <Dropdown
                        value={selectedXml}
                        options={xmlFiles.map(f => ({ label: f.fileName, value: f.fileName }))}
                        onChange={(e: DropdownChangeEvent) => setSelectedXml(e.value)}
                        placeholder="Seleccionar archivo"
                        className="w-full dropdown-custom"
                        valueTemplate={xmlValueTemplate}
                        itemTemplate={xmlItemTemplate}
                    />
                </div>
                <div className="filter-card status-filter">
                    <label>FILTRAR POR ESTADO</label>
                    <div className="status-buttons">
                        <Button
                            label="Todos"
                            className={statusFilter === 'todos' ? 'btn-status active' : 'btn-status'}
                            onClick={() => setStatusFilter('todos')}
                        />
                        <Button
                            label="Pendientes"
                            className={statusFilter === 'pendiente' ? 'btn-status active' : 'btn-status'}
                            onClick={() => setStatusFilter('pendiente')}
                        />
                        <Button
                            label="Homologados"
                            className={statusFilter === 'homologado' ? 'btn-status active' : 'btn-status'}
                            onClick={() => setStatusFilter('homologado')}
                        />
                    </div>
                </div>
                <div className="filter-card stats-summary">
                    <div className="stats-info">
                        <span className="stats-number text-primary">{pendingCount}</span>
                        <div className="stats-labels">
                            <span className="font-bold">Pendientes</span>
                            <span className="text-xs italic">Requieren acción manual</span>
                        </div>
                    </div>
                    <div className="stats-icon">
                        <i className="pi pi-clock"></i>
                    </div>
                </div>
            </div>

            <div className="table-card">
                <div className="table-header-search flex justify-content-end">
                    <span className="p-input-icon-right w-full max-w-sm">
                        <InputText
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="Buscar por código o descripción..."
                            className="w-full search-input pr-5"
                        />
                        <i className="pi pi-search" />
                    </span>
                </div>
                <DataTable
                    value={filteredItems}
                    loading={loading}
                    className="p-datatable-sm items-table modern-erp-table"
                    style={{ width: '100%' }}
                    rowHover
                    stripedRows
                    rowClassName={(data) => {
                        const estado = data.estado ? data.estado.toLowerCase() : 'pendiente';
                        return {
                            'row-pending': estado === 'pendiente',
                            'row-homologated': estado === 'homologado',
                            'row-suggested': !!data.isSuggested && estado === 'pendiente',
                            'row-editing': !!data.isEditing
                        };
                    }}
                    emptyMessage={selectedXml ? "No se encontraron productos para homologar en este archivo." : "Por favor seleccione un archivo XML."}
                >
                    <Column
                        header="PRODUCTO XML"
                        body={(rowData: ProductoMapeoPage) => (
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
                        body={(rowData: ProductoMapeoPage) => (
                            <div className="flex flex-column gap-1">
                                <span className="text-xs font-bold text-dark uppercase">{rowData.unidadXMLNombre || '---'}</span>
                                <span className="text-xs text-secondary font-medium">({rowData.unidadXML})</span>
                            </div>
                        )}
                        headerClassName="table-header-cell"
                        style={{ width: '10%' }}
                    />
                    <Column
                        header="PRODUCTO EN ERP"
                        body={productSystemTemplate}
                        headerClassName="table-header-cell"
                        style={{ width: '35%' }}
                    />
                    <Column
                        field="estado"
                        header="ESTADO"
                        body={statusBodyTemplate}
                        headerClassName="table-header-cell"
                        align="center"
                    />
                    <Column
                        header="ACCIONES"
                        body={actionBodyTemplate}
                        className="text-right"
                        headerClassName="table-header-cell text-right"
                    />
                </DataTable>
                <div className="table-footer">
                    <p>Mostrando {filteredItems.length} de {items.length} registros</p>
                </div>
            </div>

            <div className="info-cards-grid">
                <div className="info-card suggestion-card">
                    <i className="pi pi-info-circle"></i>
                    <div className="info-content">
                        <h4>Sugerencias Inteligentes</h4>
                        <p>Nuestro motor de IA ha detectado posibles coincidencias basadas en descripciones previas. Los campos marcados con azul claro son sugerencias automáticas.</p>
                    </div>
                </div>
                <div className="info-card activity-card">
                    <i className="pi pi-history"></i>
                    <div className="info-content">
                        <h4>Última Actividad</h4>
                        <div className="activity-item-placeholder">
                            <span className="font-bold">Usuario:</span> Admin Global <br/>
                            <span className="font-bold">Archivo:</span> {selectedXml || '---'} <br/>
                            <span className="font-bold">Fecha:</span> {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="floating-save">
                <div className="floating-label-container">
                    <span>{isReadyToProcess ? 'Listo para procesar 🚀' : 'Faltan productos por homologar'}</span>
                    <i className={isReadyToProcess ? "pi pi-check-circle text-success" : "pi pi-exclamation-triangle text-warning"}></i>
                </div>
                <Button
                    icon={isReadyToProcess ? "pi pi-send" : "pi pi-save"}
                    rounded
                    className={`btn-floating-save ${isReadyToProcess ? 'ready' : 'not-ready'}`}
                    onClick={isReadyToProcess ? handleProcess : handleSaveAll}
                    disabled={!selectedXml || (items.length === 0)}
                    tooltip={isReadyToProcess ? "Procesar Archivo" : "Guardar cambios pendientes"}
                />
            </div>
        </div>
    );
};

export default HomologacionPage;
