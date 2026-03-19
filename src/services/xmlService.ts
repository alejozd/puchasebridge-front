import axiosClient from "../api/axiosClient";
import type { XMLFile } from "../types/xml";

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
