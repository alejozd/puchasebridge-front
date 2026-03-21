import { create } from "zustand";
import type { XMLFile, ValidationResult, BackendValidationResponse } from "../types/xml";
import { getXMLList, uploadXML, validateXMLFile } from "../services/xmlService";

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
      // Mapping function to convert backend response to internal ValidationResult
      const mapBackendToResult = (res: BackendValidationResponse): ValidationResult => {
        let estado: 'Validado' | 'Con errores' | 'Requiere homologación' = 'Validado';

        if (!res.valido) {
          estado = 'Con errores';
        } else if (res.requiereHomologacion) {
          estado = 'Requiere homologación';
        }

        return {
          fileName: res.fileName,
          estado,
          resultadoValidacion: res.valido ? (res.requiereHomologacion ? 'Requiere homologación de productos' : 'Documento válido') : 'Errores en validación',
          errores: res.errores,
          advertencias: [] // Backend doesn't seem to differentiate warnings in the example, putting all in errores
        };
      };

      // Perform individual validation calls in parallel
      const backendResults = await Promise.all(
        fileNames.map(name => validateXMLFile(name))
      );

      const results = backendResults.map(mapBackendToResult);

      // Update the local list with validation results
      const currentList = get().xmlList;
      const updatedList = currentList.map(file => {
        const result = results.find(r => r.fileName === file.fileName);
        if (result) {
          return {
            ...file,
            estado: result.estado,
            resultadoValidacion: result.resultadoValidacion,
            erroresValidacion: result.errores,
            advertenciasValidacion: result.advertencias
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
