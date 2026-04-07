import { create } from "zustand";
import type {
  XMLFile,
  ValidationResult,
  BackendValidationResponse,
  XMLProcesarResponse,
} from "../types/xml";
import {
  getXMLFiles,
  uploadXML,
  validateXMLFile,
  procesarDocumentos,
} from "../services/xmlService";
import { fixEncoding } from "../utils/textUtils";
import { logStore } from "@/utils/logger";
import { logUnknownError } from "../utils/apiHandler";

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
    logStore("fetchXMLList ejecutado");
    set({ loading: true });
    try {
      const data = await getXMLFiles();
      logStore("response XMLList", data);
      // Ensure default state is set if missing
      const processedData: XMLFile[] = data.map((item) => ({
        fileName: item.fileName,
        proveedor: item.proveedor,
        estado: item.estado as XMLFile["estado"],
        lastModified: item.fechaCarga,
        fechaProceso: item.fecha_proceso,
        size: item.size,
        tipoDocumento: "Factura",
      }));
      logStore("MAPPED SIZE", processedData);
      set({ xmlList: processedData, loading: false });
    } catch (error: unknown) {
      logUnknownError(error, console.error);
      set({ loading: false });
      throw error;
    }
  },

  uploadXML: async (file: File) => {
    set({ loading: true });
    try {
      await uploadXML(file);
      // Refresh the list after successful upload
      await get().fetchXMLList();
      set({ loading: false });
    } catch (error: unknown) {
      logUnknownError(error, console.error);
      set({ loading: false });
      throw error;
    }
  },

  validateFiles: async (fileNames: string[]) => {
    set({ validating: true });
    try {
      // Mapping function to convert backend response to internal ValidationResult
      const mapBackendToResult = (
        res: BackendValidationResponse,
      ): ValidationResult => {
        let estado: "LISTO" | "ERROR" | "PENDIENTE" = "LISTO";

        if (!res.valido) {
          estado = "ERROR";
        } else if (res.requiereHomologacion) {
          estado = "PENDIENTE";
        }

        const errores = Array.isArray(res.errores)
          ? res.errores.map(fixEncoding)
          : [];

        return {
          fileName: res.fileName,
          estado,
          errores,
          advertencias: [], // Backend doesn't seem to differentiate warnings in the example, putting all in errores
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

            if (error instanceof Error) {
              errorMsg = error.message;
            }

            return {
              fileName: name,
              valido: false,
              requiereHomologacion: false,
              proveedorExiste: false,
              productos: [],
              errores: [errorMsg],
              codigoTercero: "",
            } as BackendValidationResponse;
          }
        }),
      );

      const results = backendResults.map(mapBackendToResult);

      // Refresh the list from backend to get updated metadata (like proveedor)
      await get().fetchXMLList();

      // Update the local list with validation results
      const currentList = get().xmlList;
      const updatedList = currentList.map((file) => {
        const result = results.find((r) => r.fileName === file.fileName);
        if (result) {
          return {
            ...file,
            estado: result.estado,
            erroresValidacion: result.errores,
            advertenciasValidacion: result.advertencias,
          };
        }
        return file;
      });

      set({ xmlList: updatedList, validating: false });
    } catch (error: unknown) {
      logUnknownError(error, console.error);
      set({ validating: false });
      throw error;
    }
  },

  processFiles: async (fileNames: string[]) => {
    set({ processing: true });
    try {
      const response = await procesarDocumentos(fileNames);

      if (response.success) {
        // Refresh the list to get 'Procesado' status and updated metadata
        await get().fetchXMLList();
        set({ processing: false });
      } else {
        set({ processing: false });
      }
      return response;
    } catch (error: unknown) {
      logUnknownError(error, console.error);
      set({ processing: false });
      throw error;
    }
  },
}));
