import axiosClient from "../api/axiosClient";

export interface ErpProducto {
    id: string;
    codigo: string;
    nombre: string;
    unidadDefault?: string;
}

export interface ErpUnidad {
    codigo: string;
    sigla: string;
    nombre: string;
}

export const searchErpProductos = async (query: string): Promise<ErpProducto[]> => {
    const response = await axiosClient.get<ErpProducto[]>("/erp/productos", {
        params: { search: query }
    });
    return response.data;
};

export const getErpUnidades = async (): Promise<ErpUnidad[]> => {
    const response = await axiosClient.get<ErpUnidad[]>("/erp/unidades");
    return response.data;
};
