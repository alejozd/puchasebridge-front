import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import { type AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useXMLStore } from "../../store/xmlStore";
import * as xmlService from "../../services/xmlService";
import * as erpService from "../../services/erpService";
import type { HomologarPayload } from "../../types/xml";
import type { ProductoMapeo } from "../../types/homologacion";
import type { ErpProducto, ErpUnidad } from "../../services/erpService";
import HomologacionTable from "./HomologacionTable";
import "../../styles/HomologacionModal.css";

interface HomologacionModalProps {
  visible: boolean;
  onHide: () => void;
  fileName: string;
  onSuccess: () => void;
}

type EstadoFiltro = "todos" | "pendiente" | "homologado";

const HomologacionModal: React.FC<HomologacionModalProps> = ({
  visible,
  onHide,
  fileName,
  onSuccess,
}) => {
  const [productos, setProductos] = useState<ProductoMapeo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");
  const [unidades, setUnidades] = useState<ErpUnidad[]>([]);
  const [totales, setTotales] = useState({
    totalProductos: 0,
    totalPendientes: 0,
    totalHomologados: 0,
  });
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docData, erpUnits] = await Promise.all([
        xmlService.getProductosDocumento(fileName),
        erpService.getErpUnidades(),
      ]);

      const mapped = docData.productos.map((p) => ({
        referenciaXML: p.referenciaXML,
        nombreProducto: p.nombreProducto,
        unidadXML: p.unidadXML,
        unidadXMLNombre: p.unidadXMLNombre,
        estado: p.estado,
        referenciaErp: p.referenciaErp || "",
        codigoErp: p.codigoErp,
        subcodigoErp: p.subcodigoErp,
        nombreErp: p.nombreErp || "",
        productoSistema: p.referenciaErp
          ? `[${p.referenciaErp}] - ${p.nombreErp || ""}`
          : "",
        unidadErp: p.unidadErp || "",
        unidadErpLabel: p.unidadErpNombre || "",
        factor: p.factor || 1,
      }));

      setProductos(mapped);
      setUnidades(erpUnits);
      setTotales({
        totalProductos: docData.totalProductos,
        totalPendientes: docData.totalPendientes,
        totalHomologados: docData.totalHomologados,
      });
      return mapped;
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los datos necesarios.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [fileName]);

  useEffect(() => {
    if (visible && fileName) {
      loadData();
    }
  }, [visible, fileName, loadData]);

  const filteredProducts = useMemo(() => {
    const lowSearch = searchTerm.trim().toLowerCase();

    return productos.filter((p) => {
      const estado = (p.estado || "pendiente").toLowerCase();
      const estadoMatch =
        estadoFiltro === "todos" ||
        (estadoFiltro === "homologado"
          ? estado === "homologado"
          : estado !== "homologado");

      if (!lowSearch) {
        return estadoMatch;
      }

      const searchMatch =
        p.nombreProducto.toLowerCase().includes(lowSearch) ||
        p.referenciaXML.toLowerCase().includes(lowSearch) ||
        (p.referenciaErp || "").toLowerCase().includes(lowSearch) ||
        (p.productoSistema || "").toLowerCase().includes(lowSearch);

      return estadoMatch && searchMatch;
    });
  }, [productos, searchTerm, estadoFiltro]);

  const updateRowState = (
    referenciaXML: string,
    newState: Partial<ProductoMapeo>,
  ) => {
    setProductos((prev) =>
      prev.map((p) =>
        p.referenciaXML === referenciaXML ? { ...p, ...newState } : p,
      ),
    );
  };

  const handleSaveRow = async (rowData: ProductoMapeo) => {
    if (
      !rowData.referenciaErp ||
      !rowData.unidadErp ||
      !rowData.codigoErp ||
      rowData.subcodigoErp === undefined ||
      !rowData.nombreErp
    ) {
      toast.current?.show({
        severity: "warn",
        summary: "Campos requeridos",
        detail:
          "Debe seleccionar un producto del ERP válido (Código, Subcódigo y Nombre son requeridos).",
        life: 3000,
      });
      return;
    }

    if (!rowData.factor || rowData.factor <= 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Valor inválido",
        detail: "El factor debe ser mayor a 0.",
        life: 3000,
      });
      return;
    }

    updateRowState(rowData.referenciaXML, { loading: true });
    try {
      const payload: HomologarPayload = {
        fileName,
        referenciaXml: rowData.referenciaXML,
        unidadXml: rowData.unidadXML,
        codigoH: rowData.codigoErp!,
        subCodigoH: rowData.subcodigoErp!,
        nombreH: rowData.nombreErp!,
        referenciaErp: rowData.referenciaErp,
        unidadErp: rowData.unidadErp,
        factor: rowData.factor,
      };
      const res = await xmlService.homologarProducto(payload);
      if (res.success) {
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: res.mensaje || "Producto homologado correctamente.",
          life: 3000,
        });

        const freshItems = await loadData();

        // Refresh the global XML list in the store
        await useXMLStore.getState().fetchXMLList();

        if (freshItems && freshItems.length === 0) {
          onSuccess();
        }
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: res.mensaje,
          life: 3000,
        });
      }
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al intentar homologar el producto.",
        life: 3000,
      });
    } finally {
      updateRowState(rowData.referenciaXML, { loading: false });
    }
  };

  const searchErpProducts = async (
    event: AutoCompleteCompleteEvent,
    rowData: ProductoMapeo,
  ) => {
    const query = (event.query || "").trim();
    updateRowState(rowData.referenciaXML, { searching: true });
    try {
      const suggestions = await erpService.searchErpProductos(query);
      updateRowState(rowData.referenciaXML, {
        erpSuggestions: suggestions,
        searching: false,
      });
    } catch {
      updateRowState(rowData.referenciaXML, { searching: false });
    }
  };

  const onErpProductSelect = (
    selected: ErpProducto,
    rowData: ProductoMapeo,
  ) => {
    const matchingUnit = unidades.find(
      (u) => u.sigla === selected.unidadDefault,
    );

    updateRowState(rowData.referenciaXML, {
      referenciaErp: selected.referencia,
      codigoErp: selected.codigo,
      subcodigoErp: selected.subcodigo,
      nombreErp: selected.nombre,
      productoSistema: `[${selected.referencia}] - ${selected.nombre}`,
      unidadErp: matchingUnit?.codigo || "",
      unidadErpLabel: matchingUnit?.sigla || "",
    });
  };

  return (
    <Dialog
      header={
        <div className="homologacion-header">
          <div className="header-icon-container">
            <i className="pi pi-sync text-primary text-xl"></i>
          </div>
          <div className="header-title-block">
            <h2 className="header-title app-title">Homologación de productos</h2>
            <span className="header-subtitle">{fileName}</span>
          </div>
        </div>
      }
      headerClassName="homologacion-header-container"
      visible={visible}
      onHide={onHide}
      className="detail-dialog-v2"
      style={{ width: "92vw", maxWidth: "1320px" }}
      draggable={false}
      resizable={false}
      modal
      blockScroll
      footer={
        <div className="flex align-items-center justify-content-between px-4 py-3 border-top-1 border-gray-100 bg-white">
          <Message
            severity="info"
            className="minimalist-tip"
            content={
              <div className="flex align-items-center gap-2">
                <i className="pi pi-info-circle text-xs"></i>
                <span className="text-xs">
                  Tip: puedes buscar por nombre/referencia XML o por referencia
                  ERP.
                </span>
              </div>
            }
          />
          <div className="flex align-items-center gap-4">
            <div className="text-xs text-slate-500 font-medium">
              Estado:{" "}
              <span className="text-slate-700 font-bold">
                {totales.totalHomologados}
              </span>{" "}
              de{" "}
              <span className="text-slate-700 font-bold">
                {totales.totalProductos}
              </span>{" "}
              homologados
            </div>
            <Button
              label="Cerrar"
              icon="pi pi-times"
              onClick={onHide}
              className="p-button-text p-button-secondary p-button-sm font-semibold"
            />
          </div>
        </div>
      }
    >
      <Toast ref={toast} />
      <div className="homologacion-content">
        <div className="toolbar-grid mb-2">
          <div className="toolbar-stats">
            <Tag
              value={`Total: ${totales.totalProductos}`}
              severity="info"
              rounded
            />
            <Tag
              value={`Pendientes: ${totales.totalPendientes}`}
              severity="warning"
              rounded
            />
            <Tag
              value={`Homologados: ${totales.totalHomologados}`}
              severity="success"
              rounded
            />
          </div>

          <div className="toolbar-actions">
            <div
              className="estado-filtros"
              role="group"
              aria-label="Filtrar estado"
            >
              <Button
                label="Todos"
                onClick={() => setEstadoFiltro("todos")}
                className={`p-button-sm ${estadoFiltro === "todos" ? "p-button-primary" : "p-button-outlined p-button-secondary"}`}
              />
              <Button
                label="Pendientes"
                onClick={() => setEstadoFiltro("pendiente")}
                className={`p-button-sm ${estadoFiltro === "pendiente" ? "p-button-warning" : "p-button-outlined p-button-secondary"}`}
              />
              <Button
                label="Homologados"
                onClick={() => setEstadoFiltro("homologado")}
                className={`p-button-sm ${estadoFiltro === "homologado" ? "p-button-success" : "p-button-outlined p-button-secondary"}`}
              />
            </div>

            <span className="p-input-icon-right search-pill-container">
              <InputText
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Búsqueda global..."
                className="p-inputtext-sm search-pill"
              />
              <i className="pi pi-search" />
            </span>
            {searchTerm && (
              <Button
                icon="pi pi-times"
                className="p-button-text p-button-sm"
                onClick={() => setSearchTerm("")}
                tooltip="Limpiar búsqueda"
              />
            )}
          </div>
        </div>

        <HomologacionTable
          productos={productos}
          filteredProducts={filteredProducts}
          loading={loading}
          unidades={unidades}
          updateRowState={updateRowState}
          handleSaveRow={handleSaveRow}
          searchErpProducts={searchErpProducts}
          onErpProductSelect={onErpProductSelect}
        />
      </div>
    </Dialog>
  );
};

export default HomologacionModal;
