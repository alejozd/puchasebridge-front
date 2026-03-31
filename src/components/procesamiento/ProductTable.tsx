import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import type { XMLProduct } from '../../types/xml';
import '../../styles/procesamiento.css';

interface ProductTableProps {
  productos: XMLProduct[];
}

const ProductTable: React.FC<ProductTableProps> = ({ productos }) => {
  console.log('productos', productos);

  const homologationBodyTemplate = (rowData: XMLProduct) => {
    return (
      <Tag
        value={rowData.estadoProducto}
        severity={rowData.estadoProducto === 'HOMOLOGADO' ? 'success' : 'warning'}
        className="status-tag"
      />
    );
  };

  const formatCurrency = (value: unknown) => {
    const num = Number(value);
    if (isNaN(num)) return '$ 0';

    return num.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP'
    });
  };

  return (
    <div className="product-table-wrapper h-full">
      <Tooltip target=".description-column" position="top" />
      <DataTable
        value={productos}
        className="procesamiento-table h-full w-full"
        scrollable
        scrollHeight="flex"
        rowHover
        stripedRows
        emptyMessage="No hay productos registrados en este documento."
      >
        <Column
          field="descripcion"
          header="Producto XML"
          body={(rowData: XMLProduct) => (
            <div className="flex flex-column gap-1">
              <span
                className="description-column text-sm font-semibold"
                data-pr-tooltip={rowData.descripcion}
              >
                {rowData.descripcion}
              </span>
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
          body={(rowData: XMLProduct) => <span className="text-xs uppercase font-medium">{rowData.unidad}</span>}
        />
        <Column
          field="valorUnitario"
          header="Unitario"
          body={(rowData: XMLProduct) => (
            <span className="text-sm">
              {formatCurrency(rowData.valorUnitario)}
            </span>
          )}
          className="text-right col-price"
        />
        <Column
          field="valorTotal"
          header="Total"
          body={(rowData: XMLProduct) => (
            <span className="text-sm font-bold text-primary">
              {formatCurrency(rowData.valorTotal)}
            </span>
          )}
          className="text-right col-price"
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
