import React, { useMemo } from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import ProductTable from './ProductTable';
import type { XMLFileDetail } from '../../types/xml';
import './XmlDetail.css';
import { logger } from '../../utils/logger';

interface XmlDetailProps {
  detail: XMLFileDetail | null;
  onProcesar: () => void;
  processing: boolean;
  loading: boolean;
  generatedDoc: string | null;
}

interface TimelineEvent {
  label: string;
  date?: string | null;
  done: boolean;
  icon: string;
  description: string;
}

const XmlDetail: React.FC<XmlDetailProps> = ({
  detail,
  onProcesar,
  processing,
  loading,
  generatedDoc
}) => {
  // Mover todos los hooks antes de los early returns
  const hasPendingHomologation = useMemo(() => 
    detail?.productos.some(p => p.estadoProducto === 'PENDIENTE') ?? false,
    [detail?.productos]
  );

  const canProcess = useMemo(() => 
    detail?.productos.every(p => p.estadoProducto === 'HOMOLOGADO') ?? false,
    [detail?.productos]
  );

  const pendingCount = useMemo(() => 
    detail?.productos.filter(p => p.estadoProducto !== 'HOMOLOGADO').length ?? 0,
    [detail?.productos]
  );

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!detail) return [];
    return [
      {
        label: 'Cargado',
        date: detail.fechaCarga,
        done: true,
        icon: 'pi pi-upload',
        description: 'Archivo cargado en el sistema'
      },
      {
        label: 'Validado',
        date: detail.fechaValidacion,
        done: !!detail.fechaValidacion,
        icon: 'pi pi-check-circle',
        description: 'Documento validado correctamente'
      },
      {
        label: 'Procesado',
        date: detail.fechaProceso,
        done: !!detail.fechaProceso,
        icon: 'pi pi-file-export',
        description: 'Enviado al ERP'
      }
    ];
  }, [detail]);

  if (loading) {
    return (
      <div className="detail-empty-state flex-column gap-3">
        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
        <p className="font-semibold text-secondary">Cargando información del archivo...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="detail-empty-state">
        <i className="pi pi-file text-4xl mb-3 opacity-50"></i>
        <p>No hay información del documento</p>
      </div>
    );
  }

  logger.log(detail.productos);

  const formatDate = (date?: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (date?: string | null) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Justo ahora';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays}d`;
  };

  const getStatusTag = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PROCESADO') return <Tag value="PROCESADO" severity="success" className="status-tag-large" />;
    if (s === 'VALIDADO' || s === 'LISTO') return <Tag value="VALIDADO" severity="info" className="status-tag-large" />;
    if (s === 'ERROR') return <Tag value="ERROR" severity="danger" className="status-tag-large" />;
    return <Tag value="CARGADO" severity="warning" className="status-tag-large" />;
  };

  return (
    <div className="xml-detail-container h-full flex flex-column">
      {/* HEADER COMPACTO */}
      <div className="detail-header-compact mb-3">
        <div className="flex justify-content-between align-items-start gap-3">
          <div className="header-info flex-grow-1">
            <div className="header-title-row mb-2">
              <h2 className="file-name" title={detail.fileName}>
                {detail.fileName}
              </h2>
              {getStatusTag(detail.estado)}
            </div>
            <div className="header-meta-compact">
              <div className="meta-item">
                <i className="pi pi-building"></i>
                <span>{detail.proveedorNombre}</span>
                <span className="meta-nit">({detail.proveedorNit})</span>
              </div>
              <div className="meta-divider"></div>
              <div className="meta-item">
                <i className="pi pi-calendar"></i>
                <span>{detail.fechaDocumento}</span>
              </div>
              <div className="meta-divider"></div>
              <div className="meta-item">
                <i className="pi pi-clock"></i>
                <span>{formatTimeAgo(detail.fechaCarga)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE SUTIL - Minimalista */}
      <div className="timeline-subtle-wrapper mb-3">
        <div className="timeline-subtle">
          {timelineEvents.map((event, index) => (
            <React.Fragment key={event.label}>
              <div className="timeline-event-subtle">
                <div className={`event-marker ${event.done ? 'done' : ''}`}>
                  <i className={event.done ? 'pi pi-check' : 'pi pi-circle-on'} />
                </div>
                <div className="event-info">
                  <span className={`event-label ${event.done ? 'done' : ''}`}>
                    {event.label}
                  </span>
                  {event.date && (
                    <small className="event-date">{formatDate(event.date)}</small>
                  )}
                </div>
              </div>
              {index < timelineEvents.length - 1 && (
                <div className={`event-connector ${timelineEvents[index + 1].done ? 'done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>


      {/* RESULT SECTION - Discreto */}
      {generatedDoc && (
        <div className="generated-doc-simple p-3 border-round mb-3 flex align-items-center gap-3 bg-blue-50">
            <i className="pi pi-file-export text-blue-600 text-xl"></i>
            <div className="flex-grow-1">
                <span className="block text-xs font-medium text-blue-700 mb-0">Documento en Helisa:</span>
                <span className="block text-sm font-mono font-semibold text-primary">{generatedDoc}</span>
            </div>
            <Button 
              icon="pi pi-external-link" 
              label="Ver" 
              className="p-button-text p-button-sm"
              tooltip="Abrir documento en Helisa"
            />
        </div>
      )}

      {hasPendingHomologation && detail.estado.toUpperCase() === 'CARGADO' && (
        <Message 
          severity="warn" 
          icon="pi pi-exclamation-triangle"
          text="Existen productos pendientes de homologación. Debes homologar todos los productos antes de procesar el documento." 
          className="w-full mb-4"
        />
      )}

      <div className="flex-grow-1 overflow-hidden flex flex-column">
        <div className="section-header-simple mb-2 flex justify-content-between align-items-center">
          <h3 className="text-sm font-semibold text-secondary m-0">
            Productos ({detail.productos.length})
          </h3>
          <div className="product-stats-simple flex gap-2">
            <Tag 
              value={`${pendingCount} pendientes`} 
              severity={pendingCount > 0 ? 'warning' : 'success'} 
            />
          </div>
        </div>
        <div className="flex-grow-1 overflow-auto products-table-container">
          <ProductTable productos={detail.productos} />
        </div>
      </div>

      {/* FOOTER ACTIONS - Simple */}
      <div className="detail-footer-simple flex justify-content-between align-items-center py-2 mt-3">
        {detail.estado.toUpperCase() === 'PROCESADO' && (
             <Message 
               severity="success" 
               icon="pi pi-check-circle"
               text="Documento procesado y enviado al ERP" 
               className="w-full" 
             />
        )}

        {detail.estado.toUpperCase() === 'VALIDADO' && (
          <div className="flex align-items-center gap-3 w-full justify-content-between">
            {!canProcess && (
              <Message 
                severity="warn" 
                icon="pi pi-info-circle"
                text={`${pendingCount} producto(s) pendiente(s)`} 
                className="flex-grow-1"
              />
            )}
            <Button
              label="Procesar Documento"
              icon="pi pi-file-export"
              onClick={onProcesar}
              loading={processing}
              disabled={!canProcess || processing || loading}
              tooltip={!canProcess ? 'Homologa todos los productos primero' : ''}
              className="p-button-sm p-button-success"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default XmlDetail;
