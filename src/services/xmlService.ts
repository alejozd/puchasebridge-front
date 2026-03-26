import axiosClient from "../api/axiosClient";
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
  DashboardMetrics
} from "../types/xml";

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  console.log('[API CALL]', { method: 'GET', url: '/dashboard/metrics' });
  const response = await axiosClient.get<DashboardMetrics>("/dashboard/metrics");
  return response.data;
};

export const getXMLList = async (): Promise<XMLFile[]> => {
  console.log('[API CALL]', { method: 'GET', url: '/xml/list' });
  const response = await axiosClient.get<XMLFile[]>("/xml/list");
  return response.data;
};

export const uploadXML = async (file: File): Promise<unknown> => {
  console.log('[API CALL]', { method: 'POST', url: '/xml/upload' });
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosClient.post("/xml/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getProductosDocumento = async (fileName: string): Promise<DocumentoProductosResponse> => {
  console.log('[API CALL]', { method: 'GET', url: '/xml/productos/documento', params: { fileName } });
  const response = await axiosClient.get<DocumentoProductosResponse>("/xml/productos/documento", {
    params: { fileName }
  });
  return response.data;
};

export const getProductosPendientes = async (fileName: string): Promise<ProductoPendiente[]> => {
  console.log('[API CALL]', { method: 'GET', url: '/xml/productos/pendientes', params: { fileName } });
  const response = await axiosClient.get<ProductoPendiente[]>("/xml/productos/pendientes", {
    params: { fileName }
  });
  return response.data;
};

export const homologarProducto = async (data: HomologarPayload): Promise<{ success: boolean; mensaje: string }> => {
  console.log('[API CALL]', { method: 'POST', url: '/xml/homologar', data });
  const response = await axiosClient.post<{ success: boolean; mensaje: string }>("/xml/homologar", data);
  return response.data;
};

export const procesarDocumentos = async (files: string[]): Promise<XMLProcesarResponse> => {
  console.log('[API CALL]', { method: 'POST', url: '/documentos/procesar', data: { files } });
  const response = await axiosClient.post<XMLProcesarResponse>("/documentos/procesar", {
    files,
  });
  return response.data;
};

export const parseXML = async (fileName: string): Promise<XmlDetalle> => {
  console.log('[API CALL]', { method: 'POST', url: '/xml/parse', data: { fileName } });
  const response = await axiosClient.post<XmlDetalle>("/xml/parse", {
    fileName,
  });
  return response.data;
};

export const validateXMLFile = async (fileName: string): Promise<BackendValidationResponse> => {
  console.log('[API CALL]', { method: 'POST', url: '/xml/validate', data: { fileName } });
  const response = await axiosClient.post<BackendValidationResponse>("/xml/validate", {
    fileName,
  });
  return response.data;
};

// New services for Procesamiento de XML
export const getXMLFiles = async (): Promise<XMLFileItem[]> => {
  console.log('[API CALL]', { method: 'GET', url: '/xml/files' });
  const response = await axiosClient.get<XMLFileItem[]>("/xml/files");
  return response.data;
};

export const getXMLFileDetail = async (id: number): Promise<XMLFileDetail> => {
  console.log('[API CALL]', { method: 'GET', url: `/xml/files/${id}` });
  const response = await axiosClient.get<XMLFileDetail>(`/xml/files/${id}`);
  return response.data;
};

export const validateXML = async (fileName: string): Promise<XMLValidationResult> => {
  console.log('[API CALL]', { method: 'POST', url: '/xml/validate', data: { fileName } });
  const response = await axiosClient.post<XMLValidationResult>("/xml/validate", {
    fileName,
  });
  return response.data;
};

export const procesarXML = async (ids: number[]): Promise<XMLProcesarResponse> => {
  console.log('[API CALL]', { method: 'POST', url: '/xml/procesar', data: { ids } });
  const response = await axiosClient.post<XMLProcesarResponse>("/xml/procesar", {
    ids,
  });
  return response.data;
};
