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
