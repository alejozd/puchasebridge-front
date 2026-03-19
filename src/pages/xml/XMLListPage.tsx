import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import '../../styles/xml-list.css';

interface XMLDocument {
    id: string;
    nombreArchivo: string;
    fechaCarga: string;
    estado: 'Pendiente' | 'Validado' | 'Error' | 'Procesado';
    proveedor: string;
    totalFactura: string;
}

const XMLListPage: React.FC = () => {
    const [documents] = useState<XMLDocument[]>([
        { id: '1', nombreArchivo: 'FAC_2023_001.xml', fechaCarga: '24 Oct 2023, 10:30', estado: 'Procesado', proveedor: 'TechSolutions S.A.', totalFactura: 'USD 12,450.00' },
        { id: '2', nombreArchivo: 'NOMINA_OCT_V2.xml', fechaCarga: '24 Oct 2023, 09:15', estado: 'Validado', proveedor: 'Logistics Corp', totalFactura: 'USD 8,200.50' },
        { id: '3', nombreArchivo: 'SERV_CLOUD_INV.xml', fechaCarga: '23 Oct 2023, 16:45', estado: 'Error', proveedor: 'Cloud Infrastructure', totalFactura: 'USD 1,200.00' },
        { id: '4', nombreArchivo: 'TRANS_33291.xml', fechaCarga: '23 Oct 2023, 14:20', estado: 'Pendiente', proveedor: 'Global Freight', totalFactura: 'USD 540.00' },
    ]);

    const [loading, setLoading] = useState(false);
    const [displayUploadModal, setDisplayUploadModal] = useState(false);
    const toast = useRef<Toast>(null);

    const getStatusSeverity = (status: string) => {
        switch (status) {
            case 'Pendiente': return 'secondary';
            case 'Validado': return 'info';
            case 'Error': return 'danger';
            case 'Procesado': return 'success';
            default: return 'info';
        }
    };

    const statusBodyTemplate = (rowData: XMLDocument) => {
        return (
            <Tag
                value={rowData.estado.toUpperCase()}
                severity={getStatusSeverity(rowData.estado)}
                className="status-tag"
            />
        );
    };

    const fileNameBodyTemplate = (rowData: XMLDocument) => {
        return (
            <div className="filename-cell">
                <i
                    className="pi pi-file"
                    style={{ color: rowData.estado === 'Error' ? 'var(--color-error)' : 'var(--color-primary)' }}
                ></i>
                <span className="filename-text">{rowData.nombreArchivo}</span>
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

    const onRefresh = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'La bandeja de XML se ha actualizado correctamente.', life: 3000 });
        }, 1000);
    };

    const onUploadClick = () => {
        setDisplayUploadModal(true);
    };

    const handleFileUpload = (e?: any) => {
        if (e) {
            // Logic for file handling would go here later
        }
        setDisplayUploadModal(false);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Archivos subidos correctamente.', life: 3000 });
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
                    value={documents}
                    loading={loading}
                    paginator
                    rows={10}
                    className="p-datatable-sm xml-table"
                    rowHover
                    tableStyle={{ minWidth: '50rem' }}
                >
                    <Column field="nombreArchivo" header="NOMBRE DEL ARCHIVO" body={fileNameBodyTemplate} sortable className="col-filename" headerClassName="col-header" />
                    <Column field="fechaCarga" header="FECHA DE CARGA" sortable className="col-date" headerClassName="col-header" />
                    <Column field="estado" header="ESTADO" body={statusBodyTemplate} sortable className="col-status" headerClassName="col-header" />
                    <Column field="proveedor" header="PROVEEDOR" sortable className="col-provider" headerClassName="col-header" />
                    <Column field="totalFactura" header="TOTAL FACTURA" sortable className="col-total" headerClassName="col-header" />
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
                        name="demo[]"
                        auto
                        multiple
                        accept=".xml,.zip"
                        maxFileSize={10000000}
                        customUpload
                        uploadHandler={handleFileUpload}
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
                            onClick={() => handleFileUpload()}
                            className="btn-modal-submit"
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default XMLListPage;
