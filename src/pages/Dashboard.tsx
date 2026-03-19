import React from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";

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
    return <Tag value={rowData.status} severity={severity} style={{ fontSize: '10px', fontWeight: 'bold' }} />;
  };

  const priorityBodyTemplate = (rowData: ProcessingItem) => {
    const color = rowData.priority === "Alta" ? "var(--color-error)" : rowData.priority === "Media" ? "var(--color-secondary)" : "var(--color-outline)";
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color, fontWeight: 500 }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }}></span>
        {rowData.priority}
      </span>
    );
  };

  const entityBodyTemplate = (rowData: ProcessingItem) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{rowData.entity}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', fontFamily: 'monospace' }}>{rowData.id}</span>
      </div>
    );
  };

  const actionBodyTemplate = () => {
    return <Button icon="pi pi-ellipsis-h" text rounded severity="secondary" />;
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      <header>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-on-surface)', letterSpacing: '-0.025em', margin: 0 }}>Panel de Control</h2>
        <p style={{ color: 'var(--color-secondary)', marginTop: '0.25rem' }}>Vista en tiempo real del estado de procesamiento y cola de integración ERP.</p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <Card className="summary-card" style={{ borderLeft: '4px solid var(--color-primary)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-secondary)', margin: '0 0 0.25rem 0' }}>Estado de la Cola</p>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>XML Pendientes</h3>
            </div>
            <div style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-primary)', padding: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
              <i className="pi pi-file-import"></i>
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>124</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', margin: '0.5rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center' }}><i className="pi pi-arrow-up" style={{ fontSize: '10px' }}></i> 12%</span>
            de incremento desde ayer
          </p>
        </Card>

        <Card className="summary-card" style={{ borderLeft: '4px solid var(--color-tertiary)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-secondary)', margin: '0 0 0.25rem 0' }}>Control de Integridad</p>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Esperando Validación</h3>
            </div>
            <div style={{ backgroundColor: 'var(--color-tertiary-container)', color: 'var(--color-tertiary)', padding: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
              <i className="pi pi-check-square"></i>
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>42</div>
          <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--color-surface-container)', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '60%', backgroundColor: 'var(--color-tertiary)' }}></div>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--color-secondary)', margin: '0.5rem 0 0 0' }}>60% de capacidad diaria alcanzada</p>
        </Card>

        <Card className="summary-card" style={{ borderLeft: '4px solid #60a5fa', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-secondary)', margin: '0 0 0.25rem 0' }}>Etapa Final</p>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Listo para Homologación</h3>
            </div>
            <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
              <i className="pi pi-share-alt"></i>
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>89</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', margin: '0.5rem 0 0 0' }}>Optimizado y listo para transferencia</p>
        </Card>
      </section>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <Card className="queue-card" style={{ borderRadius: 'var(--radius-xl)', padding: '0.5rem', minWidth: '0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Cola de Procesamiento Activa</h3>
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
          <div style={{ background: 'linear-gradient(to bottom right, var(--color-primary), var(--color-primary-dim))', padding: '2rem', borderRadius: 'var(--radius-xl)', color: 'var(--color-on-primary)', position: 'relative', overflow: 'hidden' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, margin: '0 0 1rem 0' }}>Disponibilidad del Bridge</h4>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>99.98%</div>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: 0 }}>Rendimiento operativo en todos los nodos en los últimos 30 días.</p>
            <div style={{ display: 'flex', gap: '4px', marginTop: '1.5rem' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: '32px', flex: 1, backgroundColor: i === 4 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></div>
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: '-2.5rem', right: '-2.5rem', width: '10rem', height: '10rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(3xl)' }}></div>
          </div>

          <Card style={{ borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-surface-container-low)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 1.5rem 0' }}>Alertas del Sistema</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-error)', marginTop: '4px', flexShrink: 0 }}></div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>Error de Validación en XML-2023-044</p>
                  <p style={{ fontSize: '10px', color: 'var(--color-secondary)', margin: '2px 0 0 0' }}>Discrepancia de esquema detectada en el encabezado.</p>
                  <span style={{ fontSize: '9px', color: 'var(--color-outline)', textTransform: 'uppercase', display: 'block', marginTop: '4px' }}>hace 2 min</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', marginTop: '4px', flexShrink: 0 }}></div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>Homologación Completa</p>
                  <p style={{ fontSize: '10px', color: 'var(--color-secondary)', margin: '2px 0 0 0' }}>Lote #422 enviado a SAP Finance.</p>
                  <span style={{ fontSize: '9px', color: 'var(--color-outline)', textTransform: 'uppercase', display: 'block', marginTop: '4px' }}>hace 14 min</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-surface-container-highest)', marginTop: '4px', flexShrink: 0 }}></div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>Respaldo Programado</p>
                  <p style={{ fontSize: '10px', color: 'var(--color-secondary)', margin: '2px 0 0 0' }}>Snapshot semanal programado para las 02:00 UTC.</p>
                  <span style={{ fontSize: '9px', color: 'var(--color-outline)', textTransform: 'uppercase', display: 'block', marginTop: '4px' }}>hace 1 hora</span>
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
