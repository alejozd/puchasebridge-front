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
    issueDate?: string;
}

const formatCurrency = (value: number) => value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

const formatDate = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
    });
};

const XMLDetailDialog: React.FC<XMLDetailDialogProps> = ({ visible, onHide, xmlDetail, loading, fileName, issueDate }) => {
    const formattedIssueDate = formatDate(issueDate);
    const retention = (xmlDetail?.totales as { retencion?: number } | undefined)?.retencion ?? 0;

    return (
        <Dialog
            header={
                <div className="detail-modal-header-v3">
                    <div className="detail-header-main">
                        <div className="doc-type-tag">XML DOCUMENTO</div>
                        <h2 className="detail-modal-title app-title">{fileName || 'Detalle del Documento XML'}</h2>
                    </div>
                    {formattedIssueDate && (
                        <div className="detail-header-meta">
                            <i className="pi pi-calendar"></i>
                            <span>Fecha de emisión: {formattedIssueDate}</span>
                        </div>
                    )}
                </div>
            }
            visible={visible}
            className="detail-dialog-v2 xml-detail-dialog"
            onHide={onHide}
            footer={
                <div className="detail-modal-footer">
                    <div className="footer-actions">
                        <Button label="Cerrar" icon="pi pi-times" className="btn-close-detail" onClick={onHide} />
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
                    <div className="section-container">
                        <div className="section-title compact">
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
                                body={(rowData) => formatCurrency(rowData.valorUnitario)}
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
                                body={(rowData) => formatCurrency(rowData.impuesto)}
                            />
                            <Column
                                field="valorTotal"
                                header="TOTAL"
                                align="right"
                                headerClassName="table-header-v2"
                                className="col-total font-bold"
                                body={(rowData) => formatCurrency(rowData.valorTotal)}
                            />
                        </DataTable>
                    </div>

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
                            <div className="totals-row">
                                <span className="totals-label">RETENCIÓN</span>
                                <span className="totals-value">{formatCurrency(retention)}</span>
                            </div>
                            <div className="totals-row highlight">
                                <span className="totals-label">TOTAL FACTURA</span>
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
