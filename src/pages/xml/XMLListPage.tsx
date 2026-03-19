import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import {
    FileUpload,
    type FileUploadSelectEvent,
    type FileUploadHeaderTemplateOptions,
    type FileUploadHandlerEvent
} from 'primereact/fileupload';
import { useXMLStore } from '../../store/xmlStore';
import type { XMLFile } from '../../types/xml';
import '../../styles/xml-list.css';

const XMLListPage: React.FC = () => {
    const { xmlList, loading, fetchXMLList, uploadXML } = useXMLStore();
    const [displayUploadModal, setDisplayUploadModal] = useState(false);
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

    const actionBodyTemplate = () => {
        return (
            <div className="actions-cell">
                <Button icon="pi pi-eye" text rounded severity="secondary" size="small" tooltip="Ver detalle" />
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
                    <h2>Bandeja de XML</h2>
                    <p>Gestión y procesamiento centralizado de facturación electrónica.</p>
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

            {/* Placeholder for future stats cards */}
            {/*
            <div className="stats-grid">
                <div className="stat-card">
                    <p className="stat-label">Total Procesados</p>
                    <div className="stat-value-container">
                        <h3 className="stat-value">---</h3>
                    </div>
                </div>
                ...
            </div>
            */}

            <div className="xml-table-card">
                <DataTable
                    value={xmlList}
                    loading={loading}
                    paginator
                    rows={10}
                    className="p-datatable-sm xml-table"
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
