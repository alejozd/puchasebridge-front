import axiosClient from "../api/axiosClient";
import type {
  XMLFile,
  XmlDetalle,
  BackendValidationResponse,
  XMLFileItem,
  XMLFileDetail,
  XMLValidationResult,
  XMLProcesarResponse
} from "../types/xml";

export const getXMLList = async (): Promise<XMLFile[]> => {
  const response = await axiosClient.get<XMLFile[]>("/xml/list");
  return response.data;
};

export const uploadXML = async (file: File): Promise<unknown> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosClient.post("/xml/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const procesarDocumentos = async (files: string[]): Promise<XMLProcesarResponse> => {
  const response = await axiosClient.post<XMLProcesarResponse>("/documentos/procesar", {
    files,
  });
  return response.data;
};

export const parseXML = async (fileName: string): Promise<XmlDetalle> => {
  const response = await axiosClient.post<XmlDetalle>("/xml/parse", {
    fileName,
  });
  return response.data;
};

export const validateXMLFile = async (fileName: string): Promise<BackendValidationResponse> => {
  const response = await axiosClient.post<BackendValidationResponse>("/xml/validate", {
    fileName,
  });
  return response.data;
};

// New services for Procesamiento de XML
export const getXMLFiles = async (): Promise<XMLFileItem[]> => {
  const response = await axiosClient.get<XMLFileItem[]>("/xml/files");
  return response.data;
};

export const getXMLFileDetail = async (id: number): Promise<XMLFileDetail> => {
  const response = await axiosClient.get<XMLFileDetail>(`/xml/files/${id}`);
  return response.data;
};

export const validateXML = async (fileName: string): Promise<XMLValidationResult> => {
  const response = await axiosClient.post<XMLValidationResult>("/xml/validate", {
    fileName,
  });
  return response.data;
};

export const procesarXML = async (ids: number[]): Promise<XMLProcesarResponse> => {
  const response = await axiosClient.post<XMLProcesarResponse>("/xml/procesar", {
    ids,
  });
  return response.data;
};
