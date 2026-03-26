import React from 'react';
import { DataTable, type DataTableSelectionMultipleChangeEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import type { XMLFileItem } from '../../types/xml';
import '../../styles/procesamiento.css';

interface XmlTableProps {
  files: XMLFileItem[];
  selectedFiles: XMLFileItem[];
  onSelectionChange: (e: DataTableSelectionMultipleChangeEvent<XMLFileItem[]>) => void;
  onRowClick: (id: number) => void;
  selectedId: number | null;
  loading: boolean;
}

const XmlTable: React.FC<XmlTableProps> = ({
  files,
  selectedFiles,
  onSelectionChange,
  onRowClick,
  selectedId,
  loading
}) => {
  const statusBodyTemplate = (rowData: XMLFileItem) => {
    const severityMap: Record<string, "success" | "info" | "warning" | "danger" | "secondary"> = {
      'VALIDADO': 'success',
      'PENDIENTE': 'warning',
      'ERROR': 'danger',
      'PROCESADO': 'info'
    };

    return (
      <Tag
        value={rowData.estado}
        severity={severityMap[rowData.estado] || 'secondary'}
        className="status-tag"
      />
    );
  };

  return (
    <div className="xml-table-wrapper">
      <DataTable
        value={files}
        selection={selectedFiles}
        onSelectionChange={onSelectionChange}
        dataKey="id"
        className="procesamiento-table w-full"
        rowHover
        selectionMode="multiple"
        loading={loading}
        onRowClick={(e) => onRowClick((e.data as XMLFileItem).id)}
        rowClassName={(data) => ({ 'row-selected': (data as XMLFileItem).id === selectedId })}
        emptyMessage="No se encontraron archivos XML."
        scrollable
        scrollHeight="flex"
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        <Column
          field="file_name"
          header="Archivo"
          body={(rowData: XMLFileItem) => <span className="filename-column">{rowData.file_name}</span>}
          sortable
        />
        <Column
          field="proveedor_nombre"
          header="Proveedor"
          body={(rowData: XMLFileItem) => <span className="provider-column">{rowData.proveedor_nombre}</span>}
          sortable
        />
        <Column
          field="fecha_documento"
          header="Fecha"
          body={(rowData: XMLFileItem) => <span className="date-column">{rowData.fecha_documento}</span>}
          sortable
        />
        <Column
          field="estado"
          header="Estado"
          body={statusBodyTemplate}
          sortable
        />
        <Column
          field="fecha_carga"
          header="Carga"
          body={(rowData: XMLFileItem) => <span className="date-column text-xs">{rowData.fecha_carga}</span>}
          sortable
        />
      </DataTable>
    </div>
  );
};

export default XmlTable;
