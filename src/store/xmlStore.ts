import { create } from "zustand";
import type { XMLFile } from "../types/xml";
import { getXMLList, uploadXML, validateXMLFiles } from "../services/xmlService";

interface XMLState {
  xmlList: XMLFile[];
  loading: boolean;
  validating: boolean;
  fetchXMLList: () => Promise<void>;
  uploadXML: (file: File) => Promise<void>;
  validateFiles: (fileNames: string[]) => Promise<void>;
}

export const useXMLStore = create<XMLState>((set, get) => ({
  xmlList: [],
  loading: false,
  validating: false,

  fetchXMLList: async () => {
    set({ loading: true });
    try {
      const data = await getXMLList();
      // Ensure default state is set if missing
      const processedData = data.map(file => ({
        ...file,
        estado: file.estado || 'Pendiente'
      }));
      set({ xmlList: processedData, loading: false });
    } catch (error) {
      console.error("Error fetching XML list:", error);
      set({ loading: false });
      throw error;
    }
  },

  uploadXML: async (file: File) => {
    set({ loading: true });
    try {
      await uploadXML(file);
      // Refresh the list after successful upload
      const data = await getXMLList();
      const processedData = data.map(f => ({
        ...f,
        estado: f.estado || 'Pendiente'
      }));
      set({ xmlList: processedData, loading: false });
    } catch (error) {
      console.error("Error uploading XML:", error);
      set({ loading: false });
      throw error;
    }
  },

  validateFiles: async (fileNames: string[]) => {
    set({ validating: true });
    try {
      const results = await validateXMLFiles(fileNames);

      // Update the local list with validation results
      const currentList = get().xmlList;
      const updatedList = currentList.map(file => {
        const result = results.find(r => r.fileName === file.fileName);
        if (result) {
          return {
            ...file,
            estado: result.estado,
            resultadoValidacion: result.resultadoValidacion,
            erroresValidacion: result.errores
          };
        }
        return file;
      });

      set({ xmlList: updatedList, validating: false });
    } catch (error) {
      console.error("Error validating XML files:", error);
      set({ validating: false });
      throw error;
    }
  },
}));
