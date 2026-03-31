import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { useXMLStore } from '../../store/xmlStore';
import HomologacionTable from '../homologacion/HomologacionTable';
import * as xmlService from '../../services/xmlService';
import * as erpService from '../../services/erpService';
import type { HomologarPayload } from '../../types/xml';
import type { ProductoMapeoPage, ProductoERP, UnidadERP } from '../../types/homologacion';
import '../../styles/HomologacionModal.css';

interface HomologacionModalProps {
  visible: boolean;
  onHide: () => void;
  fileName: string;
  onSuccess: () => void;
}

type EstadoFiltro = 'todos' | 'pendiente' | 'homologado';

const HomologacionModal: React.FC<HomologacionModalProps> = ({ visible, onHide, fileName, onSuccess }) => {
  const [items, setItems] = useState<ProductoMapeoPage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos');
  const [unidadesERP, setUnidadesERP] = useState<UnidadERP[]>([]);
  const [productosERP, setProductosERP] = useState<ProductoERP[]>([]);
  const [totales, setTotales] = useState({ totalProductos: 0, totalPendientes: 0, totalHomologados: 0 });
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);

  const handleSearchProductos = useCallback(async (query: string) => {
    const trimmedQuery = query?.trim();
    if (!trimmedQuery) {
      setProductosERP([]);
      return;
    }

    try {
      const result = await erpService.searchErpProductos(trimmedQuery);
      setProductosERP(result);
    } catch {
      setProductosERP([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docData, erpUnits] = await Promise.all([
        xmlService.getProductosDocumento(fileName),
        erpService.getErpUnidades()
      ]);

      const mapped: ProductoMapeoPage[] = docData.productos.map((p) => ({
        referenciaXML: p.referenciaXML,
        nombreProducto: p.nombreProducto,
        unidadXML: p.unidadXML,
        unidadXMLNombre: p.unidadXMLNombre,
        estado: p.estado,
        referenciaErp: p.referenciaErp || '',
        codigoErp: p.codigoErp,
        subcodigoErp: p.subcodigoErp,
        nombreErp: p.nombreErp || '',
        productoSistema: p.referenciaErp ? `[${p.referenciaErp}] - ${p.nombreErp || ''}` : '',
        unidadErp: p.unidadErp || '',
        factor: p.factor || 1,
      }));

      setItems(mapped);
      setUnidadesERP(erpUnits);
      setProductosERP([]);
      setTotales({
        totalProductos: docData.totalProductos,
        totalPendientes: docData.totalPendientes,
        totalHomologados: docData.totalHomologados,
      });
      return mapped;
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos necesarios.', life: 3000 });
    } finally {
      setLoading(false);
    }
  }, [fileName]);

  useEffect(() => {
    if (visible && fileName) loadData();
  }, [visible, fileName, loadData]);

  const filteredItems = useMemo(() => {
    const lowSearch = searchTerm.trim().toLowerCase();

    return items.filter((p) => {
      const estado = (p.estado || 'pendiente').toLowerCase();
      const estadoMatch = estadoFiltro === 'todos' || (estadoFiltro === 'homologado' ? estado === 'homologado' : estado !== 'homologado');
      if (!lowSearch) return estadoMatch;

      const searchMatch =
        p.nombreProducto.toLowerCase().includes(lowSearch)
        || p.referenciaXML.toLowerCase().includes(lowSearch)
        || (p.referenciaErp || '').toLowerCase().includes(lowSearch)
        || (p.productoSistema || '').toLowerCase().includes(lowSearch);

      return estadoMatch && searchMatch;
    });
  }, [items, searchTerm, estadoFiltro]);

  const setFilteredItems: React.Dispatch<React.SetStateAction<ProductoMapeoPage[]>> = (updater) => {
    setItems(prevItems => {
      const nextFiltered = typeof updater === 'function'
        ? (updater as (prevState: ProductoMapeoPage[]) => ProductoMapeoPage[])(filteredItems)
        : updater;

      const byRef = new Map(nextFiltered.map(i => [i.referenciaXML, i]));
      return prevItems.map(item => byRef.get(item.referenciaXML) || item);
    });
  };

  const handleSaveAll = async () => {
    const toSave = items.filter(item => {
      const editable = item.estado?.toLowerCase() !== 'homologado' || item.isEditing;
      return editable && item.referenciaErp;
    });

    if (toSave.length === 0) {
      toast.current?.show({ severity: 'info', summary: 'Sin cambios', detail: 'No hay homologaciones para guardar.', life: 3000 });
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.all(toSave.map(async (rowData) => {
        if (!rowData.referenciaErp || !rowData.unidadErp || !rowData.codigoErp || rowData.subcodigoErp === undefined || !rowData.nombreErp || !rowData.factor || rowData.factor <= 0) {
          return false;
        }

        const payload: HomologarPayload = {
          fileName,
          referenciaXml: rowData.referenciaXML,
          unidadXml: rowData.unidadXML,
          codigoH: rowData.codigoErp,
          subCodigoH: rowData.subcodigoErp,
          nombreH: rowData.nombreErp,
          referenciaErp: rowData.referenciaErp,
          unidadErp: rowData.unidadErp,
          factor: rowData.factor,
        };
        const res = await xmlService.homologarProducto(payload);
        return res.success;
      }));

      const savedCount = results.filter(Boolean).length;
      if (savedCount > 0) {
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: `Se homologaron ${savedCount} productos.`, life: 3000 });
        const freshItems = await loadData();
        await useXMLStore.getState().fetchXMLList();
        if (freshItems && freshItems.length === 0) onSuccess();
      } else {
        toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'No se guardaron homologaciones. Verifique producto, unidad y factor.', life: 3000 });
      }
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al intentar homologar productos.', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      header={
        <div className="homologacion-header">
          <div className="header-icon-container">
            <i className="pi pi-sync text-primary text-xl"></i>
          </div>
          <div className="header-title-block">
            <h2 className="header-title app-title">Homologación de productos</h2>
            <span className="header-subtitle">{fileName}</span>
          </div>
        </div>
      }
      headerClassName="homologacion-header-container"
      visible={visible}
      onHide={onHide}
      className="detail-dialog-v2"
      style={{ width: '92vw', maxWidth: '1320px' }}
      draggable={false}
      resizable={false}
      modal
      blockScroll
      footer={
        <div className="flex align-items-center justify-content-between px-4 py-3 border-top-1 border-gray-100 bg-white">
          <Message
            severity="info"
            className="minimalist-tip"
            content={<div className="flex align-items-center gap-2"><i className="pi pi-info-circle text-xs"></i><span className="text-xs">Tip: verifica unidad ERP y factor antes de guardar.</span></div>}
          />
          <div className="flex align-items-center gap-2">
            <Button label="Guardar" icon="pi pi-check" onClick={handleSaveAll} loading={loading} className="p-button-sm" />
            <Button label="Cerrar" icon="pi pi-times" onClick={onHide} className="p-button-text p-button-secondary p-button-sm font-semibold" />
          </div>
        </div>
      }
    >
      <Toast ref={toast} />
      <div className="homologacion-content">
        <div className="toolbar-grid mb-2">
          <div className="toolbar-stats">
            <Tag value={`Total: ${totales.totalProductos}`} severity="info" rounded />
            <Tag value={`Pendientes: ${totales.totalPendientes}`} severity="warning" rounded />
            <Tag value={`Homologados: ${totales.totalHomologados}`} severity="success" rounded />
          </div>

          <div className="toolbar-actions">
            <div className="estado-filtros" role="group" aria-label="Filtrar estado">
              <Button label="Todos" onClick={() => setEstadoFiltro('todos')} className={`p-button-sm ${estadoFiltro === 'todos' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`} />
              <Button label="Pendientes" onClick={() => setEstadoFiltro('pendiente')} className={`p-button-sm ${estadoFiltro === 'pendiente' ? 'p-button-warning' : 'p-button-outlined p-button-secondary'}`} />
              <Button label="Homologados" onClick={() => setEstadoFiltro('homologado')} className={`p-button-sm ${estadoFiltro === 'homologado' ? 'p-button-success' : 'p-button-outlined p-button-secondary'}`} />
            </div>

            <span className="p-input-icon-right search-pill-container">
              <InputText value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Búsqueda global..." className="p-inputtext-sm search-pill" />
              <i className="pi pi-search" />
            </span>
          </div>
        </div>

        <HomologacionTable
          items={filteredItems}
          setItems={setFilteredItems}
          productosERP={productosERP}
          unidadesERP={unidadesERP}
          loading={loading}
          modo="modal"
          onSearchProductos={handleSearchProductos}
        />
      </div>
    </Dialog>
  );
};

export default HomologacionModal;
