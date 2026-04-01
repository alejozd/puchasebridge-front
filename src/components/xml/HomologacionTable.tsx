import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import {
  AutoComplete,
  type AutoCompleteCompleteEvent,
  type AutoCompleteChangeEvent,
} from "primereact/autocomplete";
import { InputNumber } from "primereact/inputnumber";
import type { ErpProducto, ErpUnidad } from "../../services/erpService";
import type { ProductoMapeo } from "../../types/homologacion";

interface HomologacionTableProps {
  productos: ProductoMapeo[];
  filteredProducts: ProductoMapeo[];
  loading: boolean;
  unidades: ErpUnidad[];
  updateRowState: (referenciaXML: string, newState: Partial<ProductoMapeo>) => void;
  handleSaveRow: (row: ProductoMapeo) => void;
  searchErpProducts: (
    event: AutoCompleteCompleteEvent,
    row: ProductoMapeo,
  ) => void;
  onErpProductSelect: (producto: ErpProducto, row: ProductoMapeo) => void;
}

const HomologacionTable: React.FC<HomologacionTableProps> = ({
  filteredProducts,
  loading,
  updateRowState,
  handleSaveRow,
  searchErpProducts,
  onErpProductSelect,
}) => {
  const statusBodyTemplate = (rowData: ProductoMapeo) => {
    const estado = (rowData.estado || "PENDIENTE").toUpperCase();
    const severityMap: Record<
      string,
      "secondary" | "success" | "danger" | "info" | "warning"
    > = {
      PENDIENTE: "warning",
      HOMOLOGADO: "success",
    };
    return (
      <Tag value={estado} severity={severityMap[estado] || "secondary"} />
    );
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
            <span className="text-xs text-secondary font-medium">
              Unidad ERP:
            </span>
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
          <span className="erp-item-name text-xs text-secondary mt-1">
            {item.nombre}
          </span>
        </div>
      );
    };

    return (
      <div className="flex flex-column gap-1">
        <div className="p-input-icon-right w-full">
          <AutoComplete
            value={rowData.productoSistema}
            suggestions={rowData.erpSuggestions || []}
            completeMethod={(e) => searchErpProducts(e, rowData)}
            onChange={(e: AutoCompleteChangeEvent) => {
              const val =
                typeof e.value === "string"
                  ? e.value
                  : `[${e.value.referencia}] - ${e.value.nombre}`;
              updateRowState(rowData.referenciaXML, { productoSistema: val });
            }}
            onSelect={(e) =>
              onErpProductSelect(e.value as ErpProducto, rowData)
            }
            onPaste={() => {
              setTimeout(() => {
                const inputElement = document.activeElement as HTMLInputElement;
                if (inputElement && inputElement.value) {
                  const fakeEvent = {
                    query: inputElement.value,
                  } as AutoCompleteCompleteEvent;
                  searchErpProducts(fakeEvent, rowData);
                }
              }, 0);
            }}
            itemTemplate={itemTemplate}
            field="referencia"
            placeholder="Buscar producto en ERP..."
            className="w-full"
            inputClassName="p-inputtext-sm w-full pr-5"
            panelClassName="erp-autocomplete-panel"
            loadingIcon="pi pi-spin pi-spinner"
            delay={100}
            minLength={1}
            forceSelection
          />
          <i className="pi pi-search text-xs erp-search-icon" />
        </div>
        {rowData.referenciaErp && (
          <div className="flex align-items-center gap-1 mt-1">
            <span className="unit-tag-inline">
              <i className="pi pi-tag unit-tag-icon"></i>
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
          className="factor-input-compact"
          inputClassName="p-inputtext-sm text-center font-bold"
        />
      </div>
    );
  };

  const productXmlTemplate = (rowData: ProductoMapeo) => (
    <div className="product-xml-container">
      <span className="text-sm font-bold text-gray-800 line-height-2">
        {rowData.nombreProducto}
      </span>
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
            disabled={
              rowData.loading || rowData.searching || !rowData.referenciaErp
            }
            tooltip="Guardar cambios"
          />
          <Button
            icon="pi pi-times"
            text
            rounded
            severity="secondary"
            onClick={() =>
              updateRowState(rowData.referenciaXML, { isEditing: false })
            }
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
            onClick={() =>
              updateRowState(rowData.referenciaXML, { isEditing: true })
            }
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
          disabled={
            rowData.loading || rowData.searching || !rowData.referenciaErp
          }
          tooltip="Guardar"
        />
      </div>
    );
  };

  return (
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
      <Column
        header="PRODUCTO ORIGEN (XML)"
        body={productXmlTemplate}
        style={{ width: "32%" }}
      />
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
                <span className="text-slate-400 font-medium unit-ref-text">
                  Ref: {rowData.unidadXML}
                </span>
              )}
            </div>
          );
        }}
        style={{ width: "8%" }}
        align="center"
      />
      <Column
        header="EQUIVALENCIA EN ERP"
        body={productErpTemplate}
        style={{ width: "42%" }}
      />
      <Column
        header="CONVERSIÓN (FACTOR)"
        body={factorEditor}
        style={{ width: "10%" }}
      />
      <Column
        field="estado"
        header="ESTADO"
        body={statusBodyTemplate}
        style={{ width: "5%" }}
        align="center"
      />
      <Column
        header=""
        body={actionTemplate}
        style={{ width: "3%" }}
        align="center"
      />
    </DataTable>
  );
};

export default HomologacionTable;
