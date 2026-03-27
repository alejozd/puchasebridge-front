import React from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import ProductTable from './ProductTable';
import type { XMLFileDetail, XMLValidationResult } from '../../types/xml';

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

  const hasPendingHomologation = detail.productos.some(p => !p.equivalencia_id);
  const isValidated = detail.estado.toUpperCase() === 'VALIDADO' || detail.estado.toUpperCase() === 'PROCESADO';
  const isProcessed = detail.estado.toUpperCase() === 'PROCESADO';

  const getStatusTag = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PROCESADO':
        return <Tag value="PROCESADO" severity="success" className="status-tag-large" />;
      case 'VALIDADO':
      case 'LISTO':
        return <Tag value="VALIDADO" severity="info" className="status-tag-large" />;
      default:
        return <Tag value="CARGADO" severity="warning" className="status-tag-large" />;
    }
  };

  return (
    <div className="xml-detail-container h-full flex flex-column">
      {/* DEBUG RENDER */}
      <pre style={{ display: 'none' }}>{JSON.stringify(detail, null, 2)}</pre>

      {/* PROFESSIONAL HEADER */}
      <div className="detail-header-professional mb-4">
        <div className="flex justify-content-between align-items-start">
          <div className="header-info">
            <div className="flex align-items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-primary m-0">{detail.fileName}</h2>
                {getStatusTag(detail.estado)}
            </div>
            <div className="flex flex-wrap gap-4 text-secondary text-sm">
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-building"></i>
                    <span className="font-semibold">{detail.proveedorNombre}</span>
                    <span className="opacity-60">({detail.proveedorNit})</span>
                </div>
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-calendar"></i>
                    <span>{detail.fechaDocumento}</span>
                </div>
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-upload"></i>
                    <span>Cargado: {detail.fechaCarga}</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      <Divider className="my-2" />

      {/* STEPPER VISUAL */}
      <div className="stepper-visual flex align-items-center justify-content-center gap-4 mb-5">
        <div className={`step-item ${isValidated ? 'completed' : 'active'}`}>
            <div className="step-circle">1</div>
            <span className="step-label">Validar</span>
        </div>
        <div className="step-connector"></div>
        <div className={`step-item ${isProcessed ? 'completed' : detail.estado.toUpperCase() === 'VALIDADO' ? 'active' : 'pending'}`}>
            <div className="step-circle">2</div>
            <span className="step-label">Procesar</span>
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
            <Button
                label="Procesar ahora"
                icon="pi pi-play-circle"
                onClick={onProcesar}
                loading={processing}
                disabled={validating || loading}
                className="p-button-lg p-button-success shadow-2"
            />
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
