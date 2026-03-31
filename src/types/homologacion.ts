import type { ProductoPendiente } from './xml';

export interface ProductoERP {
  codigo: number;
  subcodigo: number;
  nombre: string;
  referencia: string;
  unidad?: number;
  unidadDefault?: string;
}

export interface UnidadERP {
  codigo: string;
  sigla: string;
  nombre: string;
}

export interface ProductoMapeoPage extends ProductoPendiente {
  productoSistema?: string;
  referenciaErp?: string;
  codigoErp?: number;
  subcodigoErp?: number;
  nombreErp?: string;
  unidadErp?: string;
  factor: number;
  suggestions?: ProductoERP[];
  searching?: boolean;
  isEditing?: boolean;
  isSuggested?: boolean;
}

export interface ProductoHomologacion {
  id: number;
  xmlFile: string;
  productoXml: string;
  codigoXml: string;
  productoSistema?: string;
  estado: 'pendiente' | 'homologado';
}

export interface ProductoHelisa {
  id: string;
  codigo: string;
  nombre: string;
}
