import React, { useEffect, useState, useCallback } from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import PageTitle from "../components/common/PageTitle";
import { useXMLStore } from "../store/xmlStore";
import { getDashboardMetrics } from "../services/xmlService";
import type { DashboardMetrics, XMLFile } from "../types/xml";
import "../styles/dashboard.css";
import { logger } from '../utils/logger';

const Dashboard: React.FC = () => {
  const { xmlList, loading: loadingFiles, fetchXMLList } = useXMLStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoadingMetrics(true);
      const [metricsData] = await Promise.all([
        getDashboardMetrics(),
        fetchXMLList(),
      ]);
      setMetrics(metricsData);
    } catch (err) {
      logger.error("Error loading dashboard data:", err);
      setError(
        "No se pudieron cargar los datos del dashboard. Reintentando...",
      );
    } finally {
      setLoadingMetrics(false);
    }
  }, [fetchXMLList]);

  const silentRefresh = useCallback(async () => {
    try {
      const metricsData = await getDashboardMetrics();
      setMetrics(metricsData);
      // We don't refresh the XML list here to avoid visual reflow
    } catch (err) {
      logger.error("Error silent refreshing dashboard metrics:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(silentRefresh, 30000);
    return () => clearInterval(interval);
  }, [loadData, silentRefresh]);

  const statusTag = (estado: string | undefined) => {
    const status = estado?.toUpperCase() || "CARGADO";
    let severity: "success" | "secondary" | "info" | "warning" | "danger" =
      "secondary";

    switch (status) {
      case "LISTO":
        severity = "success";
        break;
      case "PENDIENTE":
        severity = "warning";
        break;
      case "ERROR":
        severity = "danger";
        break;
      case "PROCESADO":
        severity = "info";
        break;
      default:
        severity = "secondary";
    }

    return <Tag value={status} severity={severity} className="status-tag" />;
  };

  const prioritySort = (data: XMLFile[]) => {
    const priorityMap: Record<string, number> = {
      ERROR: 0,
      PENDIENTE: 1,
      CARGADO: 2,
      LISTO: 3,
      PROCESADO: 4,
    };

    return [...data].sort((a, b) => {
      const pA = priorityMap[a.estado?.toUpperCase() || "CARGADO"] ?? 5;
      const pB = priorityMap[b.estado?.toUpperCase() || "CARGADO"] ?? 5;
      return pA - pB;
    });
  };

  const sortedXmlList = prioritySort(xmlList);

  const processingSuccessRate =
    metrics && metrics.total > 0
      ? ((metrics.procesados / metrics.total) * 100).toFixed(2)
      : "0.00";

  const alerts = [];
  if (metrics) {
    if (metrics.errores > 0) {
      alerts.push({
        title: `Error de Validación (${metrics.errores})`,
        desc: "Existen documentos con errores que requieren atención inmediata.",
        color: "var(--color-error)",
        bg: "rgba(158, 63, 78, 0.08)",
        icon: "pi-exclamation-circle",
        time: "ACTIVO",
      });
    }
    if (metrics.pendientes > 0) {
      alerts.push({
        title: "Homologación Pendiente",
        desc: `Hay ${metrics.pendientes} productos nuevos que necesitan ser mapeados.`,
        color: "var(--color-warning)",
        bg: "rgba(245, 158, 11, 0.08)",
        icon: "pi-sync",
        time: "PENDIENTE",
      });
    }
    if (metrics.procesadosHoy > 0) {
      alerts.push({
        title: "Procesamiento Exitoso",
        desc: `Se han procesado ${metrics.procesadosHoy} documentos el día de hoy.`,
        color: "var(--color-success)",
        bg: "rgba(22, 163, 74, 0.08)",
        icon: "pi-check-circle",
        time: "HOY",
      });
    }
  }

  const kpiCards = [
    {
      label: "COLA",
      title: "En Cola",
      value: metrics ? metrics.cargados + metrics.pendientes : 0,
      desc: metrics?.pendientes
        ? `${metrics.pendientes} pendientes de acción`
        : "Flujo normal",
      icon: "pi-clock",
      color: "warning",
    },
    {
      label: "VALIDACIÓN",
      title: "Listos",
      value: metrics?.listos || 0,
      desc: metrics?.listos
        ? "Listos para enviar a ERP"
        : "Sin documentos listos",
      icon: "pi-check-circle",
      color: "success",
    },
    {
      label: "PROCESAMIENTO",
      title: "Procesados Hoy",
      value: metrics?.procesadosHoy || 0,
      desc: metrics?.procesadosHoy
        ? "Procesamiento activo"
        : "Sin actividad hoy",
      icon: "pi-database",
      color: "primary",
    },
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <PageTitle title="Panel de Control" />
          <p className="dashboard-header-desc">
            Vista en tiempo real del estado de procesamiento y cola de
            integración ERP.
          </p>
        </div>
        <div className="dashboard-header-stats">
          {metrics && metrics.errores > 0 && (
            <Tag
              severity="danger"
              value={`${metrics.errores} Errores`}
              icon="pi pi-exclamation-triangle"
              className="error-badge-pulse"
            />
          )}
          {error && (
            <Tag
              severity="danger"
              value={error}
              style={{ marginLeft: "1rem" }}
              icon="pi pi-exclamation-circle"
            />
          )}
        </div>
        <p className="live-indicator">● Actualización automática cada 30s</p>
      </header>
      {alerts.length > 0 && (
        <div className="alerts-banner">
          {alerts.slice(0, 3).map((alert, idx) => (
            <div
              key={idx}
              className="alert-banner-item"
              style={{ borderLeft: `4px solid ${alert.color}` }}
            >
              <i
                className={`pi ${alert.icon}`}
                style={{ color: alert.color }}
              />
              <div>
                <strong>{alert.title}</strong>
                <p>{alert.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="summary-grid-compact">
        {kpiCards.map((kpi, idx) => (
          <Card key={idx} className={`summary-card border-${kpi.color}`}>
            <div className="summary-card-header">
              <div>
                <p className="summary-card-label">{kpi.label}</p>
                <h3 className="summary-card-title">{kpi.title}</h3>
              </div>
              <div
                className={`summary-card-icon-container bg-${kpi.color}-container text-${kpi.color}`}
              >
                <i className={`pi ${kpi.icon}`}></i>
              </div>
            </div>
            {loadingMetrics ? (
              <Skeleton width="4rem" height="2.5rem" />
            ) : (
              <div className="summary-card-value">{kpi.value}</div>
            )}
            <p className="summary-card-footer">Actualizado en tiempo real</p>
            <p className="summary-card-desc">{kpi.desc}</p>
          </Card>
        ))}
      </section>

      <div className="dashboard-main-grid-refactored">
        <section className="processing-section">
          <div className="section-header">
            <h3 className="queue-card-title">Cola de Procesamiento</h3>
            <Button
              label="Ver todo"
              icon="pi pi-external-link"
              text
              size="small"
            />
          </div>
          <div className="processing-list-container">
            {loadingFiles ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="processing-item-skeleton">
                  <Skeleton width="100%" height="4rem" borderRadius="8px" />
                </div>
              ))
            ) : sortedXmlList.length === 0 ? (
              <div className="empty-state">No hay documentos en cola</div>
            ) : (
              sortedXmlList.map((item, idx) => (
                <div key={idx} className="processing-card-compact">
                  <div className="item-main-info">
                    <span className="item-filename" title={item.fileName}>
                      {item.fileName}
                    </span>
                    <span className="item-provider">
                      {item.proveedor || "Proveedor Desconocido"}
                    </span>
                  </div>
                  <div className="item-status">{statusTag(item.estado)}</div>
                  <div className="item-dates">
                    <div className="date-group">
                      <span className="date-label">CARGA</span>
                      <span className="date-value">
                        {item.lastModified || "-"}
                      </span>
                    </div>
                    {item.fechaProceso && (
                      <div className="date-group">
                        <span className="date-label">PROCESO</span>
                        <span className="date-value">{item.fechaProceso}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="alerts-section">
          <div className="availability-card-refined">
            <h4 className="availability-label">
              Tasa de Procesamiento Exitoso
            </h4>
            {loadingMetrics ? (
              <Skeleton
                width="6rem"
                height="3rem"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              />
            ) : (
              <div className="availability-value">{processingSuccessRate}%</div>
            )}
            <p className="availability-desc">
              Porcentaje de integración histórica exitosa.
            </p>
            <div className="availability-bars">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`availability-bar ${i === 4 ? "active" : ""}`}
                ></div>
              ))}
            </div>
          </div>

          <div className="alerts-container-refined">
            <h4 className="alerts-card-title">Alertas Operativas</h4>
            <div className="alerts-list">
              {alerts.length === 0 ? (
                <div className="empty-alerts">Sin alertas operativas</div>
              ) : (
                alerts.slice(0, 3).map((alert, idx) => (
                  <div
                    key={idx}
                    className="alert-item-modern"
                    style={{
                      backgroundColor: alert.bg,
                      borderLeft: `4px solid ${alert.color}`,
                    }}
                  >
                    <i
                      className={`pi ${alert.icon} alert-icon`}
                      style={{ color: alert.color }}
                    ></i>
                    <div className="alert-content">
                      <p className="alert-title">{alert.title}</p>
                      <p className="alert-desc">{alert.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
