export interface XMLFile {
  fileName: string;
  size: number;
  lastModified: string;
  estado?: 'Pendiente' | 'Validado' | 'Con errores' | 'Requiere homologación' | 'Procesado';
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

// New interfaces for Procesamiento de XML
export interface XMLFileItem {
  id: number;
  file_name: string;
  proveedor_nombre: string;
  fecha_documento: string;
  estado: 'VALIDADO' | 'PENDIENTE' | 'ERROR' | 'PROCESADO';
  fecha_carga: string;
}

export interface XMLProduct {
  descripcion: string;
  referencia: string;
  cantidad: number;
  unidad: string;
  valor_unitario: number;
  valor_total: number;
  equivalencia_id?: number | string | null;
}

export interface XMLFileDetail {
  id: number;
  file_name: string;
  proveedor_nombre: string;
  proveedor_nit: string;
  fecha_documento: string;
  estado: string;
  productos: XMLProduct[];
}

export interface XMLValidationResult {
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

export interface XMLProcesarResponse {
  success: boolean;
  documentoGenerado?: string;
  mensaje?: string;
}

export interface ProductoPendiente {
  referenciaXML: string;
  nombreProducto: string;
  unidadXML: string;
  unidadXMLNombre?: string;
  estado: string;
}

export interface HomologarPayload {
  fileName: string;
  referenciaXml: string;
  unidadXml: string;
  referenciaErp: string;
  unidadErp: string;
  factor: number;
}
