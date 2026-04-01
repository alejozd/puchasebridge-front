import React, { useCallback } from 'react';
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
    // Memoized utility functions
    const formatCurrency = useCallback((value: number): string => {
        return value.toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }, []);

    const formatDate = useCallback((dateValue?: string): string | null => {
        if (!dateValue) return null;
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return dateValue;
        return new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }, []);

    const formatQuantity = useCallback((value: number): string => {
        return value.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }, []);

    // Memoized computed values
    const fechaFormateada = formatDate(fechaEmision);
    const retencionCalculada = xmlDetail ? Math.max(0, xmlDetail.totales.taxInclusiveAmount - xmlDetail.totales.total) : 0;
    const totalProductos = xmlDetail?.productos.length ?? 0;
    const totalCantidad = xmlDetail?.productos.reduce((sum, prod) => sum + prod.cantidad, 0) ?? 0;

    // Memoized handlers
    const handleDownloadXML = useCallback(() => {
        // TODO: Implementar lógica de descarga del XML
        console.log('Descargando XML:', fileName);
        // Aquí iría la lógica para descargar el archivo XML
    }, [fileName]);

    const handleClose = useCallback(() => {
        onHide();
    }, [onHide]);

    // Memoized body renderers for table columns
    const productoDescripcionBody = useCallback((rowData: any) => (
        <div className="producto-cell-content">
            <div className="producto-desc-primary">{rowData.descripcion}</div>
            <div className="producto-ref-secondary">{rowData.referencia}</div>
        </div>
    ), []);

    const valorUnitarioBody = useCallback((rowData: any) => (
        <span className="text-numeric">{formatCurrency(rowData.valorUnitario)}</span>
    ), [formatCurrency]);

    const impuestoPorcentajeBody = useCallback((rowData: any) => (
        <span className="tax-percentage-badge">{rowData.porcentajeImpuesto}%</span>
    ), []);

    const impuestoBody = useCallback((rowData: any) => (
        <span className="text-numeric">{formatCurrency(rowData.impuesto)}</span>
    ), [formatCurrency]);

    const valorTotalBody = useCallback((rowData: any) => (
        <span className="total-amount-highlight">{formatCurrency(rowData.valorTotal)}</span>
    ), [formatCurrency]);

    return (
        <Dialog
            header={
                <div className="detail-modal-header invoice-header">
                    <div className="header-main-info">
                        <div className="doc-type-tag invoice-tag">
                            <i className="pi pi-file-pdf"></i>
                            <span>FACTURA ELECTRÓNICA</span>
                        </div>
                        <h2 className="detail-modal-title invoice-title">{fileName || 'Detalle de Factura'}</h2>
                        {fechaFormateada && (
                            <div className="detail-modal-subtitle invoice-date">
                                <i className="pi pi-calendar-clock"></i>
                                <span>Fecha de emisión: {fechaFormateada}</span>
                            </div>
                        )}
                    </div>
                </div>
            }
            visible={visible}
            className="detail-dialog-v2 xml-detail-dialog invoice-detail-dialog"
            onHide={handleClose}
            footer={
                <div className="detail-modal-footer invoice-footer">
                    <div className="footer-actions">
                        <Button 
                            label="Descargar XML" 
                            icon="pi pi-download" 
                            outlined 
                            className="btn-download-xml" 
                            onClick={handleDownloadXML}
                            aria-label="Descargar archivo XML"
                        />
                        <Button 
                            label="Cerrar" 
                            icon="pi pi-check" 
                            className="btn-primary-close" 
                            onClick={handleClose}
                            aria-label="Cerrar diálogo"
                        />
                    </div>
                </div>
            }
            draggable={false}
            resizable={false}
            blockScroll
            modal
            closeOnEscape
            dismissableMask
        >
            {loading ? (
                <div className="loading-state-container">
                    <i className="pi pi-spin pi-spinner loading-icon-primary"></i>
                    <span className="loading-text">Cargando detalle de factura...</span>
                </div>
            ) : xmlDetail ? (
                <div className="detail-modal-content invoice-content">
                    {/* Proveedor Section */}
                    <div className="section-container provider-section-enhanced">
                        <div className="section-title provider-title">
                            <i className="pi pi-building"></i>
                            <span>INFORMACIÓN DEL PROVEEDOR</span>
                        </div>
                        <div className="provider-info-grid">
                            <div className="info-group-full">
                                <label>Razón Social / Nombre</label>
                                <span className="info-value primary">{xmlDetail.proveedor.nombre}</span>
                            </div>
                            {xmlDetail.proveedor.nombreLegal && xmlDetail.proveedor.nombreLegal !== xmlDetail.proveedor.nombre && (
                                <div className="info-group-full">
                                    <label>Nombre Legal</label>
                                    <span className="info-value">{xmlDetail.proveedor.nombreLegal}</span>
                                </div>
                            )}
                            <div className="info-group">
                                <label>Tipo de Identificación</label>
                                <span className="info-value">{xmlDetail.proveedor.tipoIdentificacion || 'N/A'}</span>
                            </div>
                            <div className="info-group">
                                <label>NIT</label>
                                <span className="info-value font-mono-weight">{xmlDetail.proveedor.nit}</span>
                            </div>
                            <div className="info-group info-group-large">
                                <label>Dirección</label>
                                <span className="info-value">{xmlDetail.proveedor.direccion}</span>
                            </div>
                        </div>
                    </div>

                    {/* Productos Section */}
                    <div className="section-container products-section-enhanced">
                        <div className="section-header-with-summary">
                            <div className="section-title products-title">
                                <i className="pi pi-shopping-cart"></i>
                                <span>DETALLE DE PRODUCTOS</span>
                            </div>
                            <div className="products-summary">
                                <span className="summary-badge">
                                    <i className="pi pi-list"></i>
                                    <span>{totalProductos} {totalProductos === 1 ? 'producto' : 'productos'}</span>
                                </span>
                                <span className="summary-badge quantity-badge">
                                    <i className="pi pi-box"></i>
                                    <span>Total: {formatQuantity(totalCantidad)} {totalCantidad === 1 ? 'unidad' : 'unidades'}</span>
                                </span>
                            </div>
                        </div>
                        <DataTable
                            value={xmlDetail.productos}
                            className="products-detail-table invoice-products-table"
                            scrollable
                            scrollHeight="flex"
                            virtualScrollerOptions={{ itemSize: 70 }}
                            tableStyle={{ minWidth: '60rem' }}
                            rowHover
                            stripedRows
                            size="small"
                        >
                            <Column
                                header="Descripción del Producto"
                                headerClassName="table-header-invoice"
                                className="col-desc-product"
                                body={productoDescripcionBody}
                                style={{ minWidth: '250px' }}
                            />
                            <Column 
                                field="cantidad" 
                                header="Cantidad" 
                                align="center" 
                                headerClassName="table-header-invoice" 
                                className="col-qty-invoice"
                                body={(rowData) => formatQuantity(rowData.cantidad)}
                                style={{ width: '100px' }}
                            />
                            <Column 
                                field="unidad" 
                                header="Unidad" 
                                align="center" 
                                headerClassName="table-header-invoice" 
                                className="col-unit"
                                style={{ width: '100px' }}
                            />
                            <Column
                                field="valorUnitario"
                                header="Precio Unit."
                                align="right"
                                headerClassName="table-header-invoice"
                                className="col-price-unit"
                                body={valorUnitarioBody}
                                style={{ width: '140px' }}
                            />
                            <Column
                                field="porcentajeImpuesto"
                                header="IVA %"
                                align="center"
                                headerClassName="table-header-invoice"
                                className="col-tax-rate"
                                body={impuestoPorcentajeBody}
                                style={{ width: '90px' }}
                            />
                            <Column
                                field="impuesto"
                                header="Impuesto"
                                align="right"
                                headerClassName="table-header-invoice"
                                className="col-tax-amount"
                                body={impuestoBody}
                                style={{ width: '130px' }}
                            />
                            <Column
                                field="valorTotal"
                                header="Subtotal Línea"
                                align="right"
                                headerClassName="table-header-invoice"
                                className="col-line-total"
                                body={valorTotalBody}
                                style={{ width: '150px' }}
                            />
                        </DataTable>
                    </div>

                    {/* Totales Section */}
                    <div className="section-container totals-section-invoice">
                        <div className="totals-wrapper">
                            <div className="section-title totals-title">
                                <i className="pi pi-calculator"></i>
                                <span>RESUMEN DE VALORES</span>
                            </div>
                            <div className="totals-card">
                                <div className="totals-row base-row">
                                    <span className="totals-label">Subtotal (Base Gravable)</span>
                                    <span className="totals-value">{formatCurrency(xmlDetail.totales.subtotal)}</span>
                                </div>
                                <div className="totals-row base-row">
                                    <span className="totals-label">Impuestos (IVA)</span>
                                    <span className="totals-value">{formatCurrency(xmlDetail.totales.impuestoTotal)}</span>
                                </div>
                                {Number(retencionCalculada) > 0 && (
                                    <div className="totals-row retention-row">
                                        <span className="totals-label">Retención en la Fuente</span>
                                        <span className="totals-value retention-value">-{formatCurrency(retencionCalculada)}</span>
                                    </div>
                                )}
                                <div className="totals-divider"></div>
                                <div className="totals-row grand-total-row">
                                    <span className="totals-label grand-total-label">TOTAL FACTURA</span>
                                    <span className="totals-value grand-total-value">{formatCurrency(xmlDetail.totales.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </Dialog>
    );
};

export default XMLDetailDialog;
