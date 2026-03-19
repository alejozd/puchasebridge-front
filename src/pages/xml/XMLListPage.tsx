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

    const getStatusSeverity = (status?: string) => {
        if (!status) return 'info';
        switch (status) {
            case 'Pendiente': return 'secondary';
            case 'Validado': return 'info';
            case 'Error': return 'danger';
            case 'Procesado': return 'success';
            default: return 'info';
        }
    };

    const statusBodyTemplate = (rowData: XMLFile) => {
        return (
            <Tag
                value={rowData.estado?.toUpperCase() || 'N/A'}
                severity={getStatusSeverity(rowData.estado)}
                className="status-tag"
            />
        );
    };

    const fileNameBodyTemplate = (rowData: XMLFile) => {
        return (
            <div className="filename-cell">
                <i
                    className="pi pi-file"
                    style={{ color: rowData.estado === 'Error' ? 'var(--color-error)' : 'var(--color-primary)' }}
                ></i>
                <span className="filename-text">{rowData.fileName}</span>
            </div>
        );
    };

    const actionBodyTemplate = () => {
        return (
            <div className="actions-cell">
                <Button icon="pi pi-eye" text rounded severity="secondary" size="small" tooltip="Ver detalle" />
                <Button icon="pi pi-verified" text rounded severity="secondary" size="small" tooltip="Validar" />
                <Button icon="pi pi-trash" text rounded severity="danger" size="small" tooltip="Eliminar" />
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

            <div className="stats-grid">
                <div className="stat-card">
                    <p className="stat-label">Total Procesados</p>
                    <div className="stat-value-container">
                        <h3 className="stat-value">1,284</h3>
                        <span className="stat-change positive">+12%</span>
                    </div>
                </div>
                <div className="stat-card pendientes">
                    <p className="stat-label">Pendientes</p>
                    <div className="stat-value-container">
                        <h3 className="stat-value">42</h3>
                        <span className="stat-change neutral">Bajo revisión</span>
                    </div>
                </div>
                <div className="stat-card errores">
                    <p className="stat-label">Errores</p>
                    <div className="stat-value-container">
                        <h3 className="stat-value">5</h3>
                        <span className="stat-change negative">Acción requerida</span>
                    </div>
                </div>
                <div className="stat-card config">
                    <p className="stat-config-text">
                        Configurar alertas automáticas
                    </p>
                </div>
            </div>

            <div className="xml-table-card">
                <DataTable
                    value={xmlList}
                    loading={loading}
                    paginator
                    rows={10}
                    className="p-datatable-sm xml-table"
                    rowHover
                    tableStyle={{ minWidth: '50rem' }}
                >
                    <Column field="fileName" header="NOMBRE DEL ARCHIVO" body={fileNameBodyTemplate} sortable className="col-filename" headerClassName="col-header" />
                    <Column field="fecha" header="FECHA DE CARGA" sortable className="col-date" headerClassName="col-header" />
                    <Column field="estado" header="ESTADO" body={statusBodyTemplate} sortable className="col-status" headerClassName="col-header" />
                    <Column field="proveedor" header="PROVEEDOR" sortable className="col-provider" headerClassName="col-header" />
                    <Column field="total" header="TOTAL FACTURA" sortable className="col-total" headerClassName="col-header" />
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
