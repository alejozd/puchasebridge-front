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

export interface ProductoDetalle {
  idLinea: string;
  descripcion: string;
  referencia: string;
  referenciaEstandar: string;
  cantidad: number;
  unidad: string;
  precioBase: number;
  valorUnitario: number;
  valorTotal: number;
  impuesto: number;
  porcentajeImpuesto: number;
}

export interface TotalesDetalle {
  subtotal: number;
  taxInclusiveAmount: number;
  impuestoTotal: number;
  total: number;
}

export interface XmlDetalle {
  success: boolean;
  proveedor: {
    nit: string;
    nombre: string;
    nombreLegal: string;
    tipoIdentificacion: string;
    direccion: string;
  };
  productos: ProductoDetalle[];
  totales: TotalesDetalle;
}

export interface ValidationResult {
  fileName: string;
  estado: 'Validado' | 'Error' | 'Requiere homologación';
  resultadoValidacion: string;
  errores?: string[];
}
