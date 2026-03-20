export interface DocumentoProcesamiento {
  id: number;
  fileName: string;
  proveedor?: string;
  fecha?: string;
  estado: 'listo' | 'procesado' | 'error' | 'procesando';
  resultado?: string;
  fechaProcesamiento?: string;
}
