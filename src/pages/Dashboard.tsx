import React, { useEffect, useState, useCallback } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import PageTitle from "../components/common/PageTitle";
import { useXMLStore } from "../store/xmlStore";
import { getDashboardMetrics } from "../services/xmlService";
import type { DashboardMetrics, XMLFile } from "../types/xml";
import "../styles/dashboard.css";

const Dashboard: React.FC = () => {
  const { xmlList, loading: loadingFiles, fetchXMLList } = useXMLStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [metricsData] = await Promise.all([
        getDashboardMetrics(),
        fetchXMLList()
      ]);
      setMetrics(metricsData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("No se pudieron cargar los datos del dashboard. Reintentando...");
    } finally {
      setLoadingMetrics(false);
    }
  }, [fetchXMLList]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const statusBodyTemplate = (rowData: XMLFile) => {
    const estado = rowData.estado?.toUpperCase() || 'CARGADO';
    let severity: "success" | "secondary" | "info" | "warning" | "danger" = "secondary";

    switch (estado) {
      case 'LISTO': severity = 'success'; break;
      case 'PENDIENTE': severity = 'warning'; break;
      case 'ERROR': severity = 'danger'; break;
      case 'PROCESADO': severity = 'info'; break;
      default: severity = 'secondary';
    }

    return <Tag value={estado} severity={severity} className="status-tag" />;
  };

  const prioritySort = (data: XMLFile[]) => {
    const priorityMap: Record<string, number> = {
      'ERROR': 0,
      'PENDIENTE': 1,
      'CARGADO': 2,
      'LISTO': 3,
      'PROCESADO': 4
    };

    return [...data].sort((a, b) => {
      const pA = priorityMap[a.estado?.toUpperCase() || 'CARGADO'] ?? 5;
      const pB = priorityMap[b.estado?.toUpperCase() || 'CARGADO'] ?? 5;
      return pA - pB;
    });
  };

  const sortedXmlList = prioritySort(xmlList);

  const availability = metrics && metrics.total > 0
    ? ((metrics.procesados / metrics.total) * 100).toFixed(2)
    : "0.00";

  const alerts = [];
  if (metrics) {
    if (metrics.errores > 0) {
      alerts.push({
        title: `Error de Validación (${metrics.errores})`,
        desc: "Existen documentos con errores que requieren atención inmediata.",
        color: 'var(--color-error)',
        time: 'ACTIVO'
      });
    }
    if (metrics.pendientes > 0) {
      alerts.push({
        title: "Homologación Pendiente",
        desc: `Hay ${metrics.pendientes} productos nuevos que necesitan ser mapeados.`,
        color: 'var(--color-warning)',
        time: 'PENDIENTE'
      });
    }
    if (metrics.procesadosHoy > 0) {
      alerts.push({
        title: "Procesamiento Exitoso",
        desc: `Se han procesado ${metrics.procesadosHoy} documentos el día de hoy.`,
        color: 'var(--color-success)',
        time: 'HOY'
      });
    }
  }

  const kpiCards = [
    { label: "ESTADO DE LA COLA", title: "En Cola", value: metrics ? metrics.cargados + metrics.pendientes : 0, icon: "pi-clock", color: "warning" },
    { label: "MAPEADO DE PRODUCTOS", title: "Pendientes de Homologación", value: metrics?.pendientes || 0, icon: "pi-sync", color: "info" },
    { label: "VALIDACIÓN COMPLETA", title: "Listos para Procesar", value: metrics?.listos || 0, icon: "pi-check-circle", color: "success" },
    { label: "INTEGRACIÓN ERP", title: "Procesados", value: metrics?.procesados || 0, icon: "pi-database", color: "primary" },
    { label: "CONTROL DE CALIDAD", title: "Errores", value: metrics?.errores || 0, icon: "pi-exclamation-triangle", color: "danger" },
  ];

  return (
    <div className="dashboard-container">
      <header>
        <PageTitle title="Panel de Control" />
        <p className="dashboard-header-desc">Vista en tiempo real del estado de procesamiento y cola de integración ERP.</p>
        {error && <Tag severity="danger" value={error} style={{ marginBottom: '1rem' }} icon="pi pi-exclamation-circle" />}
      </header>

      <section className="summary-grid">
        {kpiCards.map((kpi, idx) => (
          <Card key={idx} className={`summary-card border-${kpi.color}`}>
            <div className="summary-card-header">
              <div>
                <p className="summary-card-label">{kpi.label}</p>
                <h3 className="summary-card-title">{kpi.title}</h3>
              </div>
              <div className={`summary-card-icon-container bg-${kpi.color}-container text-${kpi.color}`}>
                <i className={`pi ${kpi.icon}`}></i>
              </div>
            </div>
            {loadingMetrics ? (
              <Skeleton width="4rem" height="2.5rem" />
            ) : (
              <div className="summary-card-value">{kpi.value}</div>
            )}
            <p className="summary-card-footer">Actualizado hace un momento</p>
          </Card>
        ))}
      </section>

      <div className="dashboard-main-grid">
        <Card className="queue-card" style={{ borderRadius: 'var(--radius-xl)', padding: '0.5rem', minWidth: '0' }}>
          <div className="queue-card-header">
            <h3 className="queue-card-title">Cola de Procesamiento Activa</h3>
            <Button label="Ver registro completo" icon="pi pi-arrow-right" iconPos="right" text size="small" style={{ fontWeight: 600 }} />
          </div>
          {loadingFiles ? (
             <div style={{ padding: '1rem' }}>
                <Skeleton className="mb-2" height="2rem"></Skeleton>
                <Skeleton className="mb-2" height="2rem"></Skeleton>
                <Skeleton className="mb-2" height="2rem"></Skeleton>
                <Skeleton className="mb-2" height="2rem"></Skeleton>
             </div>
          ) : (
            <DataTable value={sortedXmlList} scrollable scrollHeight="400px" tableStyle={{ minWidth: '50rem' }} className="p-datatable-sm">
              <Column field="fileName" header="ARCHIVO" headerStyle={{ fontSize: '10px', color: 'var(--color-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}></Column>
              <Column field="proveedor" header="PROVEEDOR" headerStyle={{ fontSize: '10px', color: 'var(--color-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}></Column>
              <Column field="estado" header="ESTADO" body={statusBodyTemplate} headerStyle={{ fontSize: '10px', color: 'var(--color-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}></Column>
              <Column field="lastModified" header="FECHA CARGA" headerStyle={{ fontSize: '10px', color: 'var(--color-secondary)', fontWeight: 700, letterSpacing: '0.1em' }} style={{ color: 'var(--color-secondary)', fontSize: '0.875rem' }}></Column>
              <Column field="fechaProceso" header="FECHA PROCESO" headerStyle={{ fontSize: '10px', color: 'var(--color-secondary)', fontWeight: 700, letterSpacing: '0.1em' }} style={{ color: 'var(--color-secondary)', fontSize: '0.875rem' }}></Column>
            </DataTable>
          )}
        </Card>

        <div className="alerts-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="availability-card">
            <h4 className="availability-label">Disponibilidad del Bridge</h4>
            {loadingMetrics ? (
              <Skeleton width="6rem" height="3rem" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            ) : (
              <div className="availability-value">{availability}%</div>
            )}
            <p className="availability-desc">Tasa de éxito en el procesamiento histórico de documentos.</p>
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
              {alerts.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>No hay alertas activas en este momento.</p>
              ) : (
                alerts.slice(0, 3).map((alert, idx) => (
                  <div key={idx} className="alert-item">
                    <div className="alert-dot" style={{ backgroundColor: alert.color }}></div>
                    <div>
                      <p className="alert-content-title">{alert.title}</p>
                      <p className="alert-content-desc">{alert.desc}</p>
                      <span className="alert-content-time">{alert.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
