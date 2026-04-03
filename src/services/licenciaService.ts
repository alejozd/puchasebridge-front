import { BASE_URL, getHeaders, handleResponse } from "../utils/apiHandler";
import type { LicenciaEstado, RegistrarLicenciaPayload, RegistrarLicenciaResponse } from "../types/licencia";
import { logger } from "../utils/logger";

export const getLicenciaEstado = async (): Promise<LicenciaEstado> => {
  logger.log("[API CALL]", { method: "GET", url: "/licencia/estado" });
  const response = await fetch(`${BASE_URL}/licencia/estado`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const activarOnline = async (): Promise<RegistrarLicenciaResponse> => {
  logger.log("[API CALL]", { method: "POST", url: "/licencia/activar-online" });
  const response = await fetch(`${BASE_URL}/licencia/activar-online`, {
    method: "POST",
    headers: getHeaders(),
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
