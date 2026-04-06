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

      <div className="licencia-header">
        <h2>Gestión de Licencia</h2>
        <p>Información detallada sobre el estado de tu suscripción.</p>
      </div>

      <div className="flex justify-content-center">
        <div className="col-12 xl:col-11">
          <Card className="licencia-card shadow-4">
            {estado && (
              <div className="grid">
                {/* COLUMNA IZQUIERDA: Datos de la licencia */}
                <div className="col-12 lg:col-7 p-4">
                  <div className="flex flex-column gap-2">
                    <div className="licencia-data-row">
                      <div className="licencia-label">
                        <i className="pi pi-verified text-xl"></i>
                        <span>Estado del Sistema</span>
                      </div>
                      <Tag
                        value={(estado.estado || "demo").toUpperCase()}
                        severity={getEstadoSeverity(estado.estado)}
                      />
                    </div>

                    <Divider />

                    <div className="licencia-data-row">
                      <div className="licencia-label">
                        <i className="pi pi-id-card text-xl"></i>
                        <span>Tipo de Licencia</span>
                      </div>
                      <Tag
                        value={(estado.tipo_licencia || "demo").toUpperCase()}
                        severity="info"
                      />
                    </div>

                    <div className="licencia-data-row">
                      <div className="licencia-label">
                        <i className="pi pi-calendar-clock text-xl"></i>
                        <span>Días restantes</span>
                      </div>
                      {/* Corrección: Validamos que no sea null antes de comparar */}
                      <span
                        className={`dias-restantes-value font-bold ${
                          estado.dias_restantes !== null &&
                          estado.dias_restantes <= 5
                            ? "text-red-500"
                            : "text-blue-500"
                        }`}
                      >
                        {estado.dias_restantes !== null
                          ? `${estado.dias_restantes} días`
                          : "PERMANENTE"}
                      </span>
                    </div>

                    <div className="licencia-data-row">
                      <div className="licencia-label">
                        <i className="pi pi-calendar-times text-xl"></i>
                        <span>Fecha de expiración</span>
                      </div>
                      <span className="font-bold">
                        {formatExpiracion(estado.expira ?? undefined)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: ID de Instalación y Acciones */}
                <div className="col-12 lg:col-5 p-4 bg-gray-50 border-round-right-lg">
                  <div className="flex flex-column gap-4">
                    <div>
                      <label className="licencia-label mb-2">
                        <i className="pi pi-key text-xl"></i>
                        <span>ID de Instalación</span>
                      </label>
                      <div className="id-instalacion-container shadow-1 mt-2">
                        <span className="font-monospace mr-2">
                          {estado.instalacion_hash}
                        </span>
                        <Button
                          icon="pi pi-copy"
                          className="p-button-rounded p-button-secondary p-button-text"
                          onClick={() =>
                            copyToClipboard(estado.instalacion_hash)
                          }
                        />
                      </div>
                    </div>

                    <div className="alerta-mensaje">
                      {/* Corrección: Manejo seguro de mensajes con nulidad */}
                      {estado.estado === "activa" ? (
                        <Message
                          severity="success"
                          text="Suscripción Activa"
                          className="w-full"
                        />
                      ) : (
                        <Message
                          severity={
                            estado.dias_restantes !== null &&
                            estado.dias_restantes <= 5
                              ? "error"
                              : "warn"
                          }
                          text={
                            estado.dias_restantes !== null
                              ? `Expira en ${estado.dias_restantes} días`
                              : "Verifique su suscripción"
                          }
                          className="w-full"
                        />
                      )}
                    </div>

                    {(estado.estado || "demo") !== "activa" && (
                      <Button
                        label="Activar Licencia Online"
                        icon="pi pi-globe"
                        onClick={handleActivarOnline}
                        loading={onlineLoading}
                        className="p-button-primary w-full p-3 font-bold shadow-2"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LicenciaPage;
