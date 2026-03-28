import React, { useState, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import PageTitle from '../../components/common/PageTitle';
import XmlTable from '../../components/procesamiento/XmlTable';
import XmlDetail from '../../components/procesamiento/XmlDetail';
import { useXmlFiles } from '../../hooks/useXmlFiles';
import { useXmlDetail } from '../../hooks/useXmlDetail';
import type { XMLFileItem, XMLValidationResult } from '../../types/xml';
import '../../styles/procesamiento.css';

const ProcesamientoPage: React.FC = () => {
    const {
        files,
        loading: filesLoading,
        refresh: refreshFiles,
        setFiles
    } = useXmlFiles();

    const {
        detail,
        loading: detailLoading,
        validating,
        processing,
        fetchDetail,
        validate,
        procesar,
        setDetail
    } = useXmlDetail();

    const [selectedFiles, setSelectedFiles] = useState<XMLFileItem[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [confirmBatchDialog, setConfirmBatchDialog] = useState(false);
    const [confirmIndividualDialog, setConfirmIndividualDialog] = useState(false);
    const [validationResult, setValidationResult] = useState<XMLValidationResult | null>(null);
    const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
    const toast = useRef<Toast>(null);
    const processableFiles = selectedFiles.filter(
        (f) => f.estado === 'VALIDADO' || f.estado === 'LISTO'
    );

    const handleRowClick = (id: number) => {
        setSelectedId(id);
        setValidationResult(null);
        setGeneratedDoc(null);
        fetchDetail(id);
    };

    const handleValidate = async () => {
        if (!detail) return;

        const result = await validate(detail.fileName);
        if (result) {
            setValidationResult(result);
            if (result.valido) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Validación exitosa',
                    detail: 'El documento es válido para su procesamiento.',
                    life: 3000
                });
                await fetchDetail(detail.id);
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Errores de validación',
                    detail: `Se encontraron ${result.errores.length} errores.`,
                    life: 5000
                });
            }
        } else {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo completar la validación.',
                life: 3000
            });
        }
    };

    const handleProcesarIndividual = async () => {
        if (!detail) return;

        const result = await procesar([detail.id]);
        if (result && result.success) {
            const docId = result.documentoGenerado || 'N/A';
            setGeneratedDoc(docId);
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Archivo procesado correctamente',
                life: 3000
            });
            // Update the file in the list to reflect processed state
            setFiles(prev => prev.map(f => f.id === detail.id ? { ...f, estado: 'PROCESADO' } : f));
            // Update the detail view state via fresh fetch
            await fetchDetail(detail.id);
            setConfirmIndividualDialog(false);
        } else {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: result?.mensaje || 'Error al procesar el archivo',
                life: 3000
            });
        }
    };

    const handleProcesarBatch = async () => {
        if (processableFiles.length === 0) return;

        const ids = processableFiles.map(f => f.id);
        const result = await procesar(ids);

        if (result && result.success) {
            toast.current?.show({
                severity: 'success',
                summary: 'Procesamiento Masivo',
                detail: `${processableFiles.length} archivos procesados con éxito.`,
                life: 3000
            });
            refreshFiles();
            setSelectedFiles([]);
            setConfirmBatchDialog(false);
        } else {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: result?.mensaje || 'Error en el procesamiento masivo',
                life: 3000
            });
        }
    };

    return (
        <div className="procesamiento-module-container h-full flex flex-column">
            <Toast ref={toast} />

            <div className="procesamiento-header-v2 mb-4">
                <div className="flex justify-content-between align-items-end">
                    <div>
                        <PageTitle title="Procesamiento de XML" />
                        <p className="subtitle text-secondary m-0">Gestión, validación y procesamiento de documentos</p>
                    </div>
                    <div className="header-actions flex gap-2">
                        <Button
                            label="Refrescar"
                            icon="pi pi-refresh"
                            onClick={refreshFiles}
                            loading={filesLoading}
                            className="p-button-outlined p-button-secondary"
                        />
                        <Button
                            label={`Procesar seleccionados (${selectedFiles.length})`}
                            icon="pi pi-play-circle"
                            onClick={() => setConfirmBatchDialog(true)}
                            disabled={processableFiles.length === 0 || processing}
                            className="p-button-primary"
                        />
                    </div>
                </div>
            </div>

            <div className="procesamiento-main-layout flex-grow-1 overflow-hidden grid m-0">
                {/* Column 1: List of Files */}
                <div className="col-12 lg:col-5 p-2 h-full flex flex-column overflow-hidden">
                    <div className="panel-card h-full flex flex-column shadow-1 border-round overflow-hidden bg-white">
                        <XmlTable
                            files={files}
                            selectedFiles={selectedFiles}
                            onSelectionChange={(e) => {
                                setSelectedFiles(e.value);
                                if (e.value.length === 0) {
                                    setSelectedId(null);
                                    setDetail(null);
                                } else {
                                    const lastSelected = e.value[e.value.length - 1];
                                    if (lastSelected.id !== selectedId) {
                                        setSelectedId(lastSelected.id);
                                        fetchDetail(lastSelected.id);
                                    }
                                }
                            }}
                            onRowClick={handleRowClick}
                            selectedId={selectedId}
                            loading={filesLoading}
                        />
                    </div>
                </div>

                {/* Column 2: File Detail */}
                <div className="col-12 lg:col-7 p-2 h-full flex flex-column overflow-hidden">
                    <div className="panel-card h-full p-4 shadow-1 border-round overflow-hidden bg-white">
                        {selectedId && detail ? (
                            <XmlDetail
                                detail={detail}
                                onValidate={handleValidate}
                                onProcesar={() => setConfirmIndividualDialog(true)}
                                validating={validating}
                                processing={processing}
                                loading={detailLoading}
                                validationResult={validationResult}
                                generatedDoc={generatedDoc}
                            />
                        ) : (
                            <div className="detail-empty-state">
                                <i className="pi pi-file-search text-4xl mb-3 opacity-50"></i>
                                <p>Selecciona un archivo para ver su detalle</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Batch Processing Confirmation */}
            <Dialog
                visible={confirmBatchDialog}
                onHide={() => setConfirmBatchDialog(false)}
                header="Confirmar Procesamiento Masivo"
                modal
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancelar" onClick={() => setConfirmBatchDialog(false)} className="p-button-text p-button-secondary" />
                        <Button label="Procesar Ahora" onClick={handleProcesarBatch} className="p-button-primary" autoFocus loading={processing} disabled={processableFiles.length === 0 || processing} />
                    </div>
                }
            >
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-exclamation-circle text-primary text-4xl"></i>
                    <div>
                        <p>
                            Se procesarán <b>{processableFiles.length}</b> de <b>{selectedFiles.length}</b> archivos seleccionados.
                        </p>
                        {processableFiles.length !== selectedFiles.length && (
                            <small className="text-yellow-600">
                                Algunos archivos tienen productos pendientes y no serán procesados.
                            </small>
                        )}
                    </div>
                </div>
            </Dialog>

            {/* Individual Processing Confirmation */}
            <Dialog
                visible={confirmIndividualDialog}
                onHide={() => setConfirmIndividualDialog(false)}
                header="Confirmar Procesamiento"
                modal
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancelar" onClick={() => setConfirmIndividualDialog(false)} className="p-button-text p-button-secondary" />
                        <Button label="Procesar Ahora" onClick={handleProcesarIndividual} className="p-button-success" autoFocus loading={processing} />
                    </div>
                }
            >
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-warning text-4xl"></i>
                    <div>
                        <p className="m-0 font-bold">Este documento será enviado al ERP y no podrá modificarse.</p>
                        <p className="mt-1 text-secondary">¿Desea continuar con el procesamiento?</p>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default ProcesamientoPage;
