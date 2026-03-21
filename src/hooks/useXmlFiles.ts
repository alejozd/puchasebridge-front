import { useState, useEffect, useCallback } from 'react';
import { getXMLFiles } from '../services/xmlService';
import type { XMLFileItem } from '../types/xml';

export const useXmlFiles = () => {
  const [files, setFiles] = useState<XMLFileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getXMLFiles();
      setFiles(data);
    } catch (err) {
      setError('Error al cargar la lista de archivos XML');
      console.error(err);
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
