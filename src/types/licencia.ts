export interface LicenciaEstado {
  estado: 'activa' | 'demo' | 'bloqueado';
  diasRestantes: number;
  fechaExpiracion: string;
}

export interface RegistrarLicenciaPayload {
  codigo: string;
}

export interface RegistrarLicenciaResponse {
  success: boolean;
  mensaje: string;
}
