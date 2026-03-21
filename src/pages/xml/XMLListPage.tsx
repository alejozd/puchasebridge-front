import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import XMLDetailDialog from '../../components/xml/XMLDetailDialog';
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

    const statusBodyTemplate = (rowData: XMLFile) => {
        const severityMap: Record<string, "secondary" | "success" | "danger" | "info" | "warning"> = {
            'Pendiente': 'secondary',
            'Validado': 'success',
            'Con errores': 'danger',
            'Requiere homologación': 'warning'
        };

        const estado = rowData.estado || 'Pendiente';

        return (
            <Tag
                value={estado.toUpperCase()}
                severity={severityMap[estado]}
                className="status-tag"
            />
        );
    };

    const fileNameBodyTemplate = (rowData: XMLFile) => {
        const isError = rowData.estado === 'Con errores';
        return (
            <div className="filename-cell">
                <i className={`pi pi-file ${isError ? 'text-error' : 'text-primary'}`} style={{ color: isError ? 'var(--color-error)' : 'var(--color-primary)' }}></i>
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

            <XMLDetailDialog
                visible={displayDetailModal}
                onHide={() => {
                    setDisplayDetailModal(false);
                    setXmlDetail(null);
                }}
                xmlDetail={xmlDetail}
                loading={detailLoading}
            />

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
