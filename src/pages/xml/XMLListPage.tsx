import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import PageTitle from '../../components/common/PageTitle';
import {
    FileUpload,
    type FileUploadSelectEvent,
    type FileUploadHeaderTemplateOptions,
    type FileUploadHandlerEvent
} from 'primereact/fileupload';
import { useXMLStore } from '../../store/xmlStore';
import type { XMLFile, XmlDetalle } from '../../types/xml';
import * as xmlService from '../../services/xmlService';
import '../../styles/xml-list.css';

const XMLListPage: React.FC = () => {
    const { xmlList, loading, fetchXMLList, uploadXML } = useXMLStore();
    const [displayUploadModal, setDisplayUploadModal] = useState(false);
    const [displayDetailModal, setDisplayDetailModal] = useState(false);
    const [xmlDetail, setXmlDetail] = useState<XmlDetalle | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const toast = useRef<Toast>(null);
    const fileUploadRef = useRef<FileUpload>(null);
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                await fetchXMLList();
            } catch {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la lista de XML.',
                    life: 3000
                });
            }
        };
        loadData();
    }, [fetchXMLList]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const statusBodyTemplate = () => {
        return (
            <Tag
                value="PENDIENTE"
                severity="secondary"
                className="status-tag"
            />
        );
    };

    const fileNameBodyTemplate = (rowData: XMLFile) => {
        return (
            <div className="filename-cell">
                <i className="pi pi-file" style={{ color: 'var(--color-primary)' }}></i>
                <span className="filename-text">{rowData.fileName}</span>
            </div>
        );
    };

    const handleViewDetail = async (fileName: string) => {
        setDetailLoading(true);
        setDisplayDetailModal(true);
        try {
            const data = await xmlService.parseXML(fileName);
            setXmlDetail(data);
        } catch (error: unknown) {
            console.error('Error parsing XML:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo obtener el detalle del XML.',
                life: 3000
            });
            setDisplayDetailModal(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const actionBodyTemplate = (rowData: XMLFile) => {
        return (
            <div className="actions-cell">
                <Button
                    icon="pi pi-eye"
                    text
                    rounded
                    severity="secondary"
                    size="small"
                    tooltip="Ver detalle"
                    onClick={() => handleViewDetail(rowData.fileName)}
                />
                <Button icon="pi pi-download" text rounded severity="secondary" size="small" tooltip="Descargar" />
            </div>
        );
    };

    const onRefresh = async () => {
        try {
            await fetchXMLList();
            toast.current?.show({
                severity: 'success',
                summary: 'Actualizado',
                detail: 'La bandeja de XML se ha actualizado correctamente.',
                life: 3000
            });
        } catch {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo actualizar la lista.',
                life: 3000
            });
        }
    };

    const onUploadClick = () => {
        setDisplayUploadModal(true);
    };

    const onTemplateSelect = (e: FileUploadSelectEvent) => {
        const selectedFiles = Array.from(e.files);
        const hasInvalidFile = selectedFiles.some(file => !file.name.toLowerCase().endsWith('.xml'));

        if (hasInvalidFile) {
            toast.current?.show({
                severity: 'error',
                summary: 'Archivo no válido',
                detail: 'Solo se permiten archivos XML.',
                life: 3000
            });
            // We can't easily filter out files here because they are already in the internal state of FileUpload
            // but for single upload multiple={false} it should be fine as it replaces the selection.
        }
        setFiles(e.files);
    };

    const onTemplateClear = () => {
        setFiles([]);
    };

    const onTemplateRemove = (file: File, callback: (event: React.SyntheticEvent) => void) => {
        setFiles((prevFiles) => prevFiles.filter((f) => f.name !== file.name));
        callback({} as React.SyntheticEvent);
    };

    const handleUploadSubmit = async (e: FileUploadHandlerEvent) => {
        const file = e.files[0];
        if (!file) return;

        try {
            await uploadXML(file);
            setDisplayUploadModal(false);
            setFiles([]);
            fileUploadRef.current?.clear();
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Archivos subidos correctamente.',
                life: 3000
            });
        } catch (error: unknown) {
            let errorMessage = 'No se pudo subir el archivo.';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: errorMessage,
                life: 3000
            });
        }
    };

    const headerTemplate = (options: FileUploadHeaderTemplateOptions) => {
        const { chooseButton, uploadButton, cancelButton } = options;
        const hasFiles = files.length > 0;

        const uploadBtn = uploadButton as React.ReactElement<{ disabled?: boolean; loading?: boolean; label?: string; icon?: string }>;
        const cancelBtn = cancelButton as React.ReactElement<{ disabled?: boolean; label?: string; icon?: string }>;

        return (
            <div className="upload-buttons-container">
                {chooseButton}
                {React.cloneElement(uploadBtn, {
                    disabled: !hasFiles || loading,
                    loading: loading,
                    label: 'Subir',
                    icon: 'pi pi-upload'
                } as object)}
                {React.cloneElement(cancelBtn, {
                    disabled: !hasFiles || loading,
                    label: 'Limpiar',
                    icon: 'pi pi-times'
                } as object)}
            </div>
        );
    };

    interface ItemTemplateOptions {
        onRemove(event: React.SyntheticEvent): void;
        previewElement: React.ReactNode;
        fileNameElement: React.ReactNode;
        sizeElement: React.ReactNode;
        removeElement: React.ReactNode;
        formatSize: string;
        files: File[];
        index: number;
        element: React.ReactNode;
        props: object;
    }

    const itemTemplate = (file: object, options: ItemTemplateOptions) => {
        const f = file as File;
        return (
            <div className="upload-item-container">
                <div className="upload-item-info">
                    <i className="pi pi-file upload-item-icon"></i>
                    <div className="upload-item-details">
                        <span className="upload-item-name">{f.name}</span>
                        <span className="upload-item-size">{options.formatSize}</span>
                    </div>
                </div>
                <Tag value="Pendiente" severity="warning" className="upload-item-status" />
                <Button
                    type="button"
                    icon="pi pi-times"
                    onClick={() => onTemplateRemove(f, options.onRemove)}
                    text
                    severity="secondary"
                    className="p-p-0"
                    style={{ width: 'auto', height: 'auto', padding: '0.25rem' }}
                />
            </div>
        );
    };

    const emptyTemplate = () => {
        return (
            <div className="upload-empty-area">
                <span className="upload-empty-text">Arrastra tu archivo aquí para importarlo.</span>
            </div>
        );
    };

    return (
        <div className="xml-list-container">
            <Toast ref={toast} />

            <div className="xml-list-header">
                <div className="xml-list-title-area">
                    <PageTitle title="Bandeja de XML" />
                    <p className="header-description">Gestión y procesamiento centralizado de facturación electrónica.</p>
                </div>
                <div className="xml-list-actions">
                    <Button
                        label="Actualizar"
                        icon="pi pi-refresh"
                        outlined
                        onClick={onRefresh}
                        loading={loading}
                        className="btn-refresh"
                    />
                    <Button
                        label="Subir XML"
                        icon="pi pi-cloud-upload"
                        onClick={onUploadClick}
                        className="btn-upload-main"
                    />
                </div>
            </div>

            <div className="metric-cards-grid">
                <div className="metric-card primary">
                    <div className="metric-icon-container">
                        <i className="pi pi-folder-open"></i>
                    </div>
                    <div className="metric-details">
                        <p className="metric-label">Total Archivos</p>
                        <div className="metric-value-wrapper">
                            <h3 className="metric-value">{xmlList.length}</h3>
                            <span className="metric-badge">Carpeta Local</span>
                        </div>
                    </div>
                </div>
                <div className="metric-card success">
                    <div className="metric-icon-container">
                        <i className="pi pi-check-circle"></i>
                    </div>
                    <div className="metric-details">
                        <p className="metric-label">Validados</p>
                        <div className="metric-value-wrapper">
                            <h3 className="metric-value">0</h3>
                            <span className="metric-badge success">+0%</span>
                        </div>
                    </div>
                </div>
                <div className="metric-card info">
                    <div className="metric-icon-container">
                        <i className="pi pi-sync"></i>
                    </div>
                    <div className="metric-details">
                        <p className="metric-label">Procesados</p>
                        <div className="metric-value-wrapper">
                            <h3 className="metric-value">0</h3>
                            <span className="metric-badge info">En Cola</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="xml-table-card">
                <DataTable
                    value={xmlList}
                    loading={loading}
                    paginator
                    rows={10}
                    className="p-datatable-sm xml-table"
                    style={{ width: '100%' }}
                    rowHover
                    tableStyle={{ minWidth: '50rem' }}
                    emptyMessage="No se encontraron archivos XML."
                >
                    <Column field="fileName" header="NOMBRE ARCHIVO" body={fileNameBodyTemplate} sortable className="col-filename" headerClassName="col-header" />
                    <Column field="size" header="TAMAÑO" body={(rowData: XMLFile) => formatSize(rowData.size)} sortable className="col-size" headerClassName="col-header" />
                    <Column field="lastModified" header="FECHA CARGA" sortable className="col-date" headerClassName="col-header" />
                    <Column field="estado" header="ESTADO" body={statusBodyTemplate} className="col-status" headerClassName="col-header" />
                    <Column header="ACCIONES" body={actionBodyTemplate} align="center" alignHeader="center" className="col-actions" headerClassName="col-header col-header-actions" />
                </DataTable>
            </div>

            <Dialog
                header={
                    <div className="modal-header-container">
                        <div className="modal-header-icon">
                            <i className="pi pi-file"></i>
                        </div>
                        <h3 className="modal-header-title">Detalle del XML</h3>
                    </div>
                }
                visible={displayDetailModal}
                className="detail-dialog"
                style={{ width: '70vw' }}
                onHide={() => {
                    setDisplayDetailModal(false);
                    setXmlDetail(null);
                }}
                footer={
                    <div className="flex justify-content-end pt-3">
                        <Button
                            label="Cerrar"
                            onClick={() => {
                                setDisplayDetailModal(false);
                                setXmlDetail(null);
                            }}
                            className="btn-dialog-close"
                        />
                    </div>
                }
                draggable={false}
                resizable={false}
            >
                {detailLoading ? (
                    <div className="flex flex-column justify-content-center align-items-center py-8">
                        <i className="pi pi-spin pi-spinner text-4xl mb-3" style={{ color: 'var(--color-primary)' }}></i>
                        <span className="text-xl font-medium text-secondary">Cargando detalle del XML...</span>
                        <p className="text-sm text-gray-400 mt-2">Estamos procesando la información del archivo.</p>
                    </div>
                ) : xmlDetail ? (
                    <div className="xml-mini-summary">
                        {/* Section 1: Header / Provider info */}
                        <div className="summary-section summary-header-section p-4 border-round-xl mb-3">
                            <div className="flex align-items-center gap-3 mb-3">
                                <div className="section-icon-container">
                                    <i className="pi pi-building text-2xl"></i>
                                </div>
                                <h4 className="m-0 text-xl font-bold">Información del Proveedor</h4>
                            </div>
                            <div className="grid">
                                <div className="col-12 md:col-3">
                                    <label className="summary-label">NIT / Identificación</label>
                                    <span className="summary-value font-bold">{xmlDetail.proveedor.nit}</span>
                                </div>
                                <div className="col-12 md:col-5">
                                    <label className="summary-label">Razón Social</label>
                                    <span className="summary-value font-bold">{xmlDetail.proveedor.nombre}</span>
                                </div>
                                <div className="col-12 md:col-4">
                                    <label className="summary-label">Dirección Fiscal</label>
                                    <span className="summary-value">{xmlDetail.proveedor.direccion}</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Products table */}
                        <div className="summary-section summary-products-section p-4 border-round-xl mb-3">
                            <div className="flex align-items-center justify-content-between mb-3">
                                <div className="flex align-items-center gap-3">
                                    <div className="section-icon-container products">
                                        <i className="pi pi-box text-2xl"></i>
                                    </div>
                                    <h4 className="m-0 text-xl font-bold">Detalle de Productos</h4>
                                </div>
                                <span className="p-badge p-badge-info font-bold px-3 py-2 border-round-lg">
                                    {xmlDetail.productos.length} items
                                </span>
                            </div>

                            <div className="table-container border-round-lg overflow-hidden border-1 border-gray-200 bg-white">
                                <DataTable
                                    value={xmlDetail.productos}
                                    className="p-datatable-sm"
                                    scrollable
                                    scrollHeight="300px"
                                    tableStyle={{ minWidth: '60rem' }}
                                    stripedRows
                                >
                                    <Column field="descripcion" header="DESCRIPCIÓN" headerClassName="summary-table-header" bodyStyle={{ fontSize: '0.8125rem', fontWeight: '500' }} />
                                    <Column field="referencia" header="REF." headerClassName="summary-table-header" align="center" bodyStyle={{ fontSize: '0.8125rem' }} />
                                    <Column field="cantidad" header="CANT." headerClassName="summary-table-header" align="center" bodyStyle={{ fontWeight: '600' }} />
                                    <Column
                                        field="valorUnitario"
                                        header="VALOR UNIT."
                                        align="right"
                                        headerClassName="summary-table-header text-right"
                                        body={(rowData) => rowData.valorUnitario.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                        bodyStyle={{ fontSize: '0.8125rem' }}
                                    />
                                    <Column
                                        field="impuesto"
                                        header="IMP."
                                        align="right"
                                        headerClassName="summary-table-header text-right"
                                        body={(rowData) => rowData.impuesto.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                        bodyStyle={{ fontSize: '0.8125rem', color: '#dc2626' }}
                                    />
                                    <Column
                                        field="valorTotal"
                                        header="TOTAL"
                                        align="right"
                                        headerClassName="summary-table-header text-right"
                                        body={(rowData) => rowData.valorTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                        bodyStyle={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-primary)' }}
                                    />
                                </DataTable>
                            </div>
                        </div>

                        {/* Section 3: Totals summary */}
                        <div className="summary-section summary-totals-section p-4 border-round-xl">
                            <div className="flex align-items-center gap-3 mb-4">
                                <div className="section-icon-container totals">
                                    <i className="pi pi-calculator text-2xl"></i>
                                </div>
                                <h4 className="m-0 text-xl font-bold">Resumen Financiero</h4>
                            </div>

                            <div className="flex justify-content-end">
                                <div className="totals-card p-4 border-round-lg shadow-1 w-full md:w-4 bg-white border-1 border-gray-100">
                                    <div className="flex justify-content-between py-2 border-bottom-1 border-gray-100 mb-2">
                                        <span className="text-secondary font-medium">Subtotal</span>
                                        <span className="font-bold">{xmlDetail.totales.subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
                                    </div>
                                    <div className="flex justify-content-between py-2 border-bottom-1 border-gray-100 mb-2">
                                        <span className="text-secondary font-medium">Total Impuestos</span>
                                        <span className="font-bold text-red-600">{xmlDetail.totales.impuestoTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
                                    </div>
                                    <div className="flex justify-content-between py-3 bg-blue-50 border-round-lg px-3 mt-3">
                                        <span className="text-blue-800 font-extrabold text-lg uppercase tracking-wider">Total Factura</span>
                                        <span className="text-blue-800 font-black text-2xl">{xmlDetail.totales.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Dialog>

            <Dialog
                header={
                    <div className="modal-header-container">
                        <div className="modal-header-icon">
                            <i className="pi pi-upload"></i>
                        </div>
                        <h3 className="modal-header-title">Subir Archivo XML</h3>
                    </div>
                }
                visible={displayUploadModal}
                className="upload-dialog"
                onHide={() => {
                    setDisplayUploadModal(false);
                    setFiles([]);
                    fileUploadRef.current?.clear();
                }}
                footer={
                    <div className="flex justify-content-end pt-3">
                        <Button
                            label="Cerrar"
                            onClick={() => {
                                setDisplayUploadModal(false);
                                setFiles([]);
                                fileUploadRef.current?.clear();
                            }}
                            className="btn-dialog-close"
                        />
                    </div>
                }
                draggable={false}
                resizable={false}
            >
                <div className="modal-body-wrapper">
                    <FileUpload
                        ref={fileUploadRef}
                        name="file"
                        multiple={false}
                        accept=".xml"
                        maxFileSize={10000000}
                        customUpload
                        uploadHandler={handleUploadSubmit}
                        onSelect={onTemplateSelect}
                        onClear={onTemplateClear}
                        headerTemplate={headerTemplate}
                        itemTemplate={itemTemplate}
                        emptyTemplate={emptyTemplate}
                        chooseOptions={{ icon: 'pi pi-plus', label: 'Seleccionar archivo', className: 'btn-upload-choose' }}
                        uploadOptions={{ icon: 'pi pi-cloud-upload', label: 'Subir', className: 'btn-upload-submit' }}
                        cancelOptions={{ icon: 'pi pi-times', label: 'Limpiar', className: 'btn-upload-cancel' }}
                    />
                </div>
            </Dialog>
        </div>
    );
};

export default XMLListPage;
