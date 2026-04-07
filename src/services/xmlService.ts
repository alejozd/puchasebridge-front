import { handleResponse, BASE_URL, getHeaders } from "../utils/apiHandler";
import { logApiCall } from "@/utils/logger";
import type {
  XMLFile,
  XmlDetalle,
  BackendValidationResponse,
  XMLFileItem,
  XMLFileDetail,
  XMLValidationResult,
  XMLProcesarResponse,
  ProductoPendiente,
  HomologarPayload,
  DocumentoProductosResponse,
  DashboardMetrics,
} from "../types/xml";

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  logApiCall("GET", "/dashboard/metrics");
  const response = await fetch(`${BASE_URL}/dashboard/metrics`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getXMLList = async (): Promise<XMLFile[]> => {
  logApiCall("GET", "/xml/list");
  const response = await fetch(`${BASE_URL}/xml/list`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const uploadXML = async (file: File): Promise<unknown> => {
  logApiCall("POST", "/xml/upload");
  const formData = new FormData();
  formData.append("file", file);

  const headers = getHeaders();
  delete headers["Content-Type"]; // Fetch sets boundary for FormData automatically

  const response = await fetch(`${BASE_URL}/xml/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  return handleResponse(response);
};

export const getProductosDocumento = async (
  fileName: string,
): Promise<DocumentoProductosResponse> => {
  logApiCall("GET", "/xml/productos/documento", { params: { fileName } });
  const response = await fetch(
    `${BASE_URL}/xml/productos/documento?fileName=${encodeURIComponent(fileName)}`,
    {
      headers: getHeaders(),
    },
  );
  return handleResponse(response);
};

export const getProductosPendientes = async (
  fileName: string,
): Promise<ProductoPendiente[]> => {
  logApiCall("GET", "/xml/productos/pendientes", { params: { fileName } });
  const response = await fetch(
    `${BASE_URL}/xml/productos/pendientes?fileName=${encodeURIComponent(fileName)}`,
    {
      headers: getHeaders(),
    },
  );
  return handleResponse(response);
};

export const homologarProducto = async (
  data: HomologarPayload,
): Promise<{ success: boolean; mensaje: string }> => {
  logApiCall("POST", "/xml/homologar", data);
  const response = await fetch(`${BASE_URL}/xml/homologar`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const procesarDocumentos = async (
  files: string[],
): Promise<XMLProcesarResponse> => {
  logApiCall("POST", "/documentos/procesar", { files });
  const response = await fetch(`${BASE_URL}/documentos/procesar`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ files }),
  });
  return handleResponse(response);
};

export const procesarArchivo = async (
  fileName: string,
): Promise<XMLProcesarResponse> => {
  return procesarDocumentos([fileName]);
};

export const parseXML = async (fileName: string): Promise<XmlDetalle> => {
  logApiCall("POST", "/xml/parse", { fileName });
  const response = await fetch(`${BASE_URL}/xml/parse`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ fileName }),
  });
  return handleResponse(response);
};

export const validateXMLFile = async (
  fileName: string,
): Promise<BackendValidationResponse> => {
  logApiCall("POST", "/xml/validate", { fileName });
  const response = await fetch(`${BASE_URL}/xml/validate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ fileName }),
  });
  return handleResponse(response);
};

// New services for Procesamiento de XML
export const getXMLFiles = async (): Promise<XMLFileItem[]> => {
  logApiCall("GET", "/xml/files");
  const response = await fetch(`${BASE_URL}/xml/files`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getXMLFileDetail = async (id: number): Promise<XMLFileDetail> => {
  logApiCall("GET", `/xml/files/${id}`);
  const response = await fetch(`${BASE_URL}/xml/files/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const validateXML = async (
  fileName: string,
): Promise<XMLValidationResult> => {
  logApiCall("POST", "/xml/validate", { fileName });
  const response = await fetch(`${BASE_URL}/xml/validate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ fileName }),
  });
  return handleResponse(response);
};

export const procesarXML = async (
  files: string[],
): Promise<XMLProcesarResponse> => {
  logApiCall("POST", "/documentos/procesar", { files });
  const response = await fetch(`${BASE_URL}/documentos/procesar`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ files }),
  });
  return handleResponse(response);
};
