import React from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Timeline } from 'primereact/timeline';
import ProductTable from './ProductTable';
import type { XMLFileDetail, XMLValidationResult } from '../../types/xml';
import './XmlDetail.css';
import { logger } from '../../utils/logger';

interface XmlDetailProps {
  detail: XMLFileDetail | null;
  onValidate: () => void;
  onProcesar: () => void;
  validating: boolean;
  processing: boolean;
  loading: boolean;
  validationResult: XMLValidationResult | null;
  generatedDoc: string | null;
}

const XmlDetail: React.FC<XmlDetailProps> = ({
  detail,
  onValidate,
  onProcesar,
  validating,
  processing,
  loading,
  validationResult,
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

  const hasPendingHomologation = detail.productos.some(
    p => p.estadoProducto === 'PENDIENTE'
  );
  const canProcess = detail.productos.every(
    (p) => p.estadoProducto === 'HOMOLOGADO'
  );
  const pendingCount = detail.productos.filter(
    (p) => p.estadoProducto !== 'HOMOLOGADO'
  ).length;
  const formatDate = (date?: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleString();
  };

  const timelineEvents = [
    {
      label: 'Cargado',
      date: detail.fechaCarga,
      done: true
    },
    {
      label: 'Validado',
      date: detail.fechaValidacion,
      done: !!detail.fechaValidacion
    },
    {
      label: 'Procesado',
      date: detail.fechaProceso,
      done: !!detail.fechaProceso
    }
  ];

  const getStatusTag = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PROCESADO') return <Tag value="PROCESADO" severity="success" className="status-tag-large" />;
    if (s === 'VALIDADO' || s === 'LISTO') return <Tag value="VALIDADO" severity="info" className="status-tag-large" />;
    if (s === 'ERROR') return <Tag value="ERROR" severity="danger" className="status-tag-large" />;
    return <Tag value="CARGADO" severity="warning" className="status-tag-large" />;
  };

  return (
    <div className="xml-detail-container h-full flex flex-column">
      {/* DEBUG RENDER */}
      <pre style={{ display: 'none' }}>{JSON.stringify(detail, null, 2)}</pre>

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

      {/* TIMELINE VISUAL */}
      <div className="timeline-wrapper">
        <div className="timeline-container">
          <Timeline
            value={timelineEvents}
            layout="horizontal"
            content={(item) => (
              <div className="timeline-content">
                <span className={`timeline-label ${item.done ? 'done' : ''}`}>
                  {item.label}
                </span>
                {item.date && (
                  <small className="timeline-date">
                    {formatDate(item.date)}
                  </small>
                )}
              </div>
            )}
            marker={(item) => (
              <div className={`timeline-marker ${item.done ? 'done' : ''}`}>
                <i className={item.done ? 'pi pi-check' : 'pi pi-clock'} />
              </div>
            )}
          />
        </div>
      </div>

      {/* VALIDATION SECTION */}
      {validationResult && (
        <div className={`validation-result-panel p-4 border-round mb-4 ${validationResult.valido ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex align-items-center gap-3 mb-2">
                <i className={`pi ${validationResult.valido ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500'} text-xl`}></i>
                <h4 className={`m-0 font-bold ${validationResult.valido ? 'text-green-800' : 'text-red-800'}`}>
                    {validationResult.valido ? 'Documento válido para procesamiento' : 'Se encontraron errores de validación'}
                </h4>
            </div>
            {!validationResult.valido && (
                <ul className="m-0 pl-4 text-red-700 text-sm list-none">
                    {validationResult.errores.map((err, i) => (
                        <li key={i} className="mb-1 flex align-items-start gap-2">
                            <i className="pi pi-circle-fill text-3xs mt-1"></i>
                            {err}
                        </li>
                    ))}
                </ul>
            )}
        </div>
      )}

      {/* RESULT SECTION */}
      {generatedDoc && (
        <div className="generated-doc-highlight p-4 border-round mb-4 bg-primary-container text-primary-on-container flex align-items-center gap-4">
            <div className="result-icon-bg">
                <i className="pi pi-file-export text-2xl"></i>
            </div>
            <div>
                <span className="block text-xs font-bold uppercase tracking-wider opacity-70">Documento Generado en Helisa</span>
                <span className="block text-xl font-mono font-bold text-primary">{generatedDoc}</span>
            </div>
        </div>
      )}

      {hasPendingHomologation && !validationResult && detail.estado.toUpperCase() === 'CARGADO' && (
        <div className="alert-warning p-3 border-round mb-4 flex align-items-center gap-2">
          <i className="pi pi-exclamation-triangle"></i>
          <span className="text-sm font-semibold">Existen productos pendientes de homologación</span>
        </div>
      )}

      <div className="flex-grow-1 overflow-hidden flex flex-column">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">Productos en el documento</h3>
        <div className="flex-grow-1 overflow-auto">
          <ProductTable productos={detail.productos} />
        </div>
      </div>

      <Divider />

      {/* FOOTER ACTIONS - DYNAMIC SMART BUTTONS */}
      <div className="detail-footer-actions flex justify-content-end align-items-center py-2">
        {detail.estado.toUpperCase() === 'PROCESADO' && (
             <Message severity="success" text="Este documento ya fue procesado y enviado al ERP" className="w-full" />
        )}

        {detail.estado.toUpperCase() === 'VALIDADO' && (
          <div className="flex flex-column align-items-end gap-2">
            <Button
              label="Procesar"
              icon="pi pi-check"
              onClick={onProcesar}
              loading={processing}
              disabled={!canProcess || processing || loading}
              tooltip={!canProcess ? 'Todos los productos deben estar homologados' : ''}
              className="p-button-lg p-button-success shadow-2"
            />
            {!canProcess && (
              <small className="text-red-500">
                Este documento tiene {pendingCount} producto(s) pendiente(s) de homologación.
              </small>
            )}
          </div>
        )}

        {detail.estado.toUpperCase() === 'CARGADO' && (
            <Button
                label="Iniciar Validación"
                icon="pi pi-shield"
                onClick={onValidate}
                loading={validating}
                disabled={processing || loading || hasPendingHomologation}
                className={`p-button-lg shadow-2 ${hasPendingHomologation ? 'p-button-secondary' : 'p-button-primary'}`}
                tooltip={hasPendingHomologation ? "Debe homologar todos los productos primero" : "Verificar consistencia del documento"}
            />
        )}
      </div>
    </div>
  );
};

export default XmlDetail;
