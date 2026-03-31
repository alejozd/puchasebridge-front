import { useState, useCallback } from "react";
import { getXMLFileDetail, procesarXML } from "../services/xmlService";
import type { XMLFileDetail, XMLProcesarResponse } from "../types/xml";
import { logger } from "../utils/logger";
import { logUnknownError } from "../utils/apiHandler";

export const useXmlDetail = () => {
  const [detail, setDetail] = useState<XMLFileDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);

  const fetchDetail = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const data = await getXMLFileDetail(id);
      logger.log("DETAIL RESPONSE:", data);

      // Normalize mapping to ensure consistency with camelCase interface
      const normalizedDetail: XMLFileDetail = {
        id: data.id,
        fileName: data.file_name || data.fileName || "",
        proveedorNombre: data.proveedor_nombre || data.proveedorNombre || "",
        proveedorNit: data.proveedor_nit || data.proveedorNit || "",
        fechaDocumento: data.fecha_documento || data.fechaDocumento || "",
        estado: data.estado,
        fechaCarga: data.fecha_carga || data.fechaCarga || "",
        fechaValidacion: data.fecha_validacion ?? data.fechaValidacion ?? null,
        fechaProceso: data.fecha_proceso ?? data.fechaProceso ?? null,
        productos: (data.productos || []).map((p) => ({
          ...p,
          id: p.id ?? 0,
          unidad: p.unidad || "UND",
          valorUnitario: p.valorUnitario ?? p.valor_unitario ?? 0,
          valorTotal: p.valorTotal ?? p.valor_total ?? 0,
          equivalenciaId: p.equivalencia_id,
          estadoProducto:
            p.estadoProducto ?? (p.equivalencia_id ? "HOMOLOGADO" : "PENDIENTE"),
        })),
      };

      setDetail(normalizedDetail);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
        alert(err.message);
      } else {
        console.error("Error desconocido", err);
        alert("Ocurrió un error inesperado");
      }
      logUnknownError(err, logger.error);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const procesar = async (
    files: string[],
  ): Promise<XMLProcesarResponse | null> => {
    setProcessing(true);
    try {
      const result = await procesarXML(files);
      return result;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
        alert(err.message);
      } else {
        console.error("Error desconocido", err);
        alert("Ocurrió un error inesperado");
      }
      logUnknownError(err, logger.error);
      return null;
    } finally {
      setProcessing(false);
    }
  };

  return {
    detail,
    loading,
    processing,
    fetchDetail,
    procesar,
    setDetail,
  };
};
