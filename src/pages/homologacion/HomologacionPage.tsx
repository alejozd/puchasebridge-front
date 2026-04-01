import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { type AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Dropdown, type DropdownChangeEvent } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Tooltip } from "primereact/tooltip";
import HomologacionTable from "../../components/xml/HomologacionTable";
import PageTitle from "../../components/common/PageTitle";
import * as xmlService from "../../services/xmlService";
import * as erpService from "../../services/erpService";
import type { XMLFile, HomologarPayload } from "../../types/xml";
import type { ProductoMapeo } from "../../types/homologacion";
import type { ErpProducto, ErpUnidad } from "../../services/erpService";
import "../../styles/homologacion.css";
import { logger } from "../../utils/logger";
import { logUnknownError } from "../../utils/apiHandler";

const HomologacionPage: React.FC = () => {
  const [items, setItems] = useState<ProductoMapeo[]>([]);
  const [xmlFiles, setXmlFiles] = useState<XMLFile[]>([]);
  const [selectedXml, setSelectedXml] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "todos" | "pendiente" | "homologado"
  >("todos");
  const [globalFilter, setGlobalFilter] = useState("");
  const [unidades, setUnidades] = useState<ErpUnidad[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);

  const loadXmlFiles = useCallback(async () => {
    try {
      const files = await xmlService.getXMLList();
      setXmlFiles(files);
    } catch (e: unknown) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: e instanceof Error ? e.message : "Ocurrió un error inesperado",
        life: 5000,
      });
      logUnknownError(e, logger.error);
    }
  }, []);

  const getAutoSuggestion = useCallback(async (item: ProductoMapeo) => {
    // Mock suggestion logic: if name contains certain keywords or a simple search returns a close match
    if (item.estado?.toLowerCase() === "homologado" || item.productoSistema)
      return null;

    try {
      const results = await erpService.searchErpProductos(item.referenciaXML);
      if (results && results.length > 0) {
        // Return the first match as a suggestion
        return results[0];
      }
    } catch (e: unknown) {
      // Silently fail for background suggestions but log it
      logUnknownError(e, logger.error);
      return null;
    }
    return null;
  }, []);

  const loadProducts = useCallback(
    async (fileName: string) => {
      setLoading(true);
      try {
        const [documentData, erpUnits] = await Promise.all([
          xmlService.getProductosDocumento(fileName),
          erpService.getErpUnidades(),
        ]);

        const mappedItems: ProductoMapeo[] = documentData.productos.map((p) => ({
          referenciaXML: p.referenciaXML,
          nombreProducto: p.nombreProducto,
          unidadXML: p.unidadXML,
          unidadXMLNombre: p.unidadXMLNombre,
          estado: p.estado || "PENDIENTE",
          factor: p.factor || 1,
          productoSistema: p.referenciaErp
            ? `[${p.referenciaErp}] - ${p.nombreErp}`
            : "",
          referenciaErp: p.referenciaErp,
          codigoErp: p.codigoErp,
          subcodigoErp: p.subcodigoErp,
          nombreErp: p.nombreErp,
          unidadErp: p.unidadErp,
          unidadErpLabel: p.unidadErpNombre || "",
        }));

        setItems(mappedItems);
        setUnidades(erpUnits);

        // Apply suggestions for pending items in batch to avoid multiple re-renders
        const pendingItems = mappedItems.filter(
          (i) => i.estado?.toLowerCase() === "pendiente",
        );
        const suggestionsResults = await Promise.all(
          pendingItems.map(async (item) => {
            const suggestion = await getAutoSuggestion(item);
            return { item, suggestion };
          }),
        );

        setItems((prev) =>
          prev.map((p) => {
            const suggestionEntry = suggestionsResults.find(
              (s) =>
                s.item.referenciaXML === p.referenciaXML && s.suggestion,
            );
            if (suggestionEntry && !p.productoSistema) {
              const { suggestion } = suggestionEntry;
              const matchingUnit = erpUnits.find(
                (u) => u.sigla === suggestion!.unidadDefault,
              );
              return {
                ...p,
                productoSistema: `[${suggestion!.referencia}] - ${suggestion!.nombre}`,
                referenciaErp: suggestion!.referencia,
                codigoErp: suggestion!.codigo,
                subcodigoErp: suggestion!.subcodigo,
                nombreErp: suggestion!.nombre,
                unidadErp: matchingUnit?.codigo || "",
                unidadErpLabel: matchingUnit?.sigla || "",
                isSuggested: true,
              };
            }
            return p;
          }),
        );
      } catch (e: unknown) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: e instanceof Error ? e.message : "Ocurrió un error inesperado",
          life: 5000,
        });
        logUnknownError(e, logger.error);
      } finally {
        setLoading(false);
      }
    },
    [getAutoSuggestion],
  );

  useEffect(() => {
    loadXmlFiles();
  }, [loadXmlFiles]);

  useEffect(() => {
    if (selectedXml) {
      loadProducts(selectedXml);
    } else {
      setItems([]);
    }
  }, [selectedXml, loadProducts]);

  const filteredItems = React.useMemo(() => {
    let result = items;

    if (statusFilter !== "todos") {
      result = result.filter((item) => {
        const estado = item.estado ? item.estado.toLowerCase() : "pendiente";
        return estado === statusFilter;
      });
    }

    if (globalFilter) {
      const query = globalFilter.toLowerCase();
      result = result.filter((item) => {
        const nombre = item.nombreProducto?.toLowerCase() || "";
        const ref = item.referenciaXML?.toLowerCase() || "";
        const sistema = item.productoSistema?.toLowerCase() || "";
        return (
          nombre.includes(query) ||
          ref.includes(query) ||
          sistema.includes(query)
        );
      });
    }

    return result;
  }, [items, statusFilter, globalFilter]);

  const searchProduct = async (
    event: AutoCompleteCompleteEvent,
    rowData: ProductoMapeo,
  ) => {
    const query = (event.query || "").trim();

    try {
      const suggestions = await erpService.searchErpProductos(query);
      setItems((prev) =>
        prev.map((item) =>
          item.referenciaXML === rowData.referenciaXML
            ? { ...item, erpSuggestions: suggestions }
            : item,
        ),
      );
    } catch (e: unknown) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: e instanceof Error ? e.message : "Ocurrió un error inesperado",
        life: 5000,
      });
      logUnknownError(e, logger.error);
      // Silently fail
    }
  };

  const onProductSelect = (erpProd: ErpProducto, rowData: ProductoMapeo) => {
    const matchingUnit = unidades.find((u) => u.sigla === erpProd.unidadDefault);

    setItems((prev) =>
      prev.map((item) => {
        if (item.referenciaXML === rowData.referenciaXML) {
          return {
            ...item,
            productoSistema: `[${erpProd.referencia}] - ${erpProd.nombre}`,
            referenciaErp: erpProd.referencia,
            codigoErp: erpProd.codigo,
            subcodigoErp: erpProd.subcodigo,
            nombreErp: erpProd.nombre,
            unidadErp: matchingUnit?.codigo || "",
            unidadErpLabel: matchingUnit?.sigla || "",
          };
        }
        return item;
      }),
    );
  };

  const handleSave = async (item: ProductoMapeo, silent = false) => {
    if (
      !item.referenciaErp ||
      !item.unidadErp ||
      !item.codigoErp ||
      item.subcodigoErp === undefined ||
      !item.nombreErp
    ) {
      if (!silent) {
        toast.current?.show({
          severity: "warn",
          summary: "Atención",
          detail:
            "Debe seleccionar un producto del ERP válido (Código, Subcódigo y Nombre son requeridos).",
          life: 3000,
        });
      }
      return false;
    }

    try {
      const payload: HomologarPayload = {
        fileName: selectedXml!,
        referenciaXml: item.referenciaXML,
        unidadXml: item.unidadXML,
        codigoH: item.codigoErp!,
        subCodigoH: item.subcodigoErp!,
        nombreH: item.nombreErp!,
        referenciaErp: item.referenciaErp,
        unidadErp: item.unidadErp,
        factor: item.factor,
      };

      const res = await xmlService.homologarProducto(payload);
      if (res.success) {
        if (!silent) {
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: res.mensaje || "Homologación guardada con éxito.",
            life: 3000,
          });
          loadProducts(selectedXml!);
        }
        return true;
      } else {
        if (!silent) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: res.mensaje,
            life: 3000,
          });
        }
        return false;
      }
    } catch (e: unknown) {
      if (!silent) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: e instanceof Error ? e.message : "Ocurrió un error inesperado",
          life: 5000,
        });
      }
      logUnknownError(e, logger.error);
      return false;
    }
  };

  const handleProcess = async () => {
    if (!selectedXml) return;

    setLoading(true);
    try {
      const res = await xmlService.procesarArchivo(selectedXml);
      if (res.success) {
        toast.current?.show({
          severity: "success",
          summary: "Procesamiento Exitoso",
          detail:
            res.mensaje || "El archivo ha sido procesado correctamente.",
          life: 5000,
        });
        // Reload list and items
        loadXmlFiles();
        loadProducts(selectedXml);
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error de Procesamiento",
          detail: res.mensaje,
          life: 5000,
        });
      }
    } catch (e: unknown) {
      logUnknownError(e, logger.error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: e instanceof Error ? e.message : "Ocurrió un error inesperado",
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = items.filter(
    (i) => i.estado?.toLowerCase() === "pendiente",
  ).length;
  const isReadyToProcess = items.length > 0 && pendingCount === 0;

  interface XmlOption {
    label: string;
    value: string;
  }

  const xmlValueTemplate = (
    option: XmlOption | null,
    props: { placeholder?: string },
  ) => {
    if (option) {
      return (
        <div
          className="flex align-items-center truncate-text"
          style={{ maxWidth: "250px" }}
        >
          <span className="truncate-text" data-pr-tooltip={option.label}>
            {option.label}
          </span>
        </div>
      );
    }
    return props.placeholder;
  };

  const xmlItemTemplate = (option: XmlOption) => {
    return (
      <div className="flex align-items-center truncate-text">
        <span className="truncate-text" data-pr-tooltip={option.label}>
          {option.label}
        </span>
      </div>
    );
  };

  return (
    <div className="homologacion-container">
      <Toast ref={toast} />
      <Tooltip target=".truncate-text[data-pr-tooltip]" position="top" />

      <div className="homologacion-header">
        <div className="title-area">
          <PageTitle title="Homologación de Productos" />
          <p className="header-description">
            Vincule los items recibidos del XML con el catálogo maestro de
            Helisa.
          </p>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-card xml-filter">
          <label>ARCHIVO FUENTE (XML)</label>
          <Dropdown
            value={selectedXml}
            options={xmlFiles.map((f) => ({
              label: f.fileName,
              value: f.fileName,
            }))}
            onChange={(e: DropdownChangeEvent) => setSelectedXml(e.value)}
            placeholder="Seleccionar archivo"
            className="w-full dropdown-custom"
            valueTemplate={xmlValueTemplate}
            itemTemplate={xmlItemTemplate}
          />
        </div>
        <div className="filter-card status-filter">
          <label>FILTRAR POR ESTADO</label>
          <div className="status-buttons">
            <Button
              label="Todos"
              className={
                statusFilter === "todos" ? "btn-status active" : "btn-status"
              }
              onClick={() => setStatusFilter("todos")}
            />
            <Button
              label="Pendientes"
              className={
                statusFilter === "pendiente"
                  ? "btn-status active"
                  : "btn-status"
              }
              onClick={() => setStatusFilter("pendiente")}
            />
            <Button
              label="Homologados"
              className={
                statusFilter === "homologado"
                  ? "btn-status active"
                  : "btn-status"
              }
              onClick={() => setStatusFilter("homologado")}
            />
          </div>
        </div>
        <div className="filter-card stats-summary">
          <div className="stats-info">
            <span className="stats-number text-primary">{pendingCount}</span>
            <div className="stats-labels">
              <span className="font-bold">Pendientes</span>
              <span className="text-xs italic">Requieren acción manual</span>
            </div>
          </div>
          <div className="stats-icon">
            <i className="pi pi-clock"></i>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header-search flex justify-content-end">
          <span className="p-input-icon-right w-full max-w-sm">
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar por código o descripción..."
              className="w-full search-input pr-5"
            />
            <i className="pi pi-search" />
          </span>
        </div>
        <HomologacionTable
          productos={items}
          filteredProducts={filteredItems}
          loading={loading}
          unidades={unidades}
          updateRowState={(referenciaXML, newState) => {
            setItems((prev) =>
              prev.map((item) =>
                item.referenciaXML === referenciaXML
                  ? { ...item, ...newState }
                  : item,
              ),
            );
          }}
          handleSaveRow={handleSave}
          searchErpProducts={(e, row) => searchProduct(e, row)}
          onErpProductSelect={onProductSelect}
        />
        <div className="table-footer">
          <p>
            Mostrando {filteredItems.length} de {items.length} registros
          </p>
        </div>
      </div>

      <div className="info-cards-grid">
        <div className="info-card suggestion-card">
          <i className="pi pi-info-circle"></i>
          <div className="info-content">
            <h4>Sugerencias Inteligentes</h4>
            <p>
              Nuestro motor de IA ha detectado posibles coincidencias basadas en
              descripciones previas. Los campos marcados con azul claro son
              sugerencias automáticas.
            </p>
          </div>
        </div>
        <div className="info-card activity-card">
          <i className="pi pi-history"></i>
          <div className="info-content">
            <h4>Última Actividad</h4>
            <div className="activity-item-placeholder">
              <span className="font-bold">Usuario:</span> Admin Global <br />
              <span className="font-bold">Archivo:</span>{" "}
              {selectedXml || "---"} <br />
              <span className="font-bold">Fecha:</span>{" "}
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="floating-save">
        <div className="floating-label-container">
          <span>
            {isReadyToProcess
              ? "Listo para procesar 🚀"
              : "Faltan productos por homologar"}
          </span>
          <i
            className={
              isReadyToProcess
                ? "pi pi-check-circle text-success"
                : "pi pi-exclamation-triangle text-warning"
            }
          ></i>
        </div>
        <Button
          icon={isReadyToProcess ? "pi pi-send" : "pi pi-info-circle"}
          rounded
          className={`btn-floating-save ${isReadyToProcess ? "ready" : "not-ready"}`}
          onClick={isReadyToProcess ? handleProcess : undefined}
          disabled={!selectedXml || items.length === 0 || !isReadyToProcess}
          tooltip={isReadyToProcess ? "Procesar Archivo" : "Faltan homologaciones"}
        />
      </div>
    </div>
  );
};

export default HomologacionPage;
