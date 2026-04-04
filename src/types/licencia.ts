export interface LicenciaEstado {
  estado: 'activa' | 'demo' | 'bloqueado';
  dias_restantes: number | null;
  expira: string | null;
  nit: string;
  instalacion_hash: string;
}

export interface RegistrarLicenciaPayload {
  codigo: string;
}

export interface RegistrarLicenciaResponse {
  success: boolean;
  mensaje: string;
}
