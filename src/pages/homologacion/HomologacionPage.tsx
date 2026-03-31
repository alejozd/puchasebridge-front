import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tooltip } from 'primereact/tooltip';
import PageTitle from '../../components/common/PageTitle';
import HomologacionTable from '../../components/homologacion/HomologacionTable';
import * as xmlService from '../../services/xmlService';
import * as erpService from '../../services/erpService';
import type { XMLFile, HomologarPayload } from '../../types/xml';
import type { ProductoERP, ProductoMapeoPage, UnidadERP } from '../../types/homologacion';
import '../../styles/homologacion.css';

const HomologacionPage: React.FC = () => {
    const [items, setItems] = useState<ProductoMapeoPage[]>([]);
    const [xmlFiles, setXmlFiles] = useState<XMLFile[]>([]);
    const [selectedXml, setSelectedXml] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'homologado'>('todos');
    const [globalFilter, setGlobalFilter] = useState('');
    const [unidadesERP, setUnidadesERP] = useState<UnidadERP[]>([]);
    const [productosERP, setProductosERP] = useState<ProductoERP[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);

    const handleSearchProductos = useCallback(async (query: string): Promise<ProductoERP[]> => {
        const trimmedQuery = query?.trim();
        if (!trimmedQuery) {
            setProductosERP([]);
            return [];
        }

        try {
            const result = await erpService.searchErpProductos(trimmedQuery);
            setProductosERP(result);
            return result;
        } catch {
            setProductosERP([]);
            return [];
        }
    }, []);

    const loadXmlFiles = useCallback(async () => {
        try {
            const files = await xmlService.getXMLList();
            setXmlFiles(files);
        } catch {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista de archivos XML.', life: 3000 });
        }
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
            setUnidadesERP(erpUnits);
            setProductosERP([]);
        } catch {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos del archivo.', life: 3000 });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadXmlFiles(); }, [loadXmlFiles]);

    useEffect(() => {
        if (selectedXml) loadProducts(selectedXml);
        else setItems([]);
    }, [selectedXml, loadProducts]);

    const filteredItems = React.useMemo(() => {
        let result = items;

        if (statusFilter !== 'todos') {
            result = result.filter(item => (item.estado || 'pendiente').toLowerCase() === statusFilter);
        }

        if (globalFilter) {
            const query = globalFilter.toLowerCase();
            result = result.filter(item =>
                (item.nombreProducto || '').toLowerCase().includes(query)
                || (item.referenciaXML || '').toLowerCase().includes(query)
                || (item.productoSistema || '').toLowerCase().includes(query)
            );
        }

        return result;
    }, [items, statusFilter, globalFilter]);

    const setFilteredItems: React.Dispatch<React.SetStateAction<ProductoMapeoPage[]>> = (updater) => {
        setItems(prevItems => {
            const currentFiltered = filteredItems;
            const nextFiltered = typeof updater === 'function'
                ? (updater as (prevState: ProductoMapeoPage[]) => ProductoMapeoPage[])(currentFiltered)
                : updater;

            const byRef = new Map(nextFiltered.map(i => [i.referenciaXML, i]));
            return prevItems.map(item => byRef.get(item.referenciaXML) || item);
        });
    };

    const handleSave = async (item: ProductoMapeoPage, silent = false) => {
        if (!item.referenciaErp || !item.unidadErp || !item.codigoErp || item.subcodigoErp === undefined || !item.nombreErp) {
            if (!silent) toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un producto y unidad ERP válidos.', life: 3000 });
            return false;
        }

        if (!item.factor || item.factor <= 0) {
            if (!silent) toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'El factor debe ser mayor que 0.', life: 3000 });
            return false;
        }

        try {
            const payload: HomologarPayload = {
                fileName: selectedXml!,
                referenciaXml: item.referenciaXML,
                unidadXml: item.unidadXML,
                codigoH: item.codigoErp,
                subCodigoH: item.subcodigoErp,
                nombreH: item.nombreErp,
                referenciaErp: item.referenciaErp,
                unidadErp: item.unidadErp,
                factor: item.factor
            };

            const res = await xmlService.homologarProducto(payload);
            if (res.success) return true;
            if (!silent) toast.current?.show({ severity: 'error', summary: 'Error', detail: res.mensaje, life: 3000 });
            return false;
        } catch {
            if (!silent) toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la homologación.', life: 3000 });
            return false;
        }
    };

    const handleSaveAll = async () => {
        const toSave = items.filter(i => {
            const editable = i.estado?.toLowerCase() !== 'homologado' || i.isEditing;
            return editable && i.referenciaErp;
        });

        if (toSave.length === 0) {
            toast.current?.show({ severity: 'info', summary: 'Sin cambios', detail: 'No hay productos para guardar.', life: 3000 });
            return;
        }

        setLoading(true);
        try {
            const results = await Promise.all(toSave.map(item => handleSave(item, true)));
            const savedCount = results.filter(Boolean).length;

            if (savedCount > 0) {
                toast.current?.show({ severity: 'success', summary: 'Guardado Masivo', detail: `Se guardaron ${savedCount} homologaciones.`, life: 3000 });
                loadProducts(selectedXml!);
            } else {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar los cambios.', life: 3000 });
            }
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
                toast.current?.show({ severity: 'success', summary: 'Procesamiento Exitoso', detail: res.mensaje || 'Archivo procesado correctamente.', life: 5000 });
                loadXmlFiles();
                loadProducts(selectedXml);
            } else {
                toast.current?.show({ severity: 'error', summary: 'Error de Procesamiento', detail: res.mensaje, life: 5000 });
            }
        } catch {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar el archivo.', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const pendingCount = items.filter(i => i.estado?.toLowerCase() !== 'homologado').length;
    const isReadyToProcess = items.length > 0 && pendingCount === 0;

    return (
        <div className="homologacion-container">
            <Toast ref={toast} />
            <Tooltip target=".truncate-text[data-pr-tooltip]" position="top" />

            <div className="homologacion-header">
                <div className="title-area">
                    <PageTitle title="Homologación de Productos" />
                    <p className="header-description">Vincule los items recibidos del XML con el catálogo maestro de Helisa.</p>
                </div>
                <div className="header-actions">
                    <Button label="Guardar Cambios Seleccionados" icon="pi pi-check-circle" onClick={handleSaveAll} className="btn-save-main" disabled={!selectedXml} />
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
                        <Button label="Todos" className={statusFilter === 'todos' ? 'btn-status active' : 'btn-status'} onClick={() => setStatusFilter('todos')} />
                        <Button label="Pendientes" className={statusFilter === 'pendiente' ? 'btn-status active' : 'btn-status'} onClick={() => setStatusFilter('pendiente')} />
                        <Button label="Homologados" className={statusFilter === 'homologado' ? 'btn-status active' : 'btn-status'} onClick={() => setStatusFilter('homologado')} />
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
                    <div className="stats-icon"><i className="pi pi-clock"></i></div>
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

                <HomologacionTable
                    items={filteredItems}
                    setItems={setFilteredItems}
                    productosERP={productosERP}
                    unidadesERP={unidadesERP}
                    loading={loading}
                    modo="page"
                    onSearchProductos={handleSearchProductos}
                />

                <div className="table-footer">
                    <p>Mostrando {filteredItems.length} de {items.length} registros</p>
                </div>
            </div>

            <div className="floating-save">
                <div className="floating-label-container">
                    <span>{isReadyToProcess ? 'Listo para procesar 🚀' : 'Faltan productos por homologar'}</span>
                    <i className={isReadyToProcess ? 'pi pi-check-circle text-success' : 'pi pi-exclamation-triangle text-warning'}></i>
                </div>
                <Button
                    icon={isReadyToProcess ? 'pi pi-send' : 'pi pi-save'}
                    rounded
                    className={`btn-floating-save ${isReadyToProcess ? 'ready' : 'not-ready'}`}
                    onClick={isReadyToProcess ? handleProcess : handleSaveAll}
                    disabled={!selectedXml || items.length === 0}
                    tooltip={isReadyToProcess ? 'Procesar Archivo' : 'Guardar cambios pendientes'}
                />
            </div>
        </div>
    );
};

export default HomologacionPage;
