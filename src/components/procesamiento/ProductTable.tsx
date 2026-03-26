import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import type { XMLProduct } from '../../types/xml';
import '../../styles/procesamiento.css';

interface ProductTableProps {
  productos: XMLProduct[];
}

const ProductTable: React.FC<ProductTableProps> = ({ productos }) => {
  const homologationBodyTemplate = (rowData: XMLProduct) => {
    const isHomologated = !!rowData.equivalencia_id;
    return (
      <Tag
        value={isHomologated ? 'Homologado' : 'Pendiente'}
        severity={isHomologated ? 'success' : 'danger'}
        className="status-tag"
      />
    );
  };

  const currencyBodyTemplate = (rowData: XMLProduct, field: 'valor_unitario' | 'valor_total') => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(rowData[field]);
  };

  return (
    <div className="product-table-wrapper h-full">
      <DataTable
        value={productos}
        className="procesamiento-table h-full w-full"
        scrollable
        scrollHeight="flex"
        rowHover
        emptyMessage="No hay productos registrados en este documento."
      >
        <Column
          field="descripcion"
          header="Producto XML"
          body={(rowData) => (
            <div className="flex flex-column gap-1">
              <span className="description-column text-sm font-semibold">{rowData.descripcion}</span>
              <span className="ref-column text-xs text-secondary opacity-70 font-mono">{rowData.referencia}</span>
            </div>
          )}
          className="col-description"
        />
        <Column
          field="cantidad"
          header="Cant"
          body={(rowData) => <span className="text-sm font-bold">{rowData.cantidad}</span>}
          className="col-qty"
        />
        <Column
          field="unidad"
          header="Unidad"
          body={(rowData) => <span className="text-xs uppercase">{rowData.unidad}</span>}
        />
        <Column
          field="valor_unitario"
          header="Unitario"
          body={(rowData) => currencyBodyTemplate(rowData, 'valor_unitario')}
          className="text-right"
        />
        <Column
          field="valor_total"
          header="Total"
          body={(rowData) => currencyBodyTemplate(rowData, 'valor_total')}
          className="text-right"
        />
        <Column
          header="Homologación"
          body={homologationBodyTemplate}
          className="text-center col-homologation"
        />
      </DataTable>
    </div>
  );
};

export default ProductTable;
