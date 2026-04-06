import React, { useState, useRef } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import PageTitle from "../../components/common/PageTitle";
import XmlTable from "../../components/procesamiento/XmlTable";
import XmlDetail from "../../components/procesamiento/XmlDetail";
import { useXmlFiles } from "../../hooks/useXmlFiles";
import { useXmlDetail } from "../../hooks/useXmlDetail";
import type { XMLFileItem } from "../../types/xml";
import "../../styles/procesamiento.css";
import {
  isLicenciaBloqueadaError,
  getErrorMessage,
} from "../../utils/apiHandler";

const ProcesamientoPage: React.FC = () => {
  const {
    files,
    loading: filesLoading,
    refresh: refreshFiles,
    setFiles,
  } = useXmlFiles();
  const {
    detail,
    loading: detailLoading,
    processing,
    fetchDetail,
    procesar,
    setDetail,
  } = useXmlDetail();

  const [selectedFiles, setSelectedFiles] = useState<XMLFileItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmBatchDialog, setConfirmBatchDialog] = useState(false);
  const [confirmIndividualDialog, setConfirmIndividualDialog] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const toast = useRef<Toast>(null);

  const processableFiles = selectedFiles.filter(
    (f) => f.estado === "VALIDADO" || f.estado === "LISTO",
  );

  const handleRowClick = (id: number) => {
    setSelectedId(id);
    setGeneratedDoc(null);
    fetchDetail(id);
  };

  const handleProcesarIndividual = async () => {
    if (!detail) return;
    try {
      const result = await procesar([detail.fileName]);
      if (
        result &&
        (result.success || (result.procesados && result.procesados.length > 0))
      ) {
        setGeneratedDoc(result.documentoGenerado || result.procesados[0]);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Documento procesado",
          life: 3000,
        });
        setFiles((prev) =>
          prev.map((f) =>
            f.id === detail.id ? { ...f, estado: "PROCESADO" } : f,
          ),
        );
        setConfirmIndividualDialog(false);
      }
      await fetchDetail(detail.id);
      refreshFiles();
    } catch (e) {
      if (!isLicenciaBloqueadaError(e)) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: getErrorMessage(e),
          life: 5000,
        });
      }
    }
  };

  const handleProcesarBatch = async () => {
    if (processableFiles.length === 0) return;
    const filesNames = processableFiles.map((f) => f.fileName);
    try {
      const result = await procesar(filesNames);
      if (result && result.procesados?.length > 0) {
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Archivos procesados correctamente",
          life: 3000,
        });
        setSelectedFiles([]);
        setConfirmBatchDialog(false);
      }
      if (selectedId) await fetchDetail(selectedId);
      refreshFiles();
    } catch (e) {
      if (!isLicenciaBloqueadaError(e)) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: getErrorMessage(e),
          life: 5000,
        });
      }
    }
  };

  return (
    <div className="procesamiento-container flex flex-column h-full">
      <Toast ref={toast} />

      {/* 1. HEADER FIJO */}
      <div className="header-glass-container mb-3 flex justify-content-between align-items-center p-3 border-round-xl shadow-sm">
        <div>
          <PageTitle title="Procesamiento de XML" />
          <span className="text-secondary text-sm">
            Gestiona y procesa tus facturas electrónicas al ERP
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            icon="pi pi-refresh"
            onClick={refreshFiles}
            loading={filesLoading}
            className="p-button-text p-button-secondary"
            tooltip="Actualizar lista"
          />
          <Button
            label={`Procesar Seleccionados (${selectedFiles.length})`}
            icon="pi pi-bolt"
            onClick={() => setConfirmBatchDialog(true)}
            disabled={processableFiles.length === 0 || processing}
            className="p-button-primary shadow-2"
          />
        </div>
      </div>

      {/* 2. ÁREA DE CONTENIDO SCROLLABLE */}
      <div className="content-scrollable flex-grow-1 flex flex-column gap-3 overflow-auto pr-2">
        {/* PANEL SUPERIOR: TABLA */}
        <div
          className="panel-card-modern shadow-sm border-round-xl flex flex-column"
          style={{ minHeight: "350px" }}
        >
          <div className="panel-header-lite flex justify-content-between align-items-center px-4 py-2">
            <span className="font-bold uppercase text-xs text-primary">
              Bandeja de Entrada de Archivos
            </span>
            <span className="p-badge p-badge-info">
              {files.length} Archivos
            </span>
          </div>
          <div className="p-2 overflow-hidden">
            <XmlTable
              files={files}
              selectedFiles={selectedFiles}
              onSelectionChange={(e) => {
                setSelectedFiles(e.value);
                if (e.value.length > 0) {
                  const last = e.value[e.value.length - 1];
                  if (last.id !== selectedId) {
                    setSelectedId(last.id);
                    fetchDetail(last.id);
                  }
                } else {
                  setSelectedId(null);
                  setDetail(null);
                }
              }}
              onRowClick={handleRowClick}
              selectedId={selectedId}
              loading={filesLoading}
            />
          </div>
        </div>

        {/* PANEL INFERIOR: DETALLE SELECCIONADO */}
        <div
          className="panel-card-modern shadow-sm border-round-xl flex-grow-1 bg-white mb-3"
          style={{ minHeight: "400px" }}
        >
          {selectedId && detail ? (
            <div className="p-4">
              <XmlDetail
                detail={detail}
                onProcesar={() => setConfirmIndividualDialog(true)}
                processing={processing}
                loading={detailLoading}
                generatedDoc={generatedDoc}
              />
            </div>
          ) : (
            <div className="flex flex-column align-items-center justify-content-center h-full py-8 opacity-60">
              <i className="pi pi-mouse-pointer text-4xl mb-3 text-400"></i>
              <p className="text-xl font-medium text-500">
                Selecciona una fila arriba para ver el detalle
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DIALOGS (Sin cambios) */}
      <Dialog
        visible={confirmBatchDialog}
        onHide={() => setConfirmBatchDialog(false)}
        header="Confirmación Masiva"
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              onClick={() => setConfirmBatchDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Procesar Todo"
              onClick={handleProcesarBatch}
              className="p-button-primary"
              loading={processing}
            />
          </div>
        }
      >
        <p className="m-0">
          Se procesarán <b>{processableFiles.length}</b> archivos seleccionados.
          ¿Deseas continuar?
        </p>
      </Dialog>

      <Dialog
        visible={confirmIndividualDialog}
        onHide={() => setConfirmIndividualDialog(false)}
        header="Confirmar Procesamiento"
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Volver"
              onClick={() => setConfirmIndividualDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Procesar"
              onClick={handleProcesarIndividual}
              className="p-button-success"
              loading={processing}
            />
          </div>
        }
      >
        <p className="m-0">
          El documento seleccionado será enviado al ERP. Esta acción no se puede
          deshacer.
        </p>
      </Dialog>
    </div>
  );
};

export default ProcesamientoPage;
