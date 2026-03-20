import React from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import PageTitle from "../components/common/PageTitle";
import "../styles/dashboard.css";

interface ProcessingItem {
  entity: string;
  id: string;
  status: string;
  date: string;
  priority: string;
}

const Dashboard: React.FC = () => {
  const queueData: ProcessingItem[] = [
    {
      entity: "Logistics Solutions S.A.",
      id: "XML-2023-0984",
      status: "EN PROCESO",
      date: "24 Oct, 2023",
      priority: "Alta",
    },
    {
      entity: "TechGlobal Dynamics",
      id: "XML-2023-1122",
      status: "EN COLA",
      date: "24 Oct, 2023",
      priority: "Media",
    },
    {
      entity: "Nordic Power Systems",
      id: "XML-2023-0751",
      status: "VALIDADO",
      date: "23 Oct, 2023",
      priority: "Baja",
    },
  ];

  const statusBodyTemplate = (rowData: ProcessingItem) => {
    const severity = rowData.status === "EN PROCESO" ? "warning" : rowData.status === "EN COLA" ? "info" : "success";
    return <Tag value={rowData.status} severity={severity} className="status-tag" />;
  };

  const priorityBodyTemplate = (rowData: ProcessingItem) => {
    const color = rowData.priority === "Alta" ? "var(--color-error)" : rowData.priority === "Media" ? "var(--color-secondary)" : "var(--color-outline)";
    return (
      <span className="priority-cell" style={{ color }}>
        <span className="priority-dot" style={{ backgroundColor: color }}></span>
        {rowData.priority}
      </span>
    );
  };

  const entityBodyTemplate = (rowData: ProcessingItem) => {
    return (
      <div className="entity-cell">
        <span className="entity-name">{rowData.entity}</span>
        <span className="entity-id">{rowData.id}</span>
      </div>
    );
  };

  const actionBodyTemplate = () => {
    return <Button icon="pi pi-ellipsis-h" text rounded severity="secondary" />;
  };

  return (
    <div className="dashboard-container">
      <header>
        <PageTitle title="Panel de Control" />
        <p className="dashboard-header-desc">Vista en tiempo real del estado de procesamiento y cola de integración ERP.</p>
      </header>

      <section className="summary-grid">
        <Card className="summary-card" style={{ borderLeft: '4px solid var(--color-primary)', borderRadius: 'var(--radius-xl)' }}>
          <div className="summary-card-header">
            <div>
              <p className="summary-card-label">Estado de la Cola</p>
              <h3 className="summary-card-title">XML Pendientes</h3>
            </div>
            <div className="summary-card-icon-container" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-primary)' }}>
              <i className="pi pi-file-import"></i>
            </div>
          </div>
          <div className="summary-card-value">124</div>
          <p className="summary-card-footer">
            <span style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center' }}><i className="pi pi-arrow-up" style={{ fontSize: '10px' }}></i> 12%</span>
            de incremento desde ayer
          </p>
        </Card>

        <Card className="summary-card" style={{ borderLeft: '4px solid var(--color-tertiary)', borderRadius: 'var(--radius-xl)' }}>
          <div className="summary-card-header">
            <div>
              <p className="summary-card-label">Control de Integridad</p>
              <h3 className="summary-card-title">Esperando Validación</h3>
            </div>
            <div className="summary-card-icon-container" style={{ backgroundColor: 'var(--color-tertiary-container)', color: 'var(--color-tertiary)' }}>
              <i className="pi pi-check-square"></i>
            </div>
          </div>
          <div className="summary-card-value">42</div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: '60%', backgroundColor: 'var(--color-tertiary)' }}></div>
          </div>
          <p className="summary-card-footer-small">60% de capacidad diaria alcanzada</p>
        </Card>

        <Card className="summary-card" style={{ borderLeft: '4px solid #60a5fa', borderRadius: 'var(--radius-xl)' }}>
          <div className="summary-card-header">
            <div>
              <p className="summary-card-label">Etapa Final</p>
              <h3 className="summary-card-title">Listo para Homologación</h3>
            </div>
            <div className="summary-card-icon-container" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <i className="pi pi-share-alt"></i>
            </div>
          </div>
          <div className="summary-card-value">89</div>
          <p className="summary-card-footer">Optimizado y listo para transferencia</p>
        </Card>
      </section>

      <div className="dashboard-main-grid">
        <Card className="queue-card" style={{ borderRadius: 'var(--radius-xl)', padding: '0.5rem', minWidth: '0' }}>
          <div className="queue-card-header">
            <h3 className="queue-card-title">Cola de Procesamiento Activa</h3>
            <Button label="Ver registro completo" icon="pi pi-arrow-right" iconPos="right" text size="small" style={{ fontWeight: 600 }} />
          </div>
          <DataTable value={queueData} scrollable scrollHeight="400px" tableStyle={{ minWidth: '50rem' }} className="p-datatable-sm">
            <Column field="entity" header="ENTIDAD / ID" body={entityBodyTemplate} headerStyle={{ fontSize: '10px', color: 'var(--color-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}></Column>
            <Column field="status" header="ESTADO" body={statusBodyTemplate} headerStyle={{ fontSize: '10px', color: 'var(--color-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}></Column>
            <Column field="date" header="FECHA RECIBIDO" headerStyle={{ fontSize: '10px', color: 'var(--color-secondary)', fontWeight: 700, letterSpacing: '0.1em' }} style={{ color: 'var(--color-secondary)', fontSize: '0.875rem' }}></Column>
            <Column field="priority" header="PRIORIDAD" body={priorityBodyTemplate} headerStyle={{ fontSize: '10px', color: 'var(--color-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}></Column>
            <Column header="ACCIÓN" body={actionBodyTemplate} headerStyle={{ fontSize: '10px', color: 'var(--color-secondary)', fontWeight: 700, letterSpacing: '0.1em' }} style={{ textAlign: 'right' }}></Column>
          </DataTable>
        </Card>

        <div className="alerts-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="availability-card">
            <h4 className="availability-label">Disponibilidad del Bridge</h4>
            <div className="availability-value">99.98%</div>
            <p className="availability-desc">Rendimiento operativo en todos los nodos en los últimos 30 días.</p>
            <div className="availability-bars">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`availability-bar ${i === 4 ? 'active' : ''}`}></div>
              ))}
            </div>
            <div className="availability-decoration"></div>
          </div>

          <Card style={{ borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-surface-container-low)' }}>
            <h4 className="alerts-card-title">Alertas del Sistema</h4>
            <div className="alerts-list">
              <div className="alert-item">
                <div className="alert-dot" style={{ backgroundColor: 'var(--color-error)' }}></div>
                <div>
                  <p className="alert-content-title">Error de Validación en XML-2023-044</p>
                  <p className="alert-content-desc">Discrepancia de esquema detectada en el encabezado.</p>
                  <span className="alert-content-time">hace 2 min</span>
                </div>
              </div>
              <div className="alert-item">
                <div className="alert-dot" style={{ backgroundColor: '#3b82f6' }}></div>
                <div>
                  <p className="alert-content-title">Homologación Completa</p>
                  <p className="alert-content-desc">Lote #422 enviado a SAP Finance.</p>
                  <span className="alert-content-time">hace 14 min</span>
                </div>
              </div>
              <div className="alert-item">
                <div className="alert-dot" style={{ backgroundColor: 'var(--color-surface-container-highest)' }}></div>
                <div>
                  <p className="alert-content-title">Respaldo Programado</p>
                  <p className="alert-content-desc">Snapshot semanal programado para las 02:00 UTC.</p>
                  <span className="alert-content-time">hace 1 hora</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
