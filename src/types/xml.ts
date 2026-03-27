export interface XMLFile {
  fileName: string;
  size: number;
  lastModified: string;
  fechaProceso?: string;
  estado?: 'CARGADO' | 'PENDIENTE' | 'LISTO' | 'ERROR' | 'Procesado';
  tipoDocumento?: string;
  erroresValidacion?: string[];
  advertenciasValidacion?: string[];
  proveedor?: string;
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
  estado: 'LISTO' | 'ERROR' | 'PENDIENTE';
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
  fileName: string;
  file_name?: string;
  proveedor: string;
  proveedorNombre: string;
  proveedor_nombre?: string;
  fechaDocumento: string;
  fecha_documento?: string;
  estado: string;
  fechaCarga: string;
  fecha_carga?: string;
  fecha_proceso?: string;
  size: number;
}

export interface XMLProduct {
  descripcion: string;
  referencia: string;
  cantidad: number;
  unidad: string;
  valor_unitario: number;
  valorUnitario?: number;
  valor_total: number;
  valorTotal?: number;
  equivalencia_id?: number | string | null;
  equivalenciaId?: number | string | null;
  estadoProducto?: 'HOMOLOGADO' | 'PENDIENTE';
}

export interface XMLFileDetail {
  id: number;
  fileName: string;
  file_name?: string;
  proveedorNombre: string;
  proveedor_nombre?: string;
  proveedorNit: string;
  proveedor_nit?: string;
  fechaDocumento: string;
  fecha_documento?: string;
  estado: string;
  fechaCarga: string;
  fecha_carga?: string;
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

export interface ProductoDocumento {
  referenciaXML: string;
  nombreProducto: string;
  unidadXML: string;
  unidadXMLNombre: string;
  estado: string;
  referenciaErp: string;
  codigoErp?: number;
  subcodigoErp?: number;
  nombreErp: string;
  unidadErp: string;
  unidadErpNombre: string;
  factor: number;
}

export interface DocumentoProductosResponse {
  totalProductos: number;
  totalPendientes: number;
  totalHomologados: number;
  productos: ProductoDocumento[];
}

export interface HomologarPayload {
  fileName: string;
  referenciaXml: string;
  unidadXml: string;
  codigoH: number;
  subCodigoH: number;
  nombreH: string;
  referenciaErp: string;
  unidadErp: string;
  factor: number;
}

export interface DashboardMetrics {
  total: number;
  cargados: number;
  pendientes: number;
  listos: number;
  procesados: number;
  errores: number;
  procesadosHoy: number;
  erroresHoy: number;
}
