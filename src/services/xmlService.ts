import axiosClient from "../api/axiosClient";
import type { XMLFile, ValidationResult } from "../types/xml";

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

export const validateXMLFiles = async (fileNames: string[]): Promise<ValidationResult[]> => {
  const response = await axiosClient.post<ValidationResult[]>("/xml/validate", {
    files: fileNames,
  });
  return response.data;
};
