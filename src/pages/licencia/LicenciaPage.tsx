// src/pages/LicenciaPage.tsx (Actualizado)

import React, { useEffect, useState, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Divider } from "primereact/divider"; // Nuevo import
import { useLocation } from "react-router-dom";
import {
  getLicenciaEstado,
  activarOnline,
} from "../../services/licenciaService";
import { useLicenciaStore } from "../../store/licenciaStore";
import type { LicenciaEstado } from "../../types/licencia";
import "../../styles/LicenciaPage.css";

const LicenciaPage: React.FC = () => {
  const [estado, setEstado] = useState<LicenciaEstado | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [onlineLoading, setOnlineLoading] = useState<boolean>(false);
  const toast = useRef<Toast>(null);
  const location = useLocation();

  // Clave para almacenar el mensaje de bloqueo en sessionStorage
  const LICENCIA_BLOQUEO_KEY = "licencia_bloqueo_mensaje";

  // Obtener mensaje de redirección desde el estado de navegación o desde sessionStorage
  const getMensajeBloqueo = (): string | undefined => {
    // Primero intentar obtener del estado de navegación
    const mensajeFromState = location.state?.mensaje as string | undefined;

    // Si viene del estado de navegación, guardarlo en sessionStorage para persistencia
    if (mensajeFromState) {
      sessionStorage.setItem(LICENCIA_BLOQUEO_KEY, mensajeFromState);
      return mensajeFromState;
    }

    // Si no viene del estado, intentar obtener de sessionStorage (para recargas)
    return sessionStorage.getItem(LICENCIA_BLOQUEO_KEY) || undefined;
  };

  const mensajeBloqueo = getMensajeBloqueo();

  // Store de licencia
  const licenciaStore = useLicenciaStore();
  const existeEnServidor = useLicenciaStore((state) => state.existeEnServidor);

  const crearLicenciaDemo = (): LicenciaEstado => {
    console.log("[LICENCIA] Creando nueva licencia demo");
    return {
      estado: "demo",
      tipo_licencia: "demo",
      dias_restantes: 15, // Cambiado a 15 para simular tu captura
      expira: "2026-04-20T12:00:00Z", // Cambiado para simular tu captura
      nit: "",
      instalacion_hash: `DEMO-${Date.now()}`,
    };
  };

  const fetchEstado = async () => {
    setLoading(true);
    try {
      console.log("[LICENCIA] Intentando validación online obligatoria...");
      const data = await getLicenciaEstado();

      if (data === null) {
        // No existe licencia en servidor
        console.log("[LICENCIA] No existe licencia en servidor");
        console.log("[LICENCIA] Limpiando datos locales");
        licenciaStore.clearLicencia();

        console.log("[LICENCIA] Creando nueva licencia demo");
        const demoLicencia = crearLicenciaDemo();
        setEstado(demoLicencia);
        licenciaStore.setLicencia(demoLicencia);
        licenciaStore.setExisteEnServidor(false);
      } else {
        // Licencia válida obtenida del servidor
        console.log("[LICENCIA] Usando licencia del servidor");
        setEstado(data);
        licenciaStore.setLicencia(data);
        licenciaStore.setExisteEnServidor(true);
      }
    } catch (error: unknown) {
      console.error("[LICENCIA] Error en validación online:", error);

      // Solo permitir validación offline si ya existe licencia previamente sincronizada
      if (existeEnServidor === true && licenciaStore.licencia) {
        console.log("[LICENCIA] Usando licencia local (offline)");
        setEstado(licenciaStore.licencia);
      } else {
        console.log("[LICENCIA] No hay licencia local válida, creando demo");
        const demoLicencia = crearLicenciaDemo();
        setEstado(demoLicencia);
        licenciaStore.setLicencia(demoLicencia);
      }

      toast.current?.show({
        severity: "warn",
        summary: "Sin conexión",
        detail: "No se pudo conectar con el servidor. Usando modo offline.",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstado();
  }, []);

  // Limpiar el mensaje de bloqueo cuando la licencia se active exitosamente
  useEffect(() => {
    if (estado && estado.estado === "activa" && mensajeBloqueo) {
      sessionStorage.removeItem(LICENCIA_BLOQUEO_KEY);
    }
  }, [estado, mensajeBloqueo]);

  const handleActivarOnline = async () => {
    setOnlineLoading(true);
    try {
      const response = await activarOnline();
      if (response.success) {
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail:
            response.mensaje || "Licencia activada en línea correctamente",
          life: 3000,
        });
        await fetchEstado();
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: response.mensaje || "No se pudo activar la licencia en línea",
          life: 3000,
        });
      }
    } catch (error: unknown) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error instanceof Error ? error.message : "Error al activar en línea",
        life: 3000,
      });
    } finally {
      setOnlineLoading(false);
    }
  };

  const getEstadoSeverity = (estado?: string) => {
    switch (estado) {
      case "activa":
        return "success";
      case "demo":
        return "warning";
      case "bloqueado":
        return "danger";
      default:
        return "info";
    }
  };

  const formatExpiracion = (expira: string | undefined) => {
    if (!expira) return "Sin fecha de expiración";
    const fecha = new Date(expira);
    if (isNaN(fecha.getTime())) return "Sin fecha de expiración";
    // Detectar fechas inválidas de Delphi (ej: 1899-12-30)
    if (fecha.getFullYear() < 2000) return "Sin fecha de expiración";
    // Formato para mostrar: DD/MM/YYYY
    return fecha.toLocaleDateString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.current?.show({
          severity: "success",
          summary: "Copiado",
          detail: "ID de instalación copiado",
          life: 2000,
        });
      })
      .catch(() => {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo copiar el ID",
          life: 2000,
        });
      });
  };

  if (loading && !estado) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ height: "80vh" }}
      >
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="licencia-container anim-fadein">
      <Toast ref={toast} />

      {/* Encabezado: Título azul, grande y negrita (estilizado en CSS) */}
      <div className="licencia-header">
        <h2>Gestión de Licencia</h2>
        <p>Información detallada sobre el estado de tu suscripción.</p>
      </div>

      <div className="flex justify-content-center">
        <div className="col-12 md:col-10 lg:col-7">
          <Card className="licencia-card shadow-4">
            {estado && (
              <div className="flex flex-column gap-2">
                {/* SECCIÓN 1: ESTADO PRINCIPAL */}
                <div className="licencia-data-row">
                  <div className="licencia-label">
                    <i className="pi pi-verified text-xl"></i>
                    <span>Estado del Sistema</span>
                  </div>
                  <div className="licencia-value estado-tag">
                    <Tag
                      value={(estado.estado || "demo").toUpperCase()}
                      severity={getEstadoSeverity(estado.estado)}
                    />
                  </div>
                </div>

                <Divider />

                {/* SECCIÓN 2: DETALLES DE SUSCRIPCIÓN */}
                <div className="licencia-data-row">
                  <div className="licencia-label">
                    <i className="pi pi-id-card text-xl"></i>
                    <span>Tipo de Licencia</span>
                  </div>
                  <div className="licencia-value">
                    <Tag
                      value={(estado.tipo_licencia || "demo").toUpperCase()}
                      severity="info"
                    />
                  </div>
                </div>

                <div className="licencia-data-row">
                  <div className="licencia-label">
                    <i className="pi pi-calendar-clock text-xl"></i>
                    <span>Días restantes</span>
                  </div>
                  <div className="licencia-value">
                    {estado.dias_restantes !== null ? (
                      <span
                        className={`dias-restantes-value ${
                          estado.dias_restantes <= 5
                            ? "dias-critico"
                            : "dias-normal"
                        }`}
                      >
                        {estado.dias_restantes} días
                      </span>
                    ) : (
                      <Tag value="LICENCIA PERMANENTE" severity="success" />
                    )}
                  </div>
                </div>

                {estado.dias_restantes !== null && (
                  <div className="licencia-data-row">
                    <div className="licencia-label">
                      <i className="pi pi-calendar-times text-xl"></i>
                      <span>Fecha de expiración</span>
                    </div>
                    <div className="licencia-value">
                      <span className="font-bold">
                        {formatExpiracion(estado.expira ?? undefined)}
                      </span>
                    </div>
                  </div>
                )}

                <Divider className="mt-4" />

                {/* SECCIÓN 3: INFORMACIÓN TÉCNICA */}
                <div className="flex flex-column gap-2 mt-2">
                  <div className="licencia-label">
                    <i className="pi pi-key text-xl"></i>
                    <span>ID de Instalación</span>
                  </div>
                  <div className="id-instalacion-container shadow-1">
                    <div className="id-text-wrapper">
                      <span className="font-monospace">
                        {estado.instalacion_hash}
                      </span>
                    </div>
                    <Button
                      icon="pi pi-copy"
                      className="p-button-rounded p-button-secondary p-button-text p-button-sm"
                      onClick={() => copyToClipboard(estado.instalacion_hash)}
                      tooltip="Copiar ID"
                    />
                  </div>
                </div>

                {/* SECCIÓN 4: MENSAJES DE ALERTA */}
                <div className="alerta-mensaje mt-4">
                  {(() => {
                    const estadoLicencia = estado.estado || "demo";
                    const diasRestantes = estado.dias_restantes;
                    const tipoLicencia = estado.tipo_licencia || "demo";

                    if (
                      estadoLicencia === "bloqueado" ||
                      (diasRestantes !== null && diasRestantes <= 0)
                    ) {
                      return (
                        <Message
                          severity="error"
                          text="El sistema está bloqueado por licencia expirada."
                          className="w-full justify-content-start font-bold"
                        />
                      );
                    }

                    if (tipoLicencia === "demo" && diasRestantes !== null) {
                      return (
                        <Message
                          severity={diasRestantes <= 5 ? "error" : "warn"}
                          text={`¡Atención! Su licencia de prueba expira en ${diasRestantes} días.`}
                          className="w-full justify-content-start font-bold"
                        />
                      );
                    }

                    if (estadoLicencia === "activa") {
                      return (
                        <Message
                          severity="success"
                          text="Su licencia está activa y funcionando correctamente."
                          className="w-full justify-content-start"
                        />
                      );
                    }

                    return null;
                  })()}
                </div>

                {/* BOTÓN DE ACTIVACIÓN */}
                {((estado.estado || "demo") === "demo" ||
                  (estado.estado || "demo") === "bloqueado") && (
                  <div className="activar-btn mt-3">
                    <Button
                      label="Activar Licencia Online"
                      icon="pi pi-globe"
                      onClick={handleActivarOnline}
                      loading={onlineLoading}
                      className="p-button-primary w-full shadow-2 font-bold"
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LicenciaPage;
