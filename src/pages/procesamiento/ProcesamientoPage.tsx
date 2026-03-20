import React, { useState, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import type { DocumentoProcesamiento } from '../../types/procesamiento';
import { procesarDocumentos } from '../../services/procesamientoService';
import '../../styles/procesamiento.css';

const MOCK_DOCUMENTOS: DocumentoProcesamiento[] = [
    {
        id: 1,
        fileName: 'INV-2024-001.xml',
        proveedor: 'Logistics Global Solutions',
        fecha: '12 Oct 2023',
        estado: 'error',
        resultado: 'Fallo en esquema XML',
        fechaProcesamiento: '24 May 2024, 10:15'
    },
    {
        id: 2,
        fileName: 'INV-2024-002.xml',
        proveedor: 'Tech Innovators S.A.',
        fecha: '15 Oct 2023',
        estado: 'procesado',
        resultado: 'Éxito',
        fechaProcesamiento: '24 May 2024, 09:30'
    },
    {
        id: 3,
        fileName: 'INV-2024-045.xml',
        proveedor: 'Office Supplies Corp',
        fecha: '20 Oct 2023',
        estado: 'listo'
    },
    {
        id: 4,
        fileName: 'INV-2024-046.xml',
        proveedor: 'Global Trade Inc.',
        fecha: '21 Oct 2023',
        estado: 'listo'
    },
    {
        id: 5,
        fileName: 'INV-2024-047.xml',
        proveedor: 'Industrial Parts Ltd.',
        fecha: '22 Oct 2023',
        estado: 'listo'
    }
];

const ProcesamientoPage: React.FC = () => {
    const [documentos, setDocumentos] = useState<DocumentoProcesamiento[]>(MOCK_DOCUMENTOS);
    const [selectedDocumentos, setSelectedDocumentos] = useState<DocumentoProcesamiento[]>([]);
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const toast = useRef<Toast>(null);

    const metrics = {
        ready: documentos.filter(d => d.estado === 'listo').length,
        processed: documentos.filter(d => d.estado === 'procesado').length,
        error: documentos.filter(d => d.estado === 'error').length
    };

    const handleProcesarIndividual = async (id: number) => {
        setIsProcessing(true);
        setDocumentos(prev => prev.map(doc => doc.id === id ? { ...doc, estado: 'procesando' } : doc));

        try {
            await procesarDocumentos([id]);
            setDocumentos(prev => prev.map(doc =>
                doc.id === id
                    ? {
                        ...doc,
                        estado: 'procesado',
                        resultado: 'Éxito',
                        fechaProcesamiento: new Date().toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    }
                    : doc
            ));
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Documento procesado correctamente', life: 3000 });
        } catch {
            setDocumentos(prev => prev.map(doc => doc.id === id ? { ...doc, estado: 'error', resultado: 'Error en procesamiento' } : doc));
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar el documento', life: 3000 });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProcesarSeleccionados = async () => {
        if (!selectedDocumentos || selectedDocumentos.length === 0) return;

        const idsParaProcesar = selectedDocumentos
            .filter(doc => doc.estado !== 'procesado')
            .map(doc => doc.id);

        if (idsParaProcesar.length === 0) {
            toast.current?.show({ severity: 'info', summary: 'Información', detail: 'Los documentos seleccionados ya están procesados', life: 3000 });
            setConfirmDialog(false);
            return;
        }

        setIsProcessing(true);
        setConfirmDialog(false);

        setDocumentos(prev => prev.map(doc => idsParaProcesar.includes(doc.id) ? { ...doc, estado: 'procesando' } : doc));

        try {
            await procesarDocumentos(idsParaProcesar);
            setDocumentos(prev => prev.map(doc =>
                idsParaProcesar.includes(doc.id)
                    ? {
                        ...doc,
                        estado: 'procesado',
                        resultado: 'Éxito',
                        fechaProcesamiento: new Date().toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    }
                    : doc
            ));
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: `${idsParaProcesar.length} documentos procesados correctamente`, life: 3000 });
            setSelectedDocumentos([]);
        } catch {
            setDocumentos(prev => prev.map(doc => idsParaProcesar.includes(doc.id) ? { ...doc, estado: 'error', resultado: 'Error en procesamiento' } : doc));
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al procesar múltiples documentos', life: 3000 });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProcesarTodos = () => {
        const todosListos = documentos.filter(doc => doc.estado === 'listo');
        setSelectedDocumentos(todosListos);
        setConfirmDialog(true);
    };

    const statusBodyTemplate = (rowData: DocumentoProcesamiento) => {
        const severityMap: Record<string, "success" | "info" | "warning" | "danger" | "secondary"> = {
            'listo': 'secondary',
            'procesado': 'success',
            'error': 'danger',
            'procesando': 'info'
        };

        return (
            <Tag
                value={rowData.estado.toUpperCase()}
                severity={severityMap[rowData.estado]}
                className="status-tag"
            />
        );
    };

    const resultadoBodyTemplate = (rowData: DocumentoProcesamiento) => {
        if (rowData.estado === 'procesando') return <i className="pi pi-spin pi-spinner text-info"></i>;
        if (rowData.estado === 'procesado') return <i className="pi pi-check-circle text-success" title={rowData.resultado}></i>;
        if (rowData.estado === 'error') return <i className="pi pi-times-circle text-danger" title={rowData.resultado}></i>;
        return <i className="pi pi-hourglass text-secondary"></i>;
    };

    const actionBodyTemplate = (rowData: DocumentoProcesamiento) => {
        return (
            <div className="actions-column">
                <Button
                    icon="pi pi-eye"
                    text
                    rounded
                    className="btn-action"
                    tooltip="Ver detalle"
                />
                <Button
                    icon={rowData.estado === 'error' ? "pi pi-refresh" : "pi pi-play"}
                    text
                    rounded
                    className="btn-action"
                    tooltip="Procesar"
                    disabled={rowData.estado === 'procesado' || rowData.estado === 'procesando' || isProcessing}
                    onClick={() => handleProcesarIndividual(rowData.id)}
                />
            </div>
        );
    };

    return (
        <div className="procesamiento-container">
            <Toast ref={toast} />

            <div className="procesamiento-header">
                <div className="title-area">
                    <span>ERP BRIDGE CORE</span>
                    <h2>Procesamiento de Documentos</h2>
                </div>
                <div className="header-actions">
                    <Button
                        label="Procesar todos"
                        icon="pi pi-all_inbox"
                        className="btn-procesar-todos"
                        disabled={isProcessing || metrics.ready === 0}
                        onClick={handleProcesarTodos}
                    />
                    <Button
                        label="Procesar seleccionados"
                        icon="pi pi-play_circle"
                        className="btn-procesar-seleccionados"
                        disabled={isProcessing || selectedDocumentos.length === 0}
                        onClick={() => setConfirmDialog(true)}
                    />
                </div>
            </div>

            <div className="metrics-grid">
                <div className="metric-card ready">
                    <div className="metric-content">
                        <p className="metric-label">Listos para procesar</p>
                        <div className="metric-value-container">
                            <span className="metric-value">{metrics.ready}</span>
                            <span className="metric-badge ready">
                                <i className="pi pi-arrow-up mr-1" style={{ fontSize: '0.75rem' }}></i>
                                +12%
                            </span>
                        </div>
                    </div>
                    <i className="pi pi-pending_actions metric-icon-bg"></i>
                </div>

                <div className="metric-card processed">
                    <div className="metric-content">
                        <p className="metric-label">Procesados correctamente</p>
                        <div className="metric-value-container">
                            <span className="metric-value">{metrics.processed}</span>
                            <span className="metric-badge processed">99.6% Total</span>
                        </div>
                    </div>
                    <i className="pi pi-check_circle metric-icon-bg"></i>
                </div>

                <div className="metric-card error">
                    <div className="metric-content">
                        <p className="metric-label">Procesados con error</p>
                        <div className="metric-value-container">
                            <span className="metric-value" style={{ color: 'var(--color-error)' }}>{metrics.error}</span>
                            <span className="metric-badge error">Crítico</span>
                        </div>
                    </div>
                    <i className="pi pi-report metric-icon-bg"></i>
                </div>
            </div>

            <div className="procesamiento-table-card">
                <DataTable
                    value={documentos}
                    selection={selectedDocumentos}
                    onSelectionChange={(e) => setSelectedDocumentos(e.value as DocumentoProcesamiento[])}
                    dataKey="id"
                    className="procesamiento-table"
                    rowHover
                    selectionMode="multiple"
                    emptyMessage="No hay documentos disponibles para procesar."
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                    <Column
                        field="fileName"
                        header="Archivo XML"
                        body={(rowData: DocumentoProcesamiento) => <span className="filename-column">{rowData.fileName}</span>}
                    />
                    <Column
                        field="proveedor"
                        header="Proveedor"
                        body={(rowData: DocumentoProcesamiento) => <span className="provider-column">{rowData.proveedor || '-'}</span>}
                    />
                    <Column
                        field="fecha"
                        header="Fecha Documento"
                        body={(rowData: DocumentoProcesamiento) => <span className="date-column">{rowData.fecha || '-'}</span>}
                    />
                    <Column
                        field="estado"
                        header="Estado"
                        body={statusBodyTemplate}
                    />
                    <Column
                        header="Resultado"
                        body={resultadoBodyTemplate}
                        style={{ textAlign: 'center' }}
                    />
                    <Column
                        field="fechaProcesamiento"
                        header="Fecha Procesamiento"
                        body={(rowData: DocumentoProcesamiento) => (
                            <span className="date-column">
                                {rowData.fechaProcesamiento || (rowData.estado === 'listo' ? 'Pendiente' : '-')}
                            </span>
                        )}
                    />
                    <Column
                        header="Acciones"
                        body={actionBodyTemplate}
                        style={{ textAlign: 'right' }}
                    />
                </DataTable>
            </div>

            <Dialog
                visible={confirmDialog}
                onHide={() => setConfirmDialog(false)}
                className="confirmation-dialog"
                style={{ width: '400px' }}
                modal
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button
                            label="Cancelar"
                            onClick={() => setConfirmDialog(false)}
                            className="btn-dialog-cancel"
                        />
                        <Button
                            label="Sí, procesar"
                            onClick={handleProcesarSeleccionados}
                            className="btn-dialog-confirm"
                            autoFocus
                        />
                    </div>
                }
            >
                <div className="dialog-icon-container">
                    <i className="pi pi-sync" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h3 className="dialog-title">Confirmar Procesamiento</h3>
                <p className="dialog-message">
                    ¿Desea procesar los documentos seleccionados? Se validarán contra los esquemas vigentes y se sincronizarán con el ERP centralizado.
                </p>
            </Dialog>
        </div>
    );
};

export default ProcesamientoPage;
