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
                    <Column header="ACCIONES" body={actionBodyTemplate} className="col-actions" headerClassName="col-header col-header-actions" />
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
                    <div className="flex justify-content-center align-items-center py-8">
                        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: 'var(--color-primary)' }}></i>
                        <span className="ml-2">Cargando detalle...</span>
                    </div>
                ) : xmlDetail ? (
                    <div className="xml-detail-content">
                        <div className="detail-section provider-info mb-4">
                            <h4 className="detail-section-title"><i className="pi pi-building mr-2"></i>Información del Proveedor</h4>
                            <div className="grid mt-2">
                                <div className="col-12 md:col-4">
                                    <span className="detail-label">NIT:</span>
                                    <span className="detail-value">{xmlDetail.proveedor.nit}</span>
                                </div>
                                <div className="col-12 md:col-8">
                                    <span className="detail-label">Nombre:</span>
                                    <span className="detail-value">{xmlDetail.proveedor.nombre}</span>
                                </div>
                                <div className="col-12 mt-2">
                                    <span className="detail-label">Dirección:</span>
                                    <span className="detail-value">{xmlDetail.proveedor.direccion}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section products-info mb-4">
                            <h4 className="detail-section-title"><i className="pi pi-box mr-2"></i>Productos</h4>
                            <DataTable
                                value={xmlDetail.productos}
                                className="p-datatable-sm mt-2"
                                scrollable
                                scrollHeight="300px"
                                tableStyle={{ minWidth: '50rem' }}
                            >
                                <Column field="descripcion" header="DESCRIPCIÓN" headerClassName="col-header" />
                                <Column field="referencia" header="REFERENCIA" headerClassName="col-header" />
                                <Column field="cantidad" header="CANTIDAD" headerClassName="col-header" />
                                <Column
                                    field="valorUnitario"
                                    header="VALOR UNITARIO"
                                    body={(rowData) => rowData.valorUnitario.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                    headerClassName="col-header"
                                />
                                <Column
                                    field="valorTotal"
                                    header="TOTAL"
                                    body={(rowData) => rowData.valorTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                    headerClassName="col-header"
                                />
                                <Column
                                    field="impuesto"
                                    header="IMPUESTO"
                                    body={(rowData) => rowData.impuesto.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                    headerClassName="col-header"
                                />
                            </DataTable>
                        </div>

                        <div className="detail-section totals-info mt-4 p-3 border-round bg-slate-50">
                            <div className="flex flex-column align-items-end">
                                <div className="flex justify-content-between w-12 md:w-3 border-bottom-1 border-gray-200 py-2">
                                    <span className="font-medium">Subtotal:</span>
                                    <span>{xmlDetail.totales.subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
                                </div>
                                <div className="flex justify-content-between w-12 md:w-3 border-bottom-1 border-gray-200 py-2">
                                    <span className="font-medium">Impuestos:</span>
                                    <span>{xmlDetail.totales.impuestoTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
                                </div>
                                <div className="flex justify-content-between w-12 md:w-3 py-2 text-xl font-bold text-blue-700">
                                    <span>Total Final:</span>
                                    <span>{xmlDetail.totales.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
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
