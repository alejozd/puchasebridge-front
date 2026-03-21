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
}

const XMLDetailDialog: React.FC<XMLDetailDialogProps> = ({ visible, onHide, xmlDetail, loading }) => {
    return (
        <Dialog
            header={
                <div className="detail-modal-header">
                    <div className="doc-type-tag">XML DOCUMENT</div>
                    <h2 className="detail-modal-title">Detalle del Documento XML</h2>
                </div>
            }
            visible={visible}
            className="detail-dialog-v2"
            style={{ width: '85vw', maxWidth: '1200px' }}
            onHide={onHide}
            footer={
                <div className="detail-modal-footer">
                    <div className="integrity-hash">
                        <i className="pi pi-check-circle"></i>
                        <span>Hash de Integridad: XML-SHA256-4921-X82</span>
                    </div>
                    <div className="footer-actions">
                        <Button label="Descargar XML" outlined className="btn-download-xml" />
                        <Button label="Aprobar y Conciliar" icon="pi pi-check-square" className="btn-approve-conciliate" />
                    </div>
                </div>
            }
            draggable={false}
            resizable={false}
            blockScroll
        >
            {loading ? (
                <div className="flex flex-column justify-content-center align-items-center py-8">
                    <i className="pi pi-spin pi-spinner text-4xl mb-3" style={{ color: 'var(--color-primary)' }}></i>
                    <span className="text-xl font-medium text-secondary">Cargando detalle del XML...</span>
                </div>
            ) : xmlDetail ? (
                <div className="detail-modal-content">
                    {/* Proveedor Section */}
                    <div className="section-container">
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
                            <Column field="descripcion" header="DESCRIPCIÓN" headerClassName="table-header-v2" className="col-desc" />
                            <Column field="referencia" header="REFERENCIA" headerClassName="table-header-v2" className="col-ref" />
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
                                <span className="totals-value">{xmlDetail.totales.subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                            </div>
                            <div className="totals-row">
                                <span className="totals-label">IMPUESTOS</span>
                                <span className="totals-value">{xmlDetail.totales.impuestoTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                            </div>
                            <div className="totals-row highlight">
                                <span className="totals-label">TOTAL FACTURA</span>
                                <span className="totals-value">{xmlDetail.totales.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </Dialog>
    );
};

export default XMLDetailDialog;
