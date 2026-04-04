import { BASE_URL, getHeaders, handleResponse } from "../utils/apiHandler";
import type { LicenciaEstado, RegistrarLicenciaPayload, RegistrarLicenciaResponse } from "../types/licencia";
import { logger } from "../utils/logger";

export const getLicenciaEstado = async (): Promise<LicenciaEstado | null> => {
  logger.log("[API CALL]", { method: "GET", url: "/licencia/estado" });
  try {
    const response = await fetch(`${BASE_URL}/licencia/estado`, {
      headers: getHeaders(),
    });
    
    // Si el backend responde con 404 o indica que no existe licencia
    if (!response.ok) {
      if (response.status === 404) {
        logger.log("[LICENCIA] No existe licencia en servidor");
        return null;
      }
    }
    
    const data = await handleResponse(response);
    logger.log("[LICENCIA] Estado obtenido del servidor:", data);
    return data;
  } catch (error) {
    logger.error("[LICENCIA] Error al obtener estado:", error);
    throw error;
  }
};

export const activarOnline = async (): Promise<RegistrarLicenciaResponse> => {
  logger.log("[API CALL]", { method: "POST", url: "/licencia/activar-online" });
  const response = await fetch(`${BASE_URL}/licencia/activar-online`, {
    method: "POST",
    headers: getHeaders(false),
  });
  return handleResponse(response);
};

export const registrarLicencia = async (payload: RegistrarLicenciaPayload): Promise<RegistrarLicenciaResponse> => {
  logger.log("[API CALL]", { method: "POST", url: "/licencia/registrar", data: payload });
  const response = await fetch(`${BASE_URL}/licencia/registrar`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};
