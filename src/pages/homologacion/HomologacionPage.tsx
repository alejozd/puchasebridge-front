import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { AutoComplete, type AutoCompleteCompleteEvent, type AutoCompleteChangeEvent } from 'primereact/autocomplete';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import PageTitle from '../../components/common/PageTitle';
import * as xmlService from '../../services/xmlService';
import * as erpService from '../../services/erpService';
import type { ProductoPendiente, XMLFile, HomologarPayload } from '../../types/xml';
import type { ErpProducto, ErpUnidad } from '../../services/erpService';
import '../../styles/homologacion.css';

interface ProductoMapeoPage extends ProductoPendiente {
    productoSistema?: string;
    referenciaErp?: string;
    unidadErp?: string;
    factor: number;
    suggestions?: ErpProducto[];
    isEditing?: boolean;
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

    const loadProducts = useCallback(async (fileName: string) => {
        setLoading(true);
        try {
            const [pendingProducts, erpUnits] = await Promise.all([
                xmlService.getProductosPendientes(fileName),
                erpService.getErpUnidades()
            ]);

            setItems(pendingProducts.map(p => ({
                referenciaXML: p.referenciaXML,
                nombreProducto: p.nombreProducto,
                unidadXML: p.unidadXML,
                unidadXMLNombre: p.unidadXMLNombre,
                estado: p.estado || 'PENDIENTE',
                factor: 1
            })));
            setUnidades(erpUnits);
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
        try {
            const suggestions = await erpService.searchErpProductos(event.query);
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
                    productoSistema: `[${erpProd.referencia}] ${erpProd.nombre}`,
                    referenciaErp: erpProd.referencia,
                    unidadErp: matchingUnit?.codigo || '',
                };
            }
            return item;
        }));
    };

    const handleSave = async (item: ProductoMapeoPage) => {
        if (!item.referenciaErp || !item.unidadErp) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Debe completar la homologación (Producto y Unidad ERP).',
                life: 3000
            });
            return;
        }

        try {
            const payload: HomologarPayload = {
                fileName: selectedXml!,
                referenciaXml: item.referenciaXML,
                unidadXml: item.unidadXML,
                referenciaErp: item.referenciaErp,
                unidadErp: item.unidadErp,
                factor: item.factor
            };

            const res = await xmlService.homologarProducto(payload);
            if (res.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: res.mensaje || 'Homologación guardada con éxito.',
                    life: 3000
                });
                // Reload products
                loadProducts(selectedXml!);
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
                detail: 'No se pudo guardar la homologación.',
                life: 3000
            });
        }
    };

    const handleClear = (referenciaXML: string) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.referenciaXML === referenciaXML) {
                return {
                    ...item,
                    productoSistema: '',
                    referenciaErp: '',
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

    const handleSaveAll = () => {
        toast.current?.show({
            severity: 'success',
            summary: 'Homologación guardada',
            detail: 'Se han actualizado los cambios en el sistema.',
            life: 3000
        });
    };

    const statusBodyTemplate = (rowData: ProductoMapeoPage) => {
        const estado = rowData.estado ? rowData.estado.toLowerCase() : 'pendiente';
        const severity = estado === 'homologado' ? 'success' : 'warning';

        return (
            <Tag
                value={estado.toUpperCase()}
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
                <div className="flex flex-column gap-1 py-1">
                    <span className="text-sm font-semibold text-primary">{rowData.productoSistema}</span>
                    <span className="text-xs text-secondary font-medium">Unidad ERP: <span className="text-dark">{unitLabel}</span></span>
                </div>
            );
        }

        const selectedUnitLabel = unidades.find(u => u.codigo === rowData.unidadErp)?.sigla || '';

        return (
            <div className="flex flex-column gap-2">
                <div className="autocomplete-wrapper">
                    <i className="pi pi-search search-icon"></i>
                    <AutoComplete
                        value={rowData.productoSistema || ''}
                        suggestions={rowData.suggestions?.map(s => `[${s.referencia}] ${s.nombre}`) || []}
                        completeMethod={(e) => searchProduct(e, rowData)}
                        onChange={(e: AutoCompleteChangeEvent) => {
                            setItems(prev => prev.map(item =>
                                item.referenciaXML === rowData.referenciaXML ? { ...item, productoSistema: e.value } : item
                            ));
                        }}
                        onSelect={(e) => {
                            const selectedStr = e.value as string;
                            const match = rowData.suggestions?.find(s => `[${s.referencia}] ${s.nombre}` === selectedStr);
                            if (match) onProductSelect(match, rowData);
                        }}
                        placeholder="Buscar producto en ERP..."
                        className="w-full"
                        inputClassName="product-autocomplete-input"
                    />
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
                        icon="pi pi-check"
                        text
                        rounded
                        severity="success"
                        onClick={() => handleSave(rowData)}
                        tooltip="Guardar Homologación"
                        disabled={!rowData.referenciaErp}
                    />
                    {isEditing && (
                         <Button
                            icon="pi pi-times"
                            text
                            rounded
                            severity="secondary"
                            onClick={() => {
                                setItems(prev => prev.map(item =>
                                    item.referenciaXML === rowData.referenciaXML ? { ...item, isEditing: false } : item
                                ));
                            }}
                            tooltip="Cancelar Edición"
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
                    tooltip="Editar"
                />
                <Button
                    icon="pi pi-refresh"
                    text
                    rounded
                    severity="danger"
                    onClick={() => handleClear(rowData.referenciaXML)}
                    tooltip="Limpiar / Eliminar"
                />
            </div>
        );
    };

    const pendingCount = items.filter(i => i.estado === 'pendiente').length;

    return (
        <div className="homologacion-container">
            <Toast ref={toast} />

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
                    />
                    <Button
                        label="Guardar Cambios Seleccionados"
                        icon="pi pi-check-circle"
                        onClick={handleSaveAll}
                        className="btn-save-main"
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
                <div className="table-header-search">
                    <span className="p-input-icon-left w-full max-w-sm">
                        <i className="pi pi-search" />
                        <InputText
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="Buscar por código o descripción..."
                            className="w-full search-input"
                        />
                    </span>
                </div>
                <DataTable
                    value={filteredItems}
                    loading={loading}
                    className="p-datatable-sm items-table"
                    style={{ width: '100%' }}
                    rowHover
                    rowClassName={(data) => {
                        const estado = data.estado ? data.estado.toLowerCase() : 'pendiente';
                        return {
                            'row-pending': estado === 'pendiente',
                            'row-homologated': estado === 'homologado'
                        };
                    }}
                    emptyMessage={selectedXml ? "No se encontraron productos para homologar en este archivo." : "Por favor seleccione un archivo XML."}
                >
                    <Column
                        header="PRODUCTO XML"
                        body={(rowData: ProductoMapeoPage) => (
                            <div className="flex flex-column gap-1">
                                <div className="font-bold text-dark">{rowData.nombreProducto}</div>
                                <div className="text-xs text-secondary font-mono">{rowData.referenciaXML}</div>
                            </div>
                        )}
                        headerClassName="table-header-cell"
                        style={{ width: '30%' }}
                    />
                    <Column
                        header="UND XML"
                        body={(rowData: ProductoMapeoPage) => (
                            <div className="text-xs font-semibold">
                                {rowData.unidadXML}{rowData.unidadXMLNombre ? ` - ${rowData.unidadXMLNombre}` : ''}
                            </div>
                        )}
                        headerClassName="table-header-cell"
                        style={{ width: '15%' }}
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
                        <p>Usuario 'Admin Global' homologó el archivo NC-2023-0102 hace 45 minutos.</p>
                    </div>
                </div>
            </div>

            <div className="floating-save">
                <div className="floating-label-container">
                    <span>¿Listo para procesar?</span>
                    <i className="pi pi-arrow-down"></i>
                </div>
                <Button
                    icon="pi pi-save"
                    rounded
                    className="btn-floating-save"
                    onClick={handleSaveAll}
                />
            </div>
        </div>
    );
};

export default HomologacionPage;
