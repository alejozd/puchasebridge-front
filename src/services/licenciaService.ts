import { BASE_URL, getHeaders, handleResponse } from "../utils/apiHandler";
import type { LicenciaEstado, RegistrarLicenciaPayload, RegistrarLicenciaResponse } from "../types/licencia";
import { logApiCall, debugLog, errorLog } from "@/utils/logger";

export const getLicenciaEstado = async (): Promise<LicenciaEstado | null> => {
  logApiCall("GET", "/licencia/estado");
  try {
    const response = await fetch(`${BASE_URL}/licencia/estado`, {
      headers: getHeaders(),
    });
    
    // Si el backend responde con 404 o indica que no existe licencia
    if (!response.ok) {
      if (response.status === 404) {
        debugLog("No existe licencia en servidor", "LICENCIA");
        return null;
      }
    }
    
    const data = await handleResponse(response);
    debugLog("Estado obtenido del servidor", "LICENCIA", data);
    return data;
  } catch (error) {
    errorLog("Error al obtener estado", "LICENCIA", error);
    throw error;
  }
};

export const activarOnline = async (): Promise<RegistrarLicenciaResponse> => {
  logApiCall("POST", "/licencia/activar-online");
  const response = await fetch(`${BASE_URL}/licencia/activar-online`, {
    method: "POST",
    headers: getHeaders(false),
  });
  return handleResponse(response);
};

export const registrarLicencia = async (payload: RegistrarLicenciaPayload): Promise<RegistrarLicenciaResponse> => {
  logApiCall("POST", "/licencia/registrar", payload);
  const response = await fetch(`${BASE_URL}/licencia/registrar`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};
