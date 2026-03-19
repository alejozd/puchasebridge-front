import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { useXMLStore } from '../../store/xmlStore';
import type { XMLFile } from '../../types/xml';
import '../../styles/xml-list.css';

const XMLListPage: React.FC = () => {
    const { xmlList, loading, fetchXMLList, uploadXML } = useXMLStore();
    const [displayUploadModal, setDisplayUploadModal] = useState(false);
    const toast = useRef<Toast>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                await fetchXMLList();
            } catch (error) {
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
        } catch (error) {
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

    const handleFileSelect = (e: any) => {
        if (e.files && e.files.length > 0) {
            setSelectedFile(e.files[0]);
        }
    };

    const handleUploadSubmit = async () => {
        if (!selectedFile) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Por favor selecciona un archivo.',
                life: 3000
            });
            return;
        }

        try {
            await uploadXML(selectedFile);
            setDisplayUploadModal(false);
            setSelectedFile(null);
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Archivos subidos correctamente.',
                life: 3000
            });
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo subir el archivo.',
                life: 3000
            });
        }
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
                onHide={() => setDisplayUploadModal(false)}
                draggable={false}
                resizable={false}
            >
                <div className="modal-body-wrapper">
                    <FileUpload
                        name="file"
                        auto
                        multiple={false}
                        accept=".xml,.zip"
                        maxFileSize={10000000}
                        customUpload
                        onSelect={handleFileSelect}
                        uploadHandler={handleUploadSubmit}
                        emptyTemplate={
                            <div className="upload-area">
                                <div className="upload-icon-container">
                                    <i className="pi pi-cloud-upload"></i>
                                </div>
                                <p className="upload-text-main">Arrastra tus archivos aquí</p>
                                <p className="upload-text-sub">Soporta formatos XML comprimidos en .zip</p>
                                <Button
                                    label="Seleccionar archivo"
                                    text
                                    className="mt-3 btn-select-file"
                                />
                            </div>
                        }
                        chooseLabel="Seleccionar"
                    />

                    <div className="modal-footer">
                        <Button label="Cancelar" text severity="secondary" onClick={() => setDisplayUploadModal(false)} className="btn-modal-cancel" />
                        <Button
                            label="Subir"
                            onClick={handleUploadSubmit}
                            className="btn-modal-submit"
                            loading={loading}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default XMLListPage;
