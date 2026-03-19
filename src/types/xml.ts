export interface XMLFile {
  fileName: string;
  size: number;
  lastModified: string;
  estado?: string;
  tipoDocumento?: string;
  erroresValidacion?: string[];
}
