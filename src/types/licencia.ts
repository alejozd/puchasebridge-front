export interface LicenciaEstado {
  estado: 'activa' | 'demo' | 'bloqueado';
  tipo_licencia: 'demo' | 'anual' | 'permanente';
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
