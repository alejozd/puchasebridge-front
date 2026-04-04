import { useAuthStore } from "../store/authStore";
import { useLicenciaStore } from "../store/licenciaStore";
import type { LicenciaEstado } from "../types/licencia";

export const BASE_URL = "http://localhost:9000";

export const getHeaders = (includeContentType = true) => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem("token");
    if (window.location.pathname !== "/login") {
      useAuthStore.getState().setSessionExpired(true);
    }
    throw new Error("Sesión expirada");
  }

  // Detectar bloqueo por licencia (HTTP 403)
  if (response.status === 403) {
    // Marcar sistema como bloqueado en el store global
    const licenciaBloqueada: LicenciaEstado = {
      estado: 'bloqueado',
      tipo_licencia: 'anual',
      dias_restantes: 0,
      expira: null,
      nit: '',
      instalacion_hash: '',
    };
    useLicenciaStore.getState().setLicencia(licenciaBloqueada);
    
    // Guardar mensaje de bloqueo en sessionStorage para persistencia entre recargas
    const mensajeBloqueo = "El sistema está bloqueado por licencia expirada. Por favor active una licencia.";
    sessionStorage.setItem('licencia_bloqueo_mensaje', mensajeBloqueo);

    // Lanzar error específico que puede ser capturado por el frontend
    // La redirección se maneja en el componente que llama
    throw new Error("LICENCIA_EXPIRADA");
  }

  if (!response.ok) {
    let errorMessage = "Error en la petición";

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.mensaje || errorMessage;
    } catch {
      // respuesta no es JSON
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

export const logUnknownError = (
  error: unknown,
  log: (message?: unknown, ...optionalParams: unknown[]) => void,
) => {
  if (error instanceof Error) {
    log(error.message);
    return;
  }

  log("Error desconocido", error);
};

/**
 * Verifica si un error es de tipo LICENCIA_EXPIRADA
 * @param error - El error a verificar
 * @returns true si el error es de licencia expirada
 */
export const isLicenciaExpiradaError = (error: unknown): boolean => {
  return error instanceof Error && error.message === "LICENCIA_EXPIRADA";
};

/**
 * Obtiene el mensaje de error apropiado para mostrar al usuario
 * @param error - El error capturado
 * @returns El mensaje de error formateado
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message === "LICENCIA_EXPIRADA") {
      return "El sistema está bloqueado por licencia expirada. Por favor active una licencia.";
    }
    return error.message;
  }
  return "Ocurrió un error inesperado";
};
