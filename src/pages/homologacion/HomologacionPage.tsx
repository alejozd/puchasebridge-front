import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { AutoComplete, type AutoCompleteCompleteEvent, type AutoCompleteChangeEvent } from 'primereact/autocomplete';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import PageTitle from '../../components/common/PageTitle';
import type { ProductoHomologacion, ProductoHelisa } from '../../types/homologacion';
import '../../styles/homologacion.css';

// Mock data for products in Helisa
const PRODUCTOS_HELISA_MOCK: ProductoHelisa[] = [
    { id: '1', codigo: 'INV-009', nombre: 'Cinta Aislante Negra 3/4' },
    { id: '2', codigo: 'CON-012', nombre: 'Alambre Cobre #12 Verde' },
    { id: '3', codigo: 'RES-500', nombre: 'Resistencia Eléctrica Industrial 500W' },
    { id: '4', codigo: 'ABZ-02', nombre: 'Abrazadera Metálica Zinc 2 pulgadas' },
    { id: '5', codigo: 'CAB-12V', nombre: 'Cable Eléctrico 12AWG Verde' }
];

// Mock data for initial items to homologate
const INITIAL_ITEMS_MOCK: ProductoHomologacion[] = [
    {
        id: 1,
        xmlFile: 'FA-2023-0988.xml',
        productoXml: 'Resistencia Eléctrica 220V 500W',
        codigoXml: 'XML-RE-500-220',
        estado: 'pendiente'
    },
    {
        id: 2,
        xmlFile: 'FA-2023-0988.xml',
        productoXml: 'Cinta Aislante 3M Super 33+',
        codigoXml: '3M-S33-BLK',
        productoSistema: '[INV-009] Cinta Aislante Negra 3/4',
        estado: 'homologado'
    },
    {
        id: 3,
        xmlFile: 'FA-2023-0989.xml',
        productoXml: 'Abrazadera Metálica 2" Zinc',
        codigoXml: 'ABZ-MET-2Z',
        estado: 'pendiente'
    },
    {
        id: 4,
        xmlFile: 'NC-2023-0102.xml',
        productoXml: 'Cable THW No. 12 AWG Verde',
        codigoXml: 'ELC-12AWG-G',
        productoSistema: '[CON-012] Alambre Cobre #12 Verde',
        estado: 'homologado'
    }
];

const XML_FILES_MOCK = [
    { label: 'Todos los archivos', value: null },
    { label: 'FA-2023-0988.xml (Sept 24)', value: 'FA-2023-0988.xml' },
    { label: 'FA-2023-0989.xml (Sept 24)', value: 'FA-2023-0989.xml' },
    { label: 'NC-2023-0102.xml (Sept 25)', value: 'NC-2023-0102.xml' }
];

const HomologacionPage: React.FC = () => {
    const [items, setItems] = useState<ProductoHomologacion[]>(INITIAL_ITEMS_MOCK);
    const [selectedXml, setSelectedXml] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'homologado'>('todos');
    const [globalFilter, setGlobalFilter] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const toast = useRef<Toast>(null);

    const filteredItems = React.useMemo(() => {
        let result = items;

        if (selectedXml) {
            result = result.filter(item => item.xmlFile === selectedXml);
        }

        if (statusFilter !== 'todos') {
            result = result.filter(item => item.estado === statusFilter);
        }

        if (globalFilter) {
            const query = globalFilter.toLowerCase();
            result = result.filter(item =>
                item.productoXml.toLowerCase().includes(query) ||
                item.codigoXml.toLowerCase().includes(query) ||
                (item.productoSistema && item.productoSistema.toLowerCase().includes(query))
            );
        }

        return result;
    }, [items, selectedXml, statusFilter, globalFilter]);

    const searchProduct = (event: AutoCompleteCompleteEvent) => {
        const query = event.query.toLowerCase();
        const filtered = PRODUCTOS_HELISA_MOCK
            .filter(p => p.nombre.toLowerCase().includes(query) || p.codigo.toLowerCase().includes(query))
            .map(p => `[${p.codigo}] ${p.nombre}`);
        setSuggestions(filtered);
    };

    const onProductChange = (id: number, value: string) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    productoSistema: value,
                    estado: value ? 'homologado' : 'pendiente'
                };
            }
            return item;
        }));
    };

    const handleSave = (item: ProductoHomologacion) => {
        if (!item.productoSistema) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Debe seleccionar un producto del sistema para homologar.',
                life: 3000
            });
            return;
        }

        toast.current?.show({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Homologación guardada con éxito.',
            life: 3000
        });
    };

    const handleClear = (id: number) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    productoSistema: undefined,
                    estado: 'pendiente'
                };
            }
            return item;
        }));
        toast.current?.show({
            severity: 'info',
            summary: 'Limpiado',
            detail: 'Se ha eliminado la selección.',
            life: 2000
        });
    };

    const handleSaveAll = () => {
        toast.current?.show({
            severity: 'success',
            summary: 'Homologación guardada',
            detail: 'Se han actualizado los cambios en el sistema.',
            life: 3000
        });
    };

    const statusBodyTemplate = (rowData: ProductoHomologacion) => {
        const severity = rowData.estado === 'homologado' ? 'success' : 'warning';
        return (
            <Tag
                value={rowData.estado.toUpperCase()}
                severity={severity}
                className="status-tag"
            />
        );
    };

    const productSystemTemplate = (rowData: ProductoHomologacion) => {
        if (rowData.estado === 'homologado' && rowData.productoSistema) {
            return (
                <div className="product-selected-container">
                    <i className="pi pi-box mr-2 text-secondary"></i>
                    <span className="text-xs font-semibold">{rowData.productoSistema}</span>
                </div>
            );
        }

        return (
            <div className="autocomplete-wrapper">
                <i className="pi pi-search search-icon"></i>
                <AutoComplete
                    value={rowData.productoSistema || ''}
                    suggestions={suggestions}
                    completeMethod={searchProduct}
                    onChange={(e: AutoCompleteChangeEvent) => onProductChange(rowData.id, e.value)}
                    placeholder="Buscar en Helisa..."
                    className="w-full"
                    inputClassName="product-autocomplete-input"
                />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: ProductoHomologacion) => {
        return (
            <div className="actions-cell">
                <Button
                    icon="pi pi-check"
                    text
                    rounded
                    onClick={() => handleSave(rowData)}
                    tooltip="Guardar"
                    disabled={rowData.estado === 'homologado' && INITIAL_ITEMS_MOCK.find(i => i.id === rowData.id)?.estado === 'homologado'}
                />
                <Button
                    icon={rowData.estado === 'homologado' ? "pi pi-pencil" : "pi pi-refresh"}
                    text
                    rounded
                    severity="secondary"
                    onClick={() => handleClear(rowData.id)}
                    tooltip={rowData.estado === 'homologado' ? "Editar" : "Limpiar"}
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
                        options={XML_FILES_MOCK}
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
                    className="p-datatable-sm items-table"
                    rowHover
                    rowClassName={(data) => ({ 'row-pending': data.estado === 'pendiente' })}
                    emptyMessage="No se encontraron productos para homologar."
                >
                    <Column
                        header="PRODUCTO XML"
                        body={(rowData: ProductoHomologacion) => (
                            <div className="product-xml-cell">
                                <div className="font-bold">{rowData.productoXml}</div>
                                <div className="text-[10px] text-secondary">{rowData.xmlFile}</div>
                            </div>
                        )}
                        headerClassName="table-header-cell"
                    />
                    <Column
                        field="codigoXml"
                        header="CÓDIGO XML"
                        body={(rowData: ProductoHomologacion) => (
                            <span className="font-mono text-xs text-secondary">{rowData.codigoXml}</span>
                        )}
                        headerClassName="table-header-cell"
                    />
                    <Column
                        header="PRODUCTO EN SISTEMA (HELISA)"
                        body={productSystemTemplate}
                        headerClassName="table-header-cell"
                    />
                    <Column
                        field="estado"
                        header="ESTADO"
                        body={statusBodyTemplate}
                        headerClassName="table-header-cell"
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
