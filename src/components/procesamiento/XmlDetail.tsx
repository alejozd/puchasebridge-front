import React from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import ProductTable from './ProductTable';
import type { XMLFileDetail } from '../../types/xml';

interface XmlDetailProps {
  detail: XMLFileDetail | null;
  onValidate: () => void;
  onProcesar: () => void;
  validating: boolean;
  processing: boolean;
  loading: boolean;
}

const XmlDetail: React.FC<XmlDetailProps> = ({
  detail,
  onValidate,
  onProcesar,
  validating,
  processing,
  loading
}) => {
  if (loading) {
    return (
      <div className="detail-empty-state">
        <i className="pi pi-spin pi-spinner text-3xl mb-3"></i>
        <p>Cargando información del archivo...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="detail-empty-state">
        <i className="pi pi-file-search text-3xl mb-3 opacity-50"></i>
        <p>Selecciona un archivo para ver su detalle</p>
      </div>
    );
  }

  const hasPendingHomologation = detail.productos.some(p => !p.equivalencia_id);

  return (
    <div className="xml-detail-container h-full flex flex-column">
      <div className="detail-header flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-primary m-0 mb-1">{detail.file_name}</h2>
          <p className="text-secondary m-0">{detail.proveedor_nombre}</p>
        </div>
        <div className="detail-actions flex gap-2">
          <Button
            label="Validar XML"
            icon="pi pi-shield"
            onClick={onValidate}
            loading={validating}
            className="p-button-outlined p-button-secondary"
            disabled={processing}
          />
          <Button
            label="Procesar XML"
            icon="pi pi-play"
            onClick={onProcesar}
            loading={processing}
            disabled={hasPendingHomologation || validating}
            className="p-button-primary"
          />
        </div>
      </div>

      {hasPendingHomologation && (
        <div className="alert-warning p-3 border-round mb-4 flex align-items-center gap-2">
          <i className="pi pi-exclamation-triangle"></i>
          <span className="text-sm font-semibold">Existen productos pendientes de homologación</span>
        </div>
      )}

      <div className="detail-grid grid mb-4">
        <div className="col-12 md:col-6 lg:col-4">
          <div className="detail-field">
            <span className="label">Proveedor NIT</span>
            <span className="value">{detail.proveedor_nit}</span>
          </div>
        </div>
        <div className="col-12 md:col-6 lg:col-4">
          <div className="detail-field">
            <span className="label">Fecha Documento</span>
            <span className="value">{detail.fecha_documento}</span>
          </div>
        </div>
        <div className="col-12 md:col-6 lg:col-4">
          <div className="detail-field">
            <span className="label">Estado</span>
            <Tag value={detail.estado} severity={detail.estado === 'PROCESADO' ? 'success' : 'info'} />
          </div>
        </div>
      </div>

      <div className="flex-grow-1 overflow-hidden flex flex-column">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">Productos en el documento</h3>
        <div className="flex-grow-1 overflow-auto">
          <ProductTable productos={detail.productos} />
        </div>
      </div>
    </div>
  );
};

export default XmlDetail;
