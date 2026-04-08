import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Divider } from "primereact/divider";
import type { XmlDetalle, ProductoDetalle } from "../../types/xml";
import "../../styles/XMLDetailDialog.css";

interface XMLDetailDialogProps {
  visible: boolean;
  onHide: () => void;
  xmlDetail: XmlDetalle | null;
  loading: boolean;
  fileName?: string;
  fechaEmision?: string;
}

const XMLDetailDialog: React.FC<XMLDetailDialogProps> = ({
  visible,
  onHide,
  xmlDetail,
  loading,
  fileName,
  fechaEmision,
}) => {
  const formatCurrency = (value: number | undefined | null): string => {
    return (value ?? 0).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    });
  };

  const dialogHeader = (
    <div className="detail-modal-header-container">
      <div className="header-top-row">
        <span className="doc-type-tag">DOCUMENTO ELECTRÓNICO</span>
        <div className="detail-modal-subtitle">
          <i className="pi pi-calendar mr-1" />
          <span>Emitido el: {fechaEmision || "N/A"}</span>
        </div>
      </div>
      <h2 className="detail-modal-title filename-blue">
        {fileName || "Detalle de Factura"}
      </h2>
    </div>
  );

  const dialogFooter = (
    <div className="flex justify-content-end gap-2 p-3">
      <Button
        label="Descargar XML"
        icon="pi pi-download"
        outlined
        className="p-button-secondary"
      />
      <Button
        label="Entendido"
        icon="pi pi-check"
        onClick={onHide}
        className="px-5 custom-primary-btn"
      />
    </div>
  );

  return (
    <Dialog
      header={dialogHeader}
      visible={visible}
      onHide={onHide}
      footer={dialogFooter}
      className="xml-detail-dialog"
      style={{ width: "75vw" }}
      breakpoints={{ "960px": "95vw", "641px": "100vw" }}
      modal
      draggable={false}
    >
      {loading ? (
        <div className="flex flex-column align-items-center py-8">
          <i className="pi pi-spin pi-spinner text-4xl mb-3 text-primary"></i>
          <span className="text-secondary font-medium">
            Procesando datos del XML...
          </span>
        </div>
      ) : xmlDetail ? (
        <div className="p-2">
          {/* Sección Proveedor Mejorada */}
          <div className="provider-container shadow-sm border-round-lg p-3 mb-4">
            <div className="grid">
              <div className="col-12 md:col-4">
                <div className="info-box">
                  <span className="info-label">
                    <i className="pi pi-building mr-2" />
                    EMISOR
                  </span>
                  <span className="info-value font-bold text-lg">
                    {xmlDetail.proveedor.nombre}
                  </span>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="info-box">
                  <span className="info-label">
                    <i className="pi pi-id-card mr-2" />
                    NIT
                  </span>
                  <span className="info-value">{xmlDetail.proveedor.nit}</span>
                </div>
              </div>
              <div className="col-12 md:col-5">
                <div className="info-box">
                  <span className="info-label">
                    <i className="pi pi-map-marker mr-2" />
                    UBICACIÓN
                  </span>
                  <span className="info-value text-sm">
                    {xmlDetail.proveedor.direccion}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Divider align="left">
            <span className="p-tag p-tag-info p-tag-rounded opacity-80">
              DETALLE DE PRODUCTOS
            </span>
          </Divider>

          <DataTable
            value={xmlDetail.productos}
            className="products-detail-table compact-rows border-round-xl overflow-hidden shadow-sm"
            responsiveLayout="scroll"
            rowHover
          >
            <Column
              header="Descripción"
              body={(r: ProductoDetalle) => (
                <div className="flex flex-column py-1">
                  <span className="product-row-main text-sm">
                    {r.descripcion}
                  </span>
                  <span className="product-row-sub text-xs">
                    {r.referencia}
                  </span>
                </div>
              )}
            />
            <Column
              field="cantidad"
              header="Cant."
              align="center"
              className="font-bold text-sm"
              style={{ width: "80px" }}
            />
            <Column
              header="Unitario"
              body={(r) => formatCurrency(r.valorUnitario)}
              align="right"
              className="text-sm"
            />
            <Column
              header="IVA"
              body={(r) => `${r.porcentajeImpuesto}%`}
              align="center"
              className="text-sm"
            />
            <Column
              header="Total"
              body={(r) => (
                <span className="text-primary font-bold">
                  {formatCurrency(r.valorTotal)}
                </span>
              )}
              align="right"
              className="text-sm"
            />
          </DataTable>

          <div className="totals-container-modern mt-4">
            <div className="totals-card shadow-2">
              <div className="total-line text-sm">
                <span className="label text-secondary">Subtotal</span>
                <span className="value">
                  {formatCurrency(xmlDetail.totales.subtotal)}
                </span>
              </div>
              <div className="total-line text-sm">
                <span className="label text-secondary">Impuestos (IVA)</span>
                <span className="value">
                  {formatCurrency(xmlDetail.totales.impuestoTotal)}
                </span>
              </div>
              {xmlDetail.totales.retencion > 0 && (
                <div className="total-line text-sm">
                  <span className="label text-secondary">Retención</span>
                  <span className="value">
                    {formatCurrency(xmlDetail.totales.retencion)}
                  </span>
                </div>
              )}
              <Divider className="my-2" />
              <div className="total-line final single-line">
                <span className="label">TOTAL A PAGAR</span>
                <span className="value-large">
                  {formatCurrency(xmlDetail.totales.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
};

export default XMLDetailDialog;
