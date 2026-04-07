import { useAuthStore } from "../store/authStore";
import { useLicenciaStore } from "../store/licenciaStore";
import type { LicenciaEstado } from "../types/licencia";

// export const BASE_URL = "http://localhost:9000";
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9000";
// export const BASE_URL = "http://192.168.1.7:8080";

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

/**
 * Verifica si una licencia está bloqueada (expirada o sin días restantes)
 */
export const isLicenciaBloqueada = (licencia: LicenciaEstado | null): boolean => {
  if (!licencia) return false;
  // Bloqueado si el estado es 'bloqueado' o si no tiene días restantes
  return licencia.estado === 'bloqueado' || (licencia.dias_restantes !== null && licencia.dias_restantes <= 0);
};

/**
 * Verifica si una licencia está en modo demo con días restantes
 */
export const isLicenciaDemoConDias = (licencia: LicenciaEstado | null): boolean => {
  if (!licencia) return false;
  return licencia.estado === 'demo' && licencia.dias_restantes !== null && licencia.dias_restantes > 0;
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
    try {
      // Intentar obtener los detalles de la licencia desde la respuesta
      const data = await response.clone().json();
      const licenciaData: LicenciaEstado = {
        estado: data.estado || 'bloqueado',
        tipo_licencia: data.tipo_licencia || 'anual',
        dias_restantes: data.dias_restantes ?? 0,
        expira: data.expira || null,
        nit: data.nit || '',
        instalacion_hash: data.instalacion_hash || '',
      };
      
      // Guardar el estado de la licencia en el store
      useLicenciaStore.getState().setLicencia(licenciaData);

      // Verificar si está realmente bloqueada
      if (isLicenciaBloqueada(licenciaData)) {
        // Lanzar error específico para licencia bloqueada
        throw new Error("LICENCIA_BLOQUEADA");
      } else if (isLicenciaDemoConDias(licenciaData)) {
        // Licencia demo válida, retornar los datos para que el login continúe
        return data;
      }
    } catch {
      // Si no se puede parsear la respuesta, asumir bloqueo
      const licenciaBloqueada: LicenciaEstado = {
        estado: 'bloqueado',
        tipo_licencia: 'anual',
        dias_restantes: 0,
        expira: null,
        nit: '',
        instalacion_hash: '',
      };
      useLicenciaStore.getState().setLicencia(licenciaBloqueada);
      throw new Error("LICENCIA_BLOQUEADA");
    }
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
  log: (message: string, module?: string, data?: unknown) => void,
) => {
  if (error instanceof Error) {
    log(error.message);
    return;
  }

  log("Error desconocido", undefined, error);
};

/**
 * Verifica si un error es de tipo LICENCIA_BLOQUEADA
 * @param error - El error a verificar
 * @returns true si el error es de licencia bloqueada
 */
export const isLicenciaBloqueadaError = (error: unknown): boolean => {
  return error instanceof Error && error.message === "LICENCIA_BLOQUEADA";
};

/**
 * Obtiene el mensaje de error o aviso apropiado para mostrar al usuario según el estado de la licencia
 * @param error - El error capturado
 * @param licenciaData - Datos opcionales de la licencia para mostrar avisos demo
 * @returns El mensaje de error formateado o null si no hay mensaje que mostrar
 */
export const getLicenciaMessage = (error: unknown, licenciaData?: LicenciaEstado | null): { message: string; severity: 'error' | 'warn' } | null => {
  if (error instanceof Error) {
    if (error.message === "LICENCIA_BLOQUEADA") {
      return {
        message: "El sistema está bloqueado por licencia expirada. Por favor active una licencia.",
        severity: 'error'
      };
    }
  }
  
  // Si hay datos de licencia y es demo con días restantes, mostrar aviso
  if (licenciaData && isLicenciaDemoConDias(licenciaData)) {
    const dias = licenciaData.dias_restantes;
    return {
      message: `¡Atención! Su licencia expira en ${dias} día${dias === 1 ? '' : 's'}.`,
      severity: 'warn'
    };
  }
  
  return null;
};

/**
 * Obtiene el mensaje de error apropiado para mostrar al usuario
 * @param error - El error capturado
 * @returns El mensaje de error formateado
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message === "LICENCIA_BLOQUEADA") {
      return "El sistema está bloqueado por licencia expirada. Por favor active una licencia.";
    }
    return error.message;
  }
  return "Ocurrió un error inesperado";
};
