export interface XMLFile {
  fileName: string;
  size: number;
  lastModified: string;
  estado?: 'Pendiente' | 'Validado' | 'Error' | 'Requiere homologación';
  tipoDocumento?: string;
  erroresValidacion?: string[];
  proveedor?: string;
  resultadoValidacion?: string;
}

export interface ValidationResult {
  fileName: string;
  estado: 'Validado' | 'Error' | 'Requiere homologación';
  resultadoValidacion: string;
  errores?: string[];
}
