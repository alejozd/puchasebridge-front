import axiosClient from "../api/axiosClient";
import type { XMLFile, XmlDetalle, BackendValidationResponse } from "../types/xml";

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
