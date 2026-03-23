import { create } from "zustand";
import type { XMLFile, ValidationResult, BackendValidationResponse, XMLProcesarResponse } from "../types/xml";
import { getXMLFiles, uploadXML, validateXMLFile, procesarDocumentos } from "../services/xmlService";
import { fixEncoding } from "../utils/textUtils";

interface XMLState {
  xmlList: XMLFile[];
  loading: boolean;
  validating: boolean;
  processing: boolean;
  fetchXMLList: () => Promise<void>;
  uploadXML: (file: File) => Promise<void>;
  validateFiles: (fileNames: string[]) => Promise<void>;
  processFiles: (fileNames: string[]) => Promise<XMLProcesarResponse>;
}

export const useXMLStore = create<XMLState>((set, get) => ({
  xmlList: [],
  loading: false,
  validating: false,
  processing: false,

  fetchXMLList: async () => {
    console.log('[STORE] fetchXMLList ejecutado');
    set({ loading: true });
    try {
      const data = await getXMLFiles();
      console.log('[STORE] response XMLList:', data);
      // Ensure default state is set if missing
      const processedData: XMLFile[] = data.map(item => ({
        fileName: item.fileName,
        proveedor: item.proveedor,
        estado: item.estado as XMLFile['estado'],
        lastModified: item.fechaCarga,
        size: 0, // temporal
        tipoDocumento: 'Factura'
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
      const data = await getXMLFiles();
      const processedData: XMLFile[] = data.map(item => ({
        fileName: item.fileName,
        proveedor: item.proveedor,
        estado: item.estado as XMLFile['estado'],
        lastModified: item.fechaCarga,
        size: 0, // temporal
        tipoDocumento: 'Factura'
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

        const errores = Array.isArray(res.errores) ? res.errores.map(fixEncoding) : [];

        return {
          fileName: res.fileName,
          estado,
          resultadoValidacion: fixEncoding(res.valido ? (res.requiereHomologacion ? 'Requiere homologación de productos' : 'Documento válido') : 'Errores en validación'),
          errores,
          advertencias: [] // Backend doesn't seem to differentiate warnings in the example, putting all in errores
        };
      };

      // Perform individual validation calls in parallel
      const backendResults = await Promise.all(
        fileNames.map(async (name) => {
          try {
            return await validateXMLFile(name);
          } catch (error: unknown) {
            // Fallback for failed validation request
            let errorMsg = "Ocurrió un error al validar el XML";

            if (error && typeof error === 'object' && 'response' in error) {
               const axiosError = error as { response?: { data?: { errores?: string[] } } };
               if (axiosError.response?.data?.errores?.[0]) {
                 errorMsg = axiosError.response.data.errores[0];
               }
            }

            return {
              fileName: name,
              valido: false,
              requiereHomologacion: false,
              proveedorExiste: false,
              productos: [],
              errores: [errorMsg],
              codigoTercero: ""
            } as BackendValidationResponse;
          }
        })
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

  processFiles: async (fileNames: string[]) => {
    set({ processing: true });
    try {
      const response = await procesarDocumentos(fileNames);

      if (response.success) {
        // Update local status if needed, or just refresh list
        const currentList = get().xmlList;
        const updatedList = currentList.map(file => {
          if (fileNames.includes(file.fileName)) {
            return { ...file, estado: 'Procesado' as const };
          }
          return file;
        });
        set({ xmlList: updatedList, processing: false });
      } else {
        set({ processing: false });
      }
      return response;
    } catch (error) {
      console.error("Error processing XML files:", error);
      set({ processing: false });
      throw error;
    }
  },
}));
