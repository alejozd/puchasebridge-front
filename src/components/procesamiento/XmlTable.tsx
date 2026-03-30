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
      'VALIDADO': 'info',
      'LISTO': 'info',
      'PROCESADO': 'success',
      'ERROR': 'danger',
      'PENDIENTE': 'warning',
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
        onRowClick={(e) => onRowClick(e.data.id)}
        rowClassName={(data) => ({ 'row-selected': (data as XMLFileItem).id === selectedId })}
        emptyMessage="No se encontraron archivos XML."
        scrollable
        scrollHeight="flex"
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        <Column
          field="fileName"
          header="Archivo"
          body={(rowData: XMLFileItem) => <span className="filename-column">{rowData.fileName}</span>}
          sortable
        />
        <Column
          field="proveedorNombre"
          header="Proveedor"
          body={(rowData: XMLFileItem) => <span className="provider-column">{rowData.proveedorNombre}</span>}
          sortable
        />
        <Column
          field="fechaDocumento"
          header="Fecha"
          body={(rowData: XMLFileItem) => <span className="date-column">{rowData.fechaDocumento}</span>}
          sortable
        />
        <Column
          field="estado"
          header="Estado"
          body={statusBodyTemplate}
          sortable
        />
        <Column
          field="fechaCarga"
          header="Carga"
          body={(rowData: XMLFileItem) => <span className="date-column text-xs">{rowData.fechaCarga}</span>}
          sortable
        />
      </DataTable>
    </div>
  );
};

export default XmlTable;
