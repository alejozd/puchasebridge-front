import React, { useState, useEffect, useRef } from 'react';
import { DataTable, type DataTableSelectionMultipleChangeEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import PageTitle from '../../components/common/PageTitle';
import { useXMLStore } from '../../store/xmlStore';
import type { XMLFile } from '../../types/xml';
import '../../styles/xml-validation.css';

const XMLValidationPage: React.FC = () => {
    const { xmlList, loading, validating, fetchXMLList, validateFiles } = useXMLStore();
    const [selectedFiles, setSelectedFiles] = useState<XMLFile[]>([]);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        fetchXMLList();
    }, [fetchXMLList]);

    const onValidate = async (files: XMLFile[]) => {
        if (files.length === 0) return;

        try {
            await validateFiles(files.map(f => f.fileName));
            toast.current?.show({
                severity: 'success',
                summary: 'Validación completada',
                detail: `${files.length} archivo(s) procesado(s).`,
                life: 3000
            });
            setSelectedFiles([]);
        } catch {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo completar la validación.',
                life: 3000
            });
        }
    };

    const statusBodyTemplate = (rowData: XMLFile) => {
        const severityMap: Record<string, "secondary" | "success" | "danger" | "info" | "warning"> = {
            'Pendiente': 'secondary',
            'Validado': 'success',
            'Error': 'danger',
            'Requiere homologación': 'warning'
        };

        const estado = rowData.estado || 'Pendiente';

        return (
            <Tag
                value={estado}
                severity={severityMap[estado]}
                className="status-tag"
            />
        );
    };

    const fileNameBodyTemplate = (rowData: XMLFile) => {
        const isError = rowData.estado === 'Error';
        return (
            <div className="filename-cell">
                <i className={`pi pi-file ${isError ? 'text-error' : 'text-primary'}`} style={{ color: isError ? 'var(--color-error)' : 'var(--color-primary)' }}></i>
                <span className="filename-text">{rowData.fileName}</span>
            </div>
        );
    };

    const actionBodyTemplate = (rowData: XMLFile) => {
        const isPending = rowData.estado === 'Pendiente' || !rowData.estado;
        const isError = rowData.estado === 'Error';
        const isHomologation = rowData.estado === 'Requiere homologación';

        return (
            <div className="actions-cell">
                {isPending && (
                    <Button
                        icon="pi pi-check-circle"
                        text rounded
                        severity="secondary"
                        size="small"
                        tooltip="Validar"
                        onClick={() => onValidate([rowData])}
                        disabled={validating}
                    />
                )}
                {isHomologation && (
                    <Button
                        icon="pi pi-sync"
                        text rounded
                        severity="warning"
                        size="small"
                        tooltip="Homologar"
                    />
                )}
                {isError && (
                    <Button
                        icon="pi pi-exclamation-triangle"
                        text rounded
                        severity="danger"
                        size="small"
                        tooltip="Ver errores"
                    />
                )}
                <Button icon="pi pi-eye" text rounded severity="secondary" size="small" tooltip="Ver detalle" />
            </div>
        );
    };

    const stats = {
        pendientes: xmlList.filter(f => !f.estado || f.estado === 'Pendiente').length,
        validados: xmlList.filter(f => f.estado === 'Validado').length,
        homologacion: xmlList.filter(f => f.estado === 'Requiere homologación').length,
        errores: xmlList.filter(f => f.estado === 'Error').length
    };

    return (
        <div className="validation-page-container">
            <Toast ref={toast} />

            <section className="validation-header">
                <div className="header-info">
                    <span className="subtitle">OPERACIONES</span>
                    <PageTitle title="Validación de XML" />
                    <p className="header-description">Gestione la integridad de sus documentos fiscales. Revise discrepancias y autorice el procesamiento hacia el ERP.</p>
                </div>
                <div className="header-actions">
                    <Button
                        label="Validar seleccionados"
                        icon="pi pi-check-square"
                        className="btn-validate-bulk"
                        disabled={selectedFiles.length === 0 || validating}
                        loading={validating}
                        onClick={() => onValidate(selectedFiles)}
                    />
                </div>
            </section>

            <div className="metric-cards-grid">
                <div className="metric-card primary">
                    <div className="metric-icon-container">
                        <i className="pi pi-clock"></i>
                    </div>
                    <div className="metric-details">
                        <p className="metric-label">Pendiente</p>
                        <div className="metric-value-wrapper">
                            <h3 className="metric-value">{stats.pendientes}</h3>
                            <span className="metric-badge">Por revisar</span>
                        </div>
                    </div>
                </div>
                <div className="metric-card success">
                    <div className="metric-icon-container">
                        <i className="pi pi-check-circle"></i>
                    </div>
                    <div className="metric-details">
                        <p className="metric-label">Validado</p>
                        <div className="metric-value-wrapper">
                            <h3 className="metric-value">{stats.validados}</h3>
                            <span className="metric-badge success">Listos</span>
                        </div>
                    </div>
                </div>
                <div className="metric-card warning">
                    <div className="metric-icon-container">
                        <i className="pi pi-sync"></i>
                    </div>
                    <div className="metric-details">
                        <p className="metric-label">Homologación</p>
                        <div className="metric-value-wrapper">
                            <h3 className="metric-value">{stats.homologacion}</h3>
                            <span className="metric-badge warning">Mapeo manual</span>
                        </div>
                    </div>
                </div>
                <div className="metric-card error">
                    <div className="metric-icon-container">
                        <i className="pi pi-exclamation-triangle"></i>
                    </div>
                    <div className="metric-details">
                        <p className="metric-label">Error</p>
                        <div className="metric-value-wrapper">
                            <h3 className="metric-value">{stats.errores}</h3>
                            <span className="metric-badge error">Inválido</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-card">
                <div className="table-header">
                    <h3>Documentos Recientes</h3>
                    <div className="table-actions">
                        <Button label="Filtros Avanzados" icon="pi pi-filter" text className="btn-table-action" />
                        <Button label="Exportar" icon="pi pi-download" text className="btn-table-action" />
                    </div>
                </div>

                <DataTable
                    value={xmlList}
                    loading={loading}
                    selection={selectedFiles}
                    onSelectionChange={(e: DataTableSelectionMultipleChangeEvent<XMLFile[]>) => setSelectedFiles(e.value)}
                    selectionMode="multiple"
                    dataKey="fileName"
                    paginator
                    rows={10}
                    className="p-datatable-sm validation-table"
                    style={{ width: '100%' }}
                    emptyMessage="No hay archivos XML para validar."
                    rowHover
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                    <Column field="fileName" header="NOMBRE DEL ARCHIVO" body={fileNameBodyTemplate} sortable />
                    <Column field="lastModified" header="FECHA DE CARGA" sortable />
                    <Column field="proveedor" header="PROVEEDOR" body={(rowData: XMLFile) => rowData.proveedor || 'Proveedor Genérico'} sortable />
                    <Column field="estado" header="ESTADO" body={statusBodyTemplate} sortable />
                    <Column field="resultadoValidacion" header="RESULTADO VALIDACIÓN" body={(rowData: XMLFile) => <span className="text-secondary italic">{rowData.resultadoValidacion || 'En cola de procesamiento...'}</span>} />
                    <Column header="ACCIONES" body={actionBodyTemplate} className="text-right" />
                </DataTable>

                <div className="table-footer">
                    <span>Mostrando {xmlList.length} de {xmlList.length} registros</span>
                </div>
            </div>

            {validating && (
                <div className="validation-progress-bar">
                    <div className="progress-icon">
                        <i className="pi pi-cloud-download"></i>
                    </div>
                    <div className="progress-info">
                        <div className="progress-text">
                            <span>Procesando cola de validación...</span>
                            <span className="progress-percent">85%</span>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill" style={{ width: '85%' }}></div>
                        </div>
                    </div>
                    <Button label="Cancelar proceso" text severity="secondary" className="btn-cancel-process" />
                </div>
            )}
        </div>
    );
};

export default XMLValidationPage;
