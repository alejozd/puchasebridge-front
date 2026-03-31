import React, { useState, useEffect, useRef } from "react";
import { logger } from '../../utils/logger';
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

const XMLValidationPage: React.FC = () => {
  const { xmlList, loading, validating, fetchXMLList, validateFiles } =
    useXMLStore();
  const [selectedFiles, setSelectedFiles] = useState<XMLFile[]>([]);
  const [displayDetailModal, setDisplayDetailModal] = useState(false);
  const [xmlDetail, setXmlDetail] = useState<XmlDetalle | null>(null);
  const [selectedDetailFile, setSelectedDetailFile] = useState<XMLFile | null>(null);
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

  useEffect(() => {
    logger.log("[PAGE] XMLValidationPage mounted");
    fetchXMLList();
  }, [fetchXMLList]);

  const handleViewDetail = async (fileName: string) => {
    setDetailLoading(true);
    setDisplayDetailModal(true);
    setSelectedDetailFile(xmlList.find((file) => file.fileName === fileName) || null);
    try {
      const data = await xmlService.parseXML(fileName);
      setXmlDetail(data);
    } catch (error: unknown) {
      logger.error("Error parsing XML:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo obtener el detalle del XML.",
        life: 3000,
      });
      setDisplayDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleValidate = async (files: XMLFile[]) => {
    if (files.length === 0) return;

    const fileNamesToValidate = files.map((f) => f.fileName);
    setValidatingFiles((prev) => [...prev, ...fileNamesToValidate]);

    try {
      await validateFiles(fileNamesToValidate);
      await fetchXMLList();

      // If single file validation, show issues if any
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
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo completar la validación.",
        life: 3000,
      });
    } finally {
      setValidatingFiles((prev) =>
        prev.filter((name) => !fileNamesToValidate.includes(name)),
      );
    }
  };

  const statusBodyTemplate = (rowData: XMLFile) => {
    const severityMap: Record<
      string,
      "secondary" | "success" | "danger" | "info" | "warning"
    > = {
      CARGADO: "secondary",
      LISTO: "success",
      ERROR: "danger",
      PENDIENTE: "warning",
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

  const fileNameBodyTemplate = (rowData: XMLFile) => {
    const isError = rowData.estado === "ERROR";
    return (
      <div className="filename-cell">
        <i
          className={`pi pi-file ${isError ? "text-error" : "text-primary"}`}
        ></i>
        <span className="filename-text">{rowData.fileName}</span>
      </div>
    );
  };

  const handleViewIssues = (file: XMLFile) => {
    setValidationInfo({
      fileName: file.fileName,
      errores: file.erroresValidacion,
      advertencias: file.advertenciasValidacion,
    });
    setDisplayValidationModal(true);
  };

  const handleHomologar = (fileName: string) => {
    setSelectedFileName(fileName);
    setDisplayHomologacionModal(true);
  };

  const handleHomologacionSuccess = async () => {
    setDisplayHomologacionModal(false);
    if (selectedFileName) {
      await handleValidate([{ fileName: selectedFileName } as XMLFile]);
    }
  };

  const actionBodyTemplate = (rowData: XMLFile) => {
    const isError = rowData.estado === "ERROR";
    const isHomologation = rowData.estado === "PENDIENTE";
    const isValidated = rowData.estado === "LISTO";
    const isCurrentlyValidating = validatingFiles.includes(rowData.fileName);

    return (
      <div className="actions-cell">
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
        />
        <Button
          icon="pi pi-eye"
          text
          rounded
          severity="secondary"
          size="small"
          tooltip="Ver detalle"
          onClick={() => handleViewDetail(rowData.fileName)}
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
          />
        )}
      </div>
    );
  };

  const stats = {
    cargados: xmlList.filter((f) => f.estado === "CARGADO").length,
    pendientes: xmlList.filter((f) => f.estado === "PENDIENTE").length,
    listos: xmlList.filter((f) => f.estado === "LISTO").length,
    errores: xmlList.filter((f) => f.estado === "ERROR").length,
  };

  return (
    <div className="validation-page-container">
      <Toast ref={toast} />

      <section className="validation-header">
        <div className="header-info">
          <span className="subtitle">OPERACIONES</span>
          <PageTitle title="Validación de XML" />
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
          />
        </div>
      </section>

      <div className="metric-cards-grid">
        <div className="metric-card primary">
          <div className="metric-icon-container">
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
          <div className="metric-icon-container">
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
          <div className="metric-icon-container">
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
          <div className="metric-icon-container">
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
            />
            <Button
              label="Exportar"
              icon="pi pi-download"
              text
              className="btn-table-action"
            />
          </div>
        </div>

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
        >
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
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

        <div className="table-footer">
          <span>
            Mostrando {xmlList.length} de {xmlList.length} registros
          </span>
        </div>
      </div>

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

      <HomologacionModal
        visible={displayHomologacionModal}
        onHide={() => setDisplayHomologacionModal(false)}
        fileName={selectedFileName}
        onSuccess={handleHomologacionSuccess}
      />

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
