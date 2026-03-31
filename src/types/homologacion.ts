import type { ProductoPendiente } from "./xml";
import type { ErpProducto } from "../services/erpService";

export interface ProductoMapeo extends ProductoPendiente {
  productoSistema?: string;
  referenciaErp?: string;
  codigoErp?: number;
  subcodigoErp?: number;
  nombreErp?: string;
  unidadErp?: string;
  unidadErpLabel?: string;
  factor: number;
  erpSuggestions?: ErpProducto[];
  loading?: boolean;
  searching?: boolean;
  isEditing?: boolean;
  isSuggested?: boolean;
}
