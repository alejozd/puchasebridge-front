import { useState, useEffect, useCallback } from 'react';
import { getXMLFiles } from '../services/xmlService';
import type { XMLFileItem } from '../types/xml';
import { logger } from '../utils/logger';

export const useXmlFiles = () => {
  const [files, setFiles] = useState<XMLFileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getXMLFiles();
      // Normalize to match user expectations (camelCase for list)
      const normalizedData: XMLFileItem[] = data.map(item => ({
        ...item,
        fileName: item.fileName || item.file_name || '',
        proveedorNombre: item.proveedor_nombre || item.proveedor || '',
        fechaDocumento: item.fecha_documento || item.fecha_carga || item.fechaCarga || '',
        fechaCarga: item.fecha_carga || item.fechaCarga || ''
      }));
      setFiles(normalizedData);
    } catch (err) {
      setError('Error al cargar la lista de archivos XML');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    loading,
    error,
    refresh: fetchFiles,
    setFiles
  };
};
