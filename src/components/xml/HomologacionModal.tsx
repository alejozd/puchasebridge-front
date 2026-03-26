import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import {
  AutoComplete,
  type AutoCompleteCompleteEvent,
  type AutoCompleteChangeEvent,
} from "primereact/autocomplete";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import * as xmlService from "../../services/xmlService";
import * as erpService from "../../services/erpService";
import type { ProductoPendiente, HomologarPayload } from "../../types/xml";
import type { ErpProducto, ErpUnidad } from "../../services/erpService";
import "../../styles/HomologacionModal.css";

interface HomologacionModalProps {
  visible: boolean;
  onHide: () => void;
  fileName: string;
  onSuccess: () => void;
}

interface ProductoMapeo extends ProductoPendiente {
  referenciaErp: string;
  productoSistema?: string;
  unidadErp: string;
  unidadErpLabel?: string;
  factor: number;
  loading?: boolean;
  searching?: boolean;
  erpSuggestions?: ErpProducto[];
  isEditing?: boolean;
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
        p.referenciaErp.toLowerCase().includes(lowSearch) ||
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
    if (!rowData.referenciaErp || !rowData.unidadErp) {
      toast.current?.show({
        severity: "warn",
        summary: "Campos requeridos",
        detail: "Referencia ERP y Unidad ERP son obligatorios.",
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
    const matchingUnit = unidades.find((u) => u.sigla === selected.unidadDefault);

    updateRowState(rowData.referenciaXML, {
      referenciaErp: selected.referencia,
      productoSistema: `[${selected.referencia}] - ${selected.nombre}`,
      unidadErp: matchingUnit?.codigo || "",
      unidadErpLabel: matchingUnit?.sigla || "",
    });
  };

  const statusBodyTemplate = (rowData: ProductoMapeo) => {
    const estado = rowData.estado ? rowData.estado.toLowerCase() : "pendiente";
    const severity = estado === "homologado" ? "success" : "warning";
    return <Tag value={estado.toUpperCase()} severity={severity} />;
  };

  const productErpTemplate = (rowData: ProductoMapeo) => {
    const isHomologado = rowData.estado?.toLowerCase() === "homologado";
    const showEditor = !isHomologado || rowData.isEditing;

    if (!showEditor) {
      return (
        <div className="flex flex-column gap-1 py-1 product-system-display">
          <span className="text-sm font-semibold text-primary homologado-erp-label">
            {rowData.productoSistema || rowData.referenciaErp}
          </span>
          <div className="flex align-items-center gap-1">
            <span className="text-xs text-secondary font-medium">Unidad ERP:</span>
            <span className="text-xs font-bold text-dark">
              {rowData.unidadErpLabel || rowData.unidadErp || "---"}
            </span>
          </div>
        </div>
      );
    }

    const itemTemplate = (item: ErpProducto) => {
      return (
        <div className="flex flex-column erp-item-suggestion py-1">
          <span className="erp-item-code font-bold text-sm text-primary">
            [{item.referencia}]
          </span>
          <span className="erp-item-name text-xs text-secondary mt-1">{item.nombre}</span>
        </div>
      );
    };

    return (
      <div className="flex flex-column gap-1">
        <div className="p-input-icon-right w-full">
          <AutoComplete
            value={rowData.productoSistema || rowData.referenciaErp}
            suggestions={rowData.erpSuggestions || []}
            completeMethod={(e) => searchErpProducts(e, rowData)}
            onChange={(e: AutoCompleteChangeEvent) => {
              const val =
                typeof e.value === "string"
                  ? e.value
                  : `[${e.value.referencia}] - ${e.value.nombre}`;
              updateRowState(rowData.referenciaXML, { productoSistema: val });
            }}
            onSelect={(e) => onErpProductSelect(e.value as ErpProducto, rowData)}
            itemTemplate={itemTemplate}
            placeholder="Buscar producto en ERP..."
            className="w-full"
            inputClassName="p-inputtext-sm w-full pr-5"
            panelClassName="erp-autocomplete-panel"
            loadingIcon="pi pi-spin pi-spinner"
            delay={300}
            minLength={1}
          />
          <i className="pi pi-search text-xs" style={{ right: "0.75rem", zIndex: 1 }} />
        </div>
        {rowData.referenciaErp && (
          <div className="flex align-items-center gap-1 mt-1">
            <span className="unit-tag-inline">
              <i className="pi pi-tag" style={{ fontSize: "9px" }}></i>
              UND: {rowData.unidadErpLabel || rowData.unidadErp || "---"}
            </span>
          </div>
        )}
      </div>
    );
  };

  const factorEditor = (rowData: ProductoMapeo) => {
    const unitLabel = rowData.unidadXMLNombre || rowData.unidadXML;
    const isTechnical =
      unitLabel.toLowerCase().includes("código") ||
      unitLabel.toLowerCase().includes("codigo");
    const displayUnit = isTechnical ? rowData.unidadXML : unitLabel;

    return (
      <div className="factor-wrapper">
        <span className="factor-relation text-xs">
          1 {displayUnit} = {rowData.factor} {rowData.unidadErpLabel || "ERP"}
        </span>
        <div className="factor-input-wrap">
          <span className="factor-eq">Factor</span>
          <InputNumber
            value={rowData.factor}
            onValueChange={(e) =>
              updateRowState(rowData.referenciaXML, { factor: e.value ?? 1 })
            }
            min={0}
            minFractionDigits={0}
            maxFractionDigits={4}
            mode="decimal"
            showButtons
            buttonLayout="horizontal"
            decrementButtonClassName="p-button-text p-button-sm"
            incrementButtonClassName="p-button-text p-button-sm"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            inputClassName="p-inputtext-sm text-center font-bold"
          />
        </div>
      </div>
    );
  };

  const productXmlTemplate = (rowData: ProductoMapeo) => (
    <div className="product-xml-container">
      <span className="text-sm font-bold text-gray-800 line-height-2">{rowData.nombreProducto}</span>
      <span className="ref-mono text-xs">{rowData.referenciaXML}</span>
    </div>
  );

  const actionTemplate = (rowData: ProductoMapeo) => {
    const estado = rowData.estado ? rowData.estado.toLowerCase() : "pendiente";
    const isHomologado = estado === "homologado";
    const isEditing = rowData.isEditing;

    if (isEditing) {
      return (
        <div className="actions-cell flex gap-1 justify-content-center">
          <Button
            icon="pi pi-check-circle"
            text
            rounded
            severity="success"
            onClick={() => handleSaveRow(rowData)}
            loading={rowData.loading}
            disabled={rowData.loading || rowData.searching || !rowData.referenciaErp}
            tooltip="Guardar cambios"
          />
          <Button
            icon="pi pi-times"
            text
            rounded
            severity="secondary"
            onClick={() => updateRowState(rowData.referenciaXML, { isEditing: false })}
            tooltip="Cancelar"
          />
        </div>
      );
    }

    if (isHomologado) {
      return (
        <div className="actions-cell flex gap-1 justify-content-center">
          <Button
            icon="pi pi-pencil"
            text
            rounded
            severity="info"
            onClick={() => updateRowState(rowData.referenciaXML, { isEditing: true })}
            tooltip="Editar homologación"
          />
        </div>
      );
    }

    return (
      <div className="actions-cell flex gap-1 justify-content-center">
        <Button
          icon="pi pi-check-circle"
          text
          rounded
          severity="success"
          onClick={() => handleSaveRow(rowData)}
          loading={rowData.loading}
          disabled={rowData.loading || rowData.searching || !rowData.referenciaErp}
          tooltip="Guardar"
        />
      </div>
    );
  };

  return (
    <Dialog
      header={
        <div className="homologacion-header">
          <div className="header-icon-container">
            <i className="pi pi-sync text-primary text-xl"></i>
          </div>
          <div className="header-title-block">
            <h2 className="m-0 text-lg font-bold text-slate-800">Homologación de productos</h2>
            <div className="header-file-name">{fileName}</div>
          </div>
        </div>
      }
      headerStyle={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
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
                  Tip: puedes buscar por nombre/referencia XML o por referencia ERP.
                </span>
              </div>
            }
          />
          <div className="flex align-items-center gap-4">
            <div className="text-xs text-slate-500 font-medium">
              Estado: <span className="text-slate-700 font-bold">{totales.totalHomologados}</span> de{" "}
              <span className="text-slate-700 font-bold">{totales.totalProductos}</span> homologados
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
      <div className="modal-body-content py-0">
        <div className="toolbar-grid mb-2">
          <div className="toolbar-stats">
            <Tag value={`Total: ${totales.totalProductos}`} severity="info" rounded />
            <Tag value={`Pendientes: ${totales.totalPendientes}`} severity="warning" rounded />
            <Tag value={`Homologados: ${totales.totalHomologados}`} severity="success" rounded />
          </div>

          <div className="toolbar-actions">
            <div className="estado-filtros" role="group" aria-label="Filtrar estado">
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

        <DataTable
          value={filteredProducts}
          loading={loading}
          className="p-datatable-sm modern-erp-table"
          emptyMessage="No hay productos que coincidan con el filtro actual."
          scrollable
          scrollHeight="550px"
          stripedRows
          rowHover
          rowClassName={(data) => {
            const estado = data.estado ? data.estado.toLowerCase() : "pendiente";
            return {
              "row-pending": estado !== "homologado" && !data.isEditing,
              "row-homologado": estado === "homologado" && !data.isEditing,
              "row-editing": !!data.isEditing,
            };
          }}
        >
          <Column header="PRODUCTO ORIGEN (XML)" body={productXmlTemplate} style={{ width: "34%" }} />
          <Column
            header="UND. XML"
            body={(rowData) => {
              const nombre = rowData.unidadXMLNombre || "";
              const isTechnical =
                nombre.toLowerCase().includes("código") ||
                nombre.toLowerCase().includes("codigo");
              return (
                <div className="flex flex-column align-items-center gap-1">
                  <span className="unit-tag-inline shadow-sm px-3 py-1 bg-white border-1 border-slate-300 text-slate-800 font-bold uppercase text-xs">
                    {isTechnical ? rowData.unidadXML : nombre || rowData.unidadXML}
                  </span>
                  {isTechnical && nombre && (
                    <span className="text-slate-400 font-medium" style={{ fontSize: "10px" }}>
                      Ref: {rowData.unidadXML}
                    </span>
                  )}
                </div>
              );
            }}
            style={{ width: "5%" }}
            align="center"
          />
          <Column header="EQUIVALENCIA EN ERP" body={productErpTemplate} style={{ width: "46%" }} />
          <Column header="CONVERSIÓN (FACTOR)" body={factorEditor} style={{ width: "8%" }} />
          <Column
            field="estado"
            header="ESTADO"
            body={statusBodyTemplate}
            style={{ width: "5%" }}
            align="center"
          />
          <Column header="" body={actionTemplate} style={{ width: "2%" }} align="center" />
        </DataTable>
      </div>
    </Dialog>
  );
};

export default HomologacionModal;
