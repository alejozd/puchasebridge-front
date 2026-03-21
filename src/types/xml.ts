export interface XMLFile {
  fileName: string;
  size: number;
  lastModified: string;
  estado?: 'Pendiente' | 'Validado' | 'Con errores' | 'Requiere homologación';
  tipoDocumento?: string;
  erroresValidacion?: string[];
  advertenciasValidacion?: string[];
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
  estado: 'Validado' | 'Con errores' | 'Requiere homologación';
  resultadoValidacion: string;
  errores?: string[];
  advertencias?: string[];
}

export interface BackendProductoResult {
  referencia: string;
  unidad: string;
  existeEquivalencia: boolean;
}

export interface BackendValidationResponse {
  codigoTercero: string;
  valido: boolean;
  requiereHomologacion: boolean;
  proveedorExiste: boolean;
  productos: BackendProductoResult[];
  errores: string[];
  fileName: string;
}
