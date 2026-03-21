import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import type { XMLProduct } from '../../types/xml';

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
        className="procesamiento-table h-full"
        style={{ width: '100%' }}
        scrollable
        scrollHeight="flex"
        rowHover
        emptyMessage="No hay productos registrados en este documento."
      >
        <Column
          field="descripcion"
          header="Descripción"
          body={(rowData) => <span className="description-column text-sm font-medium">{rowData.descripcion}</span>}
          style={{ minWidth: '200px' }}
        />
        <Column
          field="referencia"
          header="Ref"
          body={(rowData) => <span className="ref-column text-xs font-mono">{rowData.referencia}</span>}
        />
        <Column
          field="cantidad"
          header="Cant"
          body={(rowData) => <span className="text-sm font-bold">{rowData.cantidad}</span>}
          style={{ width: '5rem' }}
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
          style={{ textAlign: 'right' }}
        />
        <Column
          field="valor_total"
          header="Total"
          body={(rowData) => currencyBodyTemplate(rowData, 'valor_total')}
          style={{ textAlign: 'right' }}
        />
        <Column
          header="Homologación"
          body={homologationBodyTemplate}
          style={{ textAlign: 'center', width: '8rem' }}
        />
      </DataTable>
    </div>
  );
};

export default ProductTable;
