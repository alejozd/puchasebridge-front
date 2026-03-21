import { useState, useCallback } from 'react';
import { getXMLFileDetail, validateXML, procesarXML } from '../services/xmlService';
import type { XMLFileDetail, XMLValidationResult, XMLProcesarResponse } from '../types/xml';

export const useXmlDetail = () => {
  const [detail, setDetail] = useState<XMLFileDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getXMLFileDetail(id);
      setDetail(data);
    } catch (err) {
      setError('Error al cargar el detalle del archivo XML');
      console.error(err);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const validate = async (fileName: string): Promise<XMLValidationResult | null> => {
    setValidating(true);
    try {
      const result = await validateXML(fileName);
      return result;
    } catch (err) {
      console.error('Error durante la validación:', err);
      return null;
    } finally {
      setValidating(false);
    }
  };

  const procesar = async (ids: number[]): Promise<XMLProcesarResponse | null> => {
    setProcessing(true);
    try {
      const result = await procesarXML(ids);
      return result;
    } catch (err) {
      console.error('Error durante el procesamiento:', err);
      return null;
    } finally {
      setProcessing(false);
    }
  };

  return {
    detail,
    loading,
    validating,
    processing,
    error,
    fetchDetail,
    validate,
    procesar,
    setDetail
  };
};
