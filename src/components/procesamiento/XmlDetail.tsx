import React, { useMemo } from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Timeline } from 'primereact/timeline';
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

  const hasPendingHomologation = useMemo(() => 
    detail.productos.some(p => p.estadoProducto === 'PENDIENTE'),
    [detail.productos]
  );

  const canProcess = useMemo(() => 
    detail.productos.every(p => p.estadoProducto === 'HOMOLOGADO'),
    [detail.productos]
  );

  const pendingCount = useMemo(() => 
    detail.productos.filter(p => p.estadoProducto !== 'HOMOLOGADO').length,
    [detail.productos]
  );

  const timelineEvents = useMemo<TimelineEvent[]>(() => [
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
  ], [detail]);

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
      {/* PROFESSIONAL HEADER */}
      <div className="detail-header-professional mb-4">
        <div className="flex justify-content-between align-items-start">
          <div className="header-info">
            <div className="header-title-row">
              <h2 className="file-name" title={detail.fileName}>
                {detail.fileName}
              </h2>
              {getStatusTag(detail.estado)}
            </div>
            <div className="header-meta">
              <div className="header-meta-item">
                <i className="pi pi-building"></i>
                <span>{detail.proveedorNombre}</span>
                <span className="meta-secondary">({detail.proveedorNit})</span>
              </div>
              <div className="header-meta-item">
                <i className="pi pi-calendar"></i>
                <span>{detail.fechaDocumento}</span>
              </div>
              <div className="header-meta-item">
                <i className="pi pi-upload"></i>
                <span>Cargado: {detail.fechaCarga}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Divider className="my-2" />

      {/* TIMELINE VISUAL - MODERN */}
      <div className="timeline-wrapper-modern">
        <div className="timeline-container-modern">
          <Timeline
            value={timelineEvents}
            layout="horizontal"
            align="alternate"
            className="modern-timeline"
            content={(item) => (
              <div className="timeline-content-modern">
                <span className={`timeline-label-modern ${item.done ? 'done' : ''}`}>
                  {item.label}
                </span>
                {item.date && (
                  <>
                    <small className="timeline-date-modern">
                      {formatDate(item.date)}
                    </small>
                    <span className="timeline-time-ago">{formatTimeAgo(item.date)}</span>
                  </>
                )}
              </div>
            )}
            marker={(item) => (
              <div className={`timeline-marker-modern ${item.done ? 'done' : ''} marker-${item.label.toLowerCase()}`}>
                <i className={item.done ? 'pi pi-check' : 'pi pi-clock'} />
              </div>
            )}
          />
        </div>
      </div>


      {/* RESULT SECTION */}
      {generatedDoc && (
        <div className="generated-doc-highlight-modern p-4 border-round mb-4 flex align-items-center gap-4">
            <div className="result-icon-bg-modern">
                <i className="pi pi-file-export text-2xl"></i>
            </div>
            <div className="flex-grow-1">
                <span className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Documento Generado en Helisa</span>
                <span className="block text-xl font-mono font-bold text-primary">{generatedDoc}</span>
            </div>
            <Button 
              icon="pi pi-external-link" 
              label="Ver Documento" 
              className="p-button-outlined p-button-sm"
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
        <div className="section-header-modern mb-3">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-1">
            Productos en el documento
          </h3>
          <div className="product-stats flex gap-3">
            <Tag 
              value={`${detail.productos.length} productos`} 
              severity="info" 
              className="stat-tag"
            />
            <Tag 
              value={`${pendingCount} pendientes`} 
              severity={pendingCount > 0 ? 'warning' : 'success'} 
              className="stat-tag"
            />
          </div>
        </div>
        <div className="flex-grow-1 overflow-auto products-table-container">
          <ProductTable productos={detail.productos} />
        </div>
      </div>

      <Divider className="my-3" />

      {/* FOOTER ACTIONS - MODERN SMART BUTTONS */}
      <div className="detail-footer-actions-modern flex justify-content-between align-items-center py-3 px-4 border-round bg-surface-50">
        {detail.estado.toUpperCase() === 'PROCESADO' && (
             <Message 
               severity="success" 
               icon="pi pi-check-circle"
               text="Documento procesado y enviado al ERP exitosamente" 
               className="w-full" 
             />
        )}

        {detail.estado.toUpperCase() === 'VALIDADO' && (
          <div className="flex align-items-center gap-3 w-full justify-content-between">
            {!canProcess && (
              <Message 
                severity="warn" 
                icon="pi pi-info-circle"
                text={`${pendingCount} producto(s) pendiente(s) de homologación`} 
                className="flex-grow-1"
              />
            )}
            <Button
              label="Procesar Documento"
              icon="pi pi-file-export"
              onClick={onProcesar}
              loading={processing}
              disabled={!canProcess || processing || loading}
              tooltip={!canProcess ? 'Todos los productos deben estar homologados' : ''}
              className="p-button-lg p-button-success shadow-3"
              rounded
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default XmlDetail;
