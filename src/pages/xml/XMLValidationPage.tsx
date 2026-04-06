import React, { useState, useEffect, useRef, useCallback } from "react";
import { logger } from "../../utils/logger";
import {
  DataTable,
  type DataTableSelectionMultipleChangeEvent,
} from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import PageTitle from "../../components/common/PageTitle";
import XMLDetailDialog from "../../components/xml/XMLDetailDialog";
import ValidationResultDialog from "../../components/xml/ValidationResultDialog";
import HomologacionModal from "../../components/xml/HomologacionModal";
import { useXMLStore } from "../../store/xmlStore";
import type { XMLFile, XmlDetalle } from "../../types/xml";
import * as xmlService from "../../services/xmlService";
import "../../styles/xml-validation.css";
import {
  logUnknownError,
  isLicenciaBloqueadaError,
  getErrorMessage,
} from "../../utils/apiHandler";

const XMLValidationPage: React.FC = () => {
  const { xmlList, loading, validating, fetchXMLList, validateFiles } =
    useXMLStore();
  const [selectedFiles, setSelectedFiles] = useState<XMLFile[]>([]);
  const [displayDetailModal, setDisplayDetailModal] = useState(false);
  const [xmlDetail, setXmlDetail] = useState<XmlDetalle | null>(null);
  const [selectedDetailFile, setSelectedDetailFile] = useState<XMLFile | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);

  const [displayValidationModal, setDisplayValidationModal] = useState(false);
  const [displayHomologacionModal, setDisplayHomologacionModal] =
    useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [validationInfo, setValidationInfo] = useState<{
    fileName: string;
    errores?: string[];
    advertencias?: string[];
  } | null>(null);
  const [validatingFiles, setValidatingFiles] = useState<string[]>([]);

  const toast = useRef<Toast>(null);

  // Cargar lista de XMLs al montar el componente
  useEffect(() => {
    logger.log("[PAGE] XMLValidationPage mounted");
    fetchXMLList();
  }, [fetchXMLList]);

  /**
   * Maneja la visualización del detalle de un archivo XML
   */
  const handleViewDetail = async (fileName: string) => {
    setDetailLoading(true);
    setDisplayDetailModal(true);
    setSelectedDetailFile(
      xmlList.find((file) => file.fileName === fileName) || null,
    );
    try {
      const data = await xmlService.parseXML(fileName);
      setXmlDetail(data);
    } catch (error: unknown) {
      // No loguear ni mostrar toast para error de licencia (ya se redirige automáticamente)
      if (!isLicenciaBloqueadaError(error)) {
        logUnknownError(error, logger.error);
        setDisplayDetailModal(false);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: getErrorMessage(error),
          life: 5000,
        });
      }
    } finally {
      setDetailLoading(false);
    }
  };

  /**
   * Maneja la validación de uno o múltiples archivos XML
   */
  const handleValidate = useCallback(
    async (files: XMLFile[]) => {
      if (files.length === 0) return;

      const fileNamesToValidate = files.map((f) => f.fileName);
      setValidatingFiles((prev) => [...prev, ...fileNamesToValidate]);

      try {
        await validateFiles(fileNamesToValidate);
        await fetchXMLList();

        // Si es validación de un solo archivo, mostrar incidencias si las hay
        if (files.length === 1) {
          const updatedFile = useXMLStore
            .getState()
            .xmlList.find((f) => f.fileName === files[0].fileName);
          if (
            updatedFile &&
            (updatedFile.estado === "ERROR" ||
              (updatedFile.advertenciasValidacion &&
                updatedFile.advertenciasValidacion.length > 0))
          ) {
            handleViewIssues(updatedFile);
          }
        }

        toast.current?.show({
          severity: "success",
          summary: "Validación completada",
          detail: `${files.length} archivo(s) procesado(s).`,
          life: 3000,
        });
        setSelectedFiles([]);
      } catch (err: unknown) {
        // No mostrar toast para error de licencia (ya se redirige automáticamente)
        if (!isLicenciaBloqueadaError(err)) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: getErrorMessage(err),
            life: 5000,
          });
        }
      } finally {
        setValidatingFiles((prev) =>
          prev.filter((name) => !fileNamesToValidate.includes(name)),
        );
      }
    },
    [validateFiles, fetchXMLList],
  );

  /**
   * Template para mostrar el estado del archivo con Tag de PrimeReact
   */
  const statusBodyTemplate = (rowData: XMLFile) => {
    const severityMap: Record<
      string,
      "secondary" | "success" | "danger" | "info" | "warning"
    > = {
      CARGADO: "info",
      PENDIENTE: "warning",
      LISTO: "success",
      ERROR: "danger",
    };

    const estado = rowData.estado || "CARGADO";

    return (
      <Tag
        value={estado}
        severity={severityMap[estado] || "secondary"}
        className="status-tag"
      />
    );
  };

  /**
   * Template para mostrar el nombre del archivo con ícono
   */
  const fileNameBodyTemplate = (rowData: XMLFile) => {
    const isError = rowData.estado === "ERROR";
    return (
      <div className="filename-cell">
        <i
          className={`pi pi-file ${isError ? "text-error" : "text-primary"}`}
          aria-hidden="true"
        ></i>
        <span className="filename-text">{rowData.fileName}</span>
      </div>
    );
  };

  /**
   * Muestra el modal de incidencias (errores y advertencias) de un archivo
   */
  const handleViewIssues = (file: XMLFile) => {
    setValidationInfo({
      fileName: file.fileName,
      errores: file.erroresValidacion,
      advertencias: file.advertenciasValidacion,
    });
    setDisplayValidationModal(true);
  };

  /**
   * Abre el modal de homologación para un archivo específico
   */
  const handleHomologar = (fileName: string) => {
    setSelectedFileName(fileName);
    setDisplayHomologacionModal(true);
  };

  /**
   * Callback ejecutado cuando la homologación se completa exitosamente
   */
  const handleHomologacionSuccess = async () => {
    setDisplayHomologacionModal(false);
    if (selectedFileName) {
      await handleValidate([{ fileName: selectedFileName } as XMLFile]);
    }
  };

  /**
   * Template para mostrar las acciones disponibles según el estado del archivo
   */
  const actionBodyTemplate = (rowData: XMLFile) => {
    const isError = rowData.estado === "ERROR";
    const isHomologation = rowData.estado === "PENDIENTE";
    const isValidated = rowData.estado === "LISTO";
    const isCurrentlyValidating = validatingFiles.includes(rowData.fileName);

    return (
      <div
        className="actions-cell"
        role="group"
        aria-label={`Acciones para ${rowData.fileName}`}
      >
        <Button
          icon="pi pi-check"
          text
          rounded
          severity="success"
          size="small"
          tooltip="Validar archivo"
          onClick={() => handleValidate([rowData])}
          disabled={isValidated || validating || isCurrentlyValidating}
          loading={isCurrentlyValidating}
          aria-label={`Validar ${rowData.fileName}`}
        />
        <Button
          icon="pi pi-eye"
          text
          rounded
          severity="secondary"
          size="small"
          tooltip="Ver detalle"
          onClick={() => handleViewDetail(rowData.fileName)}
          aria-label={`Ver detalle de ${rowData.fileName}`}
        />
        {isHomologation && (
          <Button
            icon="pi pi-sync"
            text
            rounded
            severity="warning"
            size="small"
            tooltip="Homologar"
            onClick={() => handleHomologar(rowData.fileName)}
            aria-label={`Homologar ${rowData.fileName}`}
          />
        )}
        {(isError || isHomologation) && (
          <Button
            icon="pi pi-exclamation-triangle"
            text
            rounded
            severity={isError ? "danger" : "warning"}
            size="small"
            tooltip="Ver incidencias"
            onClick={() => handleViewIssues(rowData)}
            aria-label={`Ver incidencias de ${rowData.fileName}`}
          />
        )}
      </div>
    );
  };

  // Cálculo de métricas para las tarjetas de estadísticas
  const stats = {
    cargados: xmlList.filter((f) => f.estado === "CARGADO").length,
    pendientes: xmlList.filter((f) => f.estado === "PENDIENTE").length,
    listos: xmlList.filter((f) => f.estado === "LISTO").length,
    errores: xmlList.filter((f) => f.estado === "ERROR").length,
  };

  return (
    <div
      className="validation-page-container"
      role="main"
      aria-label="Página de validación de XML"
    >
      <Toast ref={toast} />

      <section className="validation-header" aria-labelledby="page-title">
        <div className="header-info">
          <PageTitle title="Validación de XML" id="page-title" />
          <p className="header-description">
            Gestione la integridad de sus documentos fiscales. Revise
            discrepancias y autorice el procesamiento hacia el ERP.
          </p>
        </div>
        <div className="header-actions">
          <Button
            label="Validar seleccionados"
            icon="pi pi-check-square"
            className="btn-validate-bulk"
            disabled={selectedFiles.length === 0 || validating}
            loading={validating}
            onClick={() => handleValidate(selectedFiles)}
            aria-disabled={selectedFiles.length === 0 || validating}
          />
        </div>
      </section>

      {/* Tarjetas de métricas con resumen de estados */}
      <div
        className="metric-cards-grid"
        role="region"
        aria-label="Métricas de documentos"
      >
        <div className="metric-card primary">
          <div className="metric-icon-container" aria-hidden="true">
            <i className="pi pi-clock"></i>
          </div>
          <div className="metric-details">
            <p className="metric-label">Cargados</p>
            <div className="metric-value-wrapper">
              <h3 className="metric-value">{stats.cargados}</h3>
              <span className="metric-badge">Por revisar</span>
            </div>
          </div>
        </div>
        <div className="metric-card success">
          <div className="metric-icon-container" aria-hidden="true">
            <i className="pi pi-check-circle"></i>
          </div>
          <div className="metric-details">
            <p className="metric-label">Listos</p>
            <div className="metric-value-wrapper">
              <h3 className="metric-value">{stats.listos}</h3>
              <span className="metric-badge success">Listos</span>
            </div>
          </div>
        </div>
        <div className="metric-card warning">
          <div className="metric-icon-container" aria-hidden="true">
            <i className="pi pi-sync"></i>
          </div>
          <div className="metric-details">
            <p className="metric-label">Pendientes</p>
            <div className="metric-value-wrapper">
              <h3 className="metric-value">{stats.pendientes}</h3>
              <span className="metric-badge warning">Mapeo manual</span>
            </div>
          </div>
        </div>
        <div className="metric-card error">
          <div className="metric-icon-container" aria-hidden="true">
            <i className="pi pi-exclamation-triangle"></i>
          </div>
          <div className="metric-details">
            <p className="metric-label">Errores</p>
            <div className="metric-value-wrapper">
              <h3 className="metric-value">{stats.errores}</h3>
              <span className="metric-badge error">Inválido</span>
            </div>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3 className="app-title">Documentos Recientes</h3>
          <div className="table-actions">
            <Button
              label="Filtros Avanzados"
              icon="pi pi-filter"
              text
              className="btn-table-action"
              aria-label="Aplicar filtros avanzados"
            />
            <Button
              label="Exportar"
              icon="pi pi-download"
              text
              className="btn-table-action"
              aria-label="Exportar datos"
            />
          </div>
        </div>

        {/* Tabla de documentos XML con selección múltiple */}
        <DataTable
          value={xmlList}
          loading={loading}
          selection={selectedFiles}
          onSelectionChange={(
            e: DataTableSelectionMultipleChangeEvent<XMLFile[]>,
          ) => setSelectedFiles(e.value)}
          selectionMode="multiple"
          dataKey="fileName"
          paginator
          rows={10}
          className="p-datatable-sm validation-table w-full"
          emptyMessage="No hay archivos XML para validar."
          rowHover
          aria-label="Tabla de documentos XML"
        >
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
            aria-label="Seleccionar"
          ></Column>
          <Column
            field="fileName"
            header="NOMBRE DEL ARCHIVO"
            body={fileNameBodyTemplate}
            sortable
          />
          <Column field="lastModified" header="FECHA DE CARGA" sortable />
          <Column
            field="proveedor"
            header="PROVEEDOR"
            body={(rowData: XMLFile) =>
              rowData.proveedor || "Proveedor Genérico"
            }
            sortable
          />
          <Column
            field="estado"
            header="ESTADO"
            body={statusBodyTemplate}
            sortable
          />
          <Column
            header="ACCIONES"
            body={actionBodyTemplate}
            className="text-right"
          />
        </DataTable>

        <div className="table-footer" role="status">
          <span>
            Mostrando {xmlList.length} de {xmlList.length} registros
          </span>
        </div>
      </div>

      {/* Modal de detalle de XML */}
      <XMLDetailDialog
        visible={displayDetailModal}
        onHide={() => {
          setDisplayDetailModal(false);
          setXmlDetail(null);
          setSelectedDetailFile(null);
        }}
        xmlDetail={xmlDetail}
        loading={detailLoading}
        fileName={selectedDetailFile?.fileName}
        fechaEmision={selectedDetailFile?.lastModified}
      />

      {/* Modal de resultados de validación (errores y advertencias) */}
      <ValidationResultDialog
        visible={displayValidationModal}
        onHide={() => {
          setDisplayValidationModal(false);
          setValidationInfo(null);
        }}
        fileName={validationInfo?.fileName || ""}
        errores={validationInfo?.errores}
        advertencias={validationInfo?.advertencias}
      />

      {/* Modal de homologación de productos */}
      <HomologacionModal
        visible={displayHomologacionModal}
        onHide={() => setDisplayHomologacionModal(false)}
        fileName={selectedFileName}
        onSuccess={handleHomologacionSuccess}
      />

      {/* Barra de progreso durante la validación */}
      {validating && (
        <div
          className="validation-progress-bar"
          role="progressbar"
          aria-label="Procesando validación"
        >
          <div className="progress-icon" aria-hidden="true">
            <i className="pi pi-cloud-download"></i>
          </div>
          <div className="progress-info">
            <div className="progress-text">
              <span>Procesando cola de validación...</span>
              <span className="progress-percent">85%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill w-85"></div>
            </div>
          </div>
          <Button
            label="Cancelar proceso"
            text
            severity="secondary"
            className="btn-cancel-process"
          />
        </div>
      )}
    </div>
  );
};

export default XMLValidationPage;
