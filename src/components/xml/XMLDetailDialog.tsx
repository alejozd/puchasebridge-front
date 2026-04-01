import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { XmlDetalle, ProductoDetalle } from '../../types/xml';

interface XMLDetailDialogProps {
    visible: boolean;
    onHide: () => void;
    xmlDetail: XmlDetalle | null;
    loading: boolean;
    fileName?: string;
    fechaEmision?: string;
}

/**
 * Componente de diálogo para mostrar el detalle de una factura XML
 */
const XMLDetailDialog: React.FC<XMLDetailDialogProps> = ({ 
    visible, 
    onHide, 
    xmlDetail, 
    loading, 
    fileName, 
    fechaEmision 
}) => {
    // Funciones de formato
    const formatCurrency = (value: number | undefined | null): string => {
        if (value === undefined || value === null) return '$ 0';
        return value.toLocaleString('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            minimumFractionDigits: 0 
        });
    };

    const formatDate = (dateValue?: string): string | null => {
        if (!dateValue) return null;
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return dateValue;
        return new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(date);
    };

    const formatPercentage = (value: number | undefined | null): string => {
        if (value === undefined || value === null) return '0%';
        return `${value}%`;
    };

    // Cálculos derivados
    const fechaFormateada = formatDate(fechaEmision);
    const retencionCalculada = xmlDetail 
        ? Math.max(0, xmlDetail.totales.taxInclusiveAmount - xmlDetail.totales.total) 
        : 0;

    // Templates para columnas de la tabla
    const productoBodyTemplate = (rowData: ProductoDetalle) => (
        <div className="flex flex-column gap-1">
            <div className="text-sm font-semibold text-dark">{rowData.descripcion}</div>
            <div className="text-xs text-secondary opacity-70 font-mono" title={rowData.referenciaEstandar}>
                {rowData.referencia}
            </div>
        </div>
    );

    const currencyBodyTemplate = (rowData: ProductoDetalle, field: keyof ProductoDetalle) => 
        formatCurrency(rowData[field] as number);

    const percentageBodyTemplate = (rowData: ProductoDetalle) => 
        formatPercentage(rowData.porcentajeImpuesto);

    // Header del diálogo
    const dialogHeader = (
        <div className="detail-modal-header">
            <div className="header-main-info">
                <div className="doc-type-tag">FACTURA XML</div>
                <h2 className="detail-modal-title" title={fileName}>
                    {fileName || 'Detalle del Documento XML'}
                </h2>
                {fechaFormateada && (
                    <div className="detail-modal-subtitle">
                        <i className="pi pi-calendar" aria-hidden="true"></i>
                        <span>Fecha de emisión: {fechaFormateada}</span>
                    </div>
                )}
            </div>
        </div>
    );

    // Footer del diálogo
    const dialogFooter = (
        <div className="detail-modal-footer">
            <div className="footer-actions">
                <Button 
                    label="Descargar XML" 
                    icon="pi pi-download"
                    outlined 
                    className="btn-download-xml"
                    aria-label="Descargar archivo XML"
                />
                <Button 
                    label="Cerrar" 
                    icon="pi pi-check" 
                    className="btn-primary-close" 
                    onClick={onHide}
                    autoFocus
                />
            </div>
        </div>
    );

    return (
        <Dialog
            header={dialogHeader}
            visible={visible}
            className="detail-dialog-v2 xml-detail-dialog"
            onHide={onHide}
            footer={dialogFooter}
            draggable={false}
            resizable={false}
            blockScroll
            modal
            closeOnEscape
            dismissableMask
            aria-labelledby="xml-detail-dialog-title"
        >
            {loading ? (
                <div className="flex flex-column justify-content-center align-items-center py-8" role="status">
                    <i className="pi pi-spin pi-spinner text-4xl mb-3 loading-icon-primary" aria-hidden="true"></i>
                    <span className="text-xl font-medium text-secondary">Cargando detalle del XML...</span>
                </div>
            ) : xmlDetail ? (
                <div className="detail-modal-content">
                    {/* Sección Proveedor */}
                    <div className="section-container provider-section-compact">
                        <div className="section-title">
                            <i className="pi pi-building" aria-hidden="true"></i>
                            <span>PROVEEDOR</span>
                        </div>
                        <div className="provider-info-card">
                            <div className="info-group">
                                <label htmlFor="proveedor-nombre">NOMBRE O RAZÓN SOCIAL</label>
                                <span id="proveedor-nombre" className="font-bold" title={xmlDetail.proveedor.nombreLegal}>
                                    {xmlDetail.proveedor.nombre || 'No disponible'}
                                </span>
                            </div>
                            <div className="info-group">
                                <label htmlFor="proveedor-nit">NIT</label>
                                <span id="proveedor-nit" className="font-bold">
                                    {xmlDetail.proveedor.nit || 'No disponible'}
                                </span>
                            </div>
                            <div className="info-group">
                                <label htmlFor="proveedor-direccion">DIRECCIÓN</label>
                                <span id="proveedor-direccion" className="font-bold">
                                    {xmlDetail.proveedor.direccion || 'No disponible'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sección Productos */}
                    <div className="section-container">
                        <div className="section-title">
                            <i className="pi pi-box" aria-hidden="true"></i>
                            <span>PRODUCTOS</span>
                        </div>
                        <DataTable
                            value={xmlDetail.productos}
                            className="products-detail-table"
                            scrollable
                            scrollHeight="400px"
                            tableStyle={{ minWidth: '60rem' }}
                            rowHover
                            emptyMessage="No hay productos registrados"
                            aria-label="Tabla de productos de la factura"
                        >
                            <Column
                                header="PRODUCTO XML"
                                headerClassName="table-header-v2"
                                className="col-desc"
                                body={productoBodyTemplate}
                            />
                            <Column 
                                field="cantidad" 
                                header="CANTIDAD" 
                                align="center" 
                                headerClassName="table-header-v2" 
                                className="col-qty font-bold"
                            />
                            <Column
                                field="valorUnitario"
                                header="VALOR UNITARIO"
                                align="right"
                                headerClassName="table-header-v2"
                                className="col-price"
                                body={(rowData) => currencyBodyTemplate(rowData, 'valorUnitario')}
                            />
                            <Column
                                field="porcentajeImpuesto"
                                header="IMPUESTO %"
                                align="center"
                                headerClassName="table-header-v2"
                                className="col-tax-pct"
                                body={percentageBodyTemplate}
                            />
                            <Column
                                field="impuesto"
                                header="IMPUESTO"
                                align="right"
                                headerClassName="table-header-v2"
                                className="col-tax"
                                body={(rowData) => currencyBodyTemplate(rowData, 'impuesto')}
                            />
                            <Column
                                field="valorTotal"
                                header="TOTAL"
                                align="right"
                                headerClassName="table-header-v2"
                                className="col-total font-bold"
                                body={(rowData) => currencyBodyTemplate(rowData, 'valorTotal')}
                            />
                        </DataTable>
                    </div>

                    {/* Sección Totales */}
                    <div className="section-container totals-section-container">
                        <div className="totals-header-wrapper">
                            <div className="section-title totals">
                                <i className="pi pi-calculator" aria-hidden="true"></i>
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
                            {retencionCalculada > 0 && (
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
