import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { XmlDetalle } from '../../types/xml';

interface XMLDetailDialogProps {
    visible: boolean;
    onHide: () => void;
    xmlDetail: XmlDetalle | null;
    loading: boolean;
    fileName?: string;
    fechaEmision?: string;
}

const XMLDetailDialog: React.FC<XMLDetailDialogProps> = ({ visible, onHide, xmlDetail, loading, fileName, fechaEmision }) => {
    const formatCurrency = (value: number) =>
        value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

    const formatDate = (dateValue?: string) => {
        if (!dateValue) return null;
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return dateValue;
        return new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(date);
    };

    const fechaFormateada = formatDate(fechaEmision);
    const retencionCalculada = xmlDetail ? Math.max(0, xmlDetail.totales.taxInclusiveAmount - xmlDetail.totales.total) : 0;

    return (
        <Dialog
            header={
                <div className="detail-modal-header">
                    <div className="header-main-info">
                        <div className="doc-type-tag">FACTURA XML</div>
                        <h2 className="detail-modal-title">{fileName || 'Detalle del Documento XML'}</h2>
                        {fechaFormateada && (
                            <div className="detail-modal-subtitle">
                                <i className="pi pi-calendar"></i>
                                <span>Fecha de emisión: {fechaFormateada}</span>
                            </div>
                        )}
                    </div>
                </div>
            }
            visible={visible}
            className="detail-dialog-v2 xml-detail-dialog"
            onHide={onHide}
            footer={
                <div className="detail-modal-footer">
                    <div className="footer-actions">
                        <Button label="Descargar XML" outlined className="btn-download-xml" />
                        <Button label="Cerrar" icon="pi pi-check" className="btn-primary-close" onClick={onHide} />
                    </div>
                </div>
            }
            draggable={false}
            resizable={false}
            blockScroll
        >
            {loading ? (
                <div className="flex flex-column justify-content-center align-items-center py-8">
                    <i className="pi pi-spin pi-spinner text-4xl mb-3 loading-icon-primary"></i>
                    <span className="text-xl font-medium text-secondary">Cargando detalle del XML...</span>
                </div>
            ) : xmlDetail ? (
                <div className="detail-modal-content">
                    {/* Proveedor Section */}
                    <div className="section-container provider-section-compact">
                        <div className="section-title">
                            <i className="pi pi-building"></i>
                            <span>PROVEEDOR</span>
                        </div>
                        <div className="provider-info-card">
                            <div className="info-group">
                                <label>NOMBRE O RAZÓN SOCIAL</label>
                                <span className="font-bold">{xmlDetail.proveedor.nombre}</span>
                            </div>
                            <div className="info-group">
                                <label>NIT</label>
                                <span className="font-bold">{xmlDetail.proveedor.nit}</span>
                            </div>
                            <div className="info-group">
                                <label>DIRECCIÓN</label>
                                <span className="font-bold">{xmlDetail.proveedor.direccion}</span>
                            </div>
                        </div>
                    </div>

                    {/* Productos Section */}
                    <div className="section-container">
                        <div className="section-title">
                            <i className="pi pi-box"></i>
                            <span>PRODUCTOS</span>
                        </div>
                        <DataTable
                            value={xmlDetail.productos}
                            className="products-detail-table"
                            scrollable
                            scrollHeight="400px"
                            tableStyle={{ minWidth: '60rem' }}
                            rowHover
                        >
                            <Column
                                header="PRODUCTO XML"
                                headerClassName="table-header-v2"
                                className="col-desc"
                                body={(rowData) => (
                                    <div className="flex flex-column gap-1">
                                        <div className="text-sm font-semibold text-dark">{rowData.descripcion}</div>
                                        <div className="text-xs text-secondary opacity-70 font-mono">{rowData.referencia}</div>
                                    </div>
                                )}
                            />
                            <Column field="cantidad" header="CANTIDAD" align="center" headerClassName="table-header-v2" className="col-qty font-bold" />
                            <Column
                                field="valorUnitario"
                                header="VALOR UNITARIO"
                                align="right"
                                headerClassName="table-header-v2"
                                className="col-price"
                                body={(rowData) => rowData.valorUnitario.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                            />
                            <Column
                                field="porcentajeImpuesto"
                                header="IMPUESTO %"
                                align="center"
                                headerClassName="table-header-v2"
                                className="col-tax-pct"
                                body={(rowData) => `${rowData.porcentajeImpuesto}%`}
                            />
                            <Column
                                field="impuesto"
                                header="IMPUESTO"
                                align="right"
                                headerClassName="table-header-v2"
                                className="col-tax"
                                body={(rowData) => rowData.impuesto.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                            />
                            <Column
                                field="valorTotal"
                                header="TOTAL"
                                align="right"
                                headerClassName="table-header-v2"
                                className="col-total font-bold"
                                body={(rowData) => rowData.valorTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                            />
                        </DataTable>
                    </div>

                    {/* Totales Section */}
                    <div className="section-container totals-section-container">
                        <div className="totals-header-wrapper">
                            <div className="section-title totals">
                                <i className="pi pi-calculator"></i>
                                <span>TOTALES</span>
                            </div>
                        </div>
                        <div className="totals-content-wrapper">
                            <div className="totals-row">
                                <span className="totals-label">SUBTOTAL</span>
                                <span className="totals-value">{formatCurrency(xmlDetail.totales.subtotal)}</span>
                            </div>
                            <div className="totals-row">
                                <span className="totals-label">IMPUESTOS</span>
                                <span className="totals-value">{formatCurrency(xmlDetail.totales.impuestoTotal)}</span>
                            </div>
                            {Number(retencionCalculada) > 0 && (
                                <div className="totals-row">
                                    <span className="totals-label">RETENCIÓN</span>
                                    <span className="totals-value">{formatCurrency(retencionCalculada)}</span>
                                </div>
                            )}
                            <div className="totals-row highlight">
                                <span className="totals-label">TOTAL FINAL</span>
                                <span className="totals-value">{formatCurrency(xmlDetail.totales.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </Dialog>
    );
};

export default XMLDetailDialog;
