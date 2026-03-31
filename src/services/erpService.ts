import { handleResponse, BASE_URL, getHeaders } from "../utils/apiHandler";

export interface ErpProducto {
  codigo: number;
  subcodigo: number;
  nombre: string;
  referencia: string;
  unidad?: number;
  unidadDefault?: string;
}

export interface ErpUnidad {
  codigo: string;
  sigla: string;
  nombre: string;
}

export const searchErpProductos = async (
  query: string,
): Promise<ErpProducto[]> => {
  const response = await fetch(
    `${BASE_URL}/erp/productos?search=${encodeURIComponent(query)}`,
    {
      headers: getHeaders(),
    },
  );
  return handleResponse(response);
};

export const getErpUnidades = async (): Promise<ErpUnidad[]> => {
  const response = await fetch(`${BASE_URL}/erp/unidades`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};
