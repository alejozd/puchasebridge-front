import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber, type InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import * as xmlService from '../../services/xmlService';
import type { ProductoPendiente, HomologarPayload } from '../../types/xml';

interface HomologacionModalProps {
    visible: boolean;
    onHide: () => void;
    fileName: string;
    onSuccess: () => void;
}

interface ProductoMapeo extends ProductoPendiente {
    referenciaErp: string;
    unidadErp: string;
    factor: number;
    loading?: boolean;
}

const HomologacionModal: React.FC<HomologacionModalProps> = ({ visible, onHide, fileName, onSuccess }) => {
    const [productos, setProductos] = useState<ProductoMapeo[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);

    const loadProductos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await xmlService.getProductosPendientes(fileName);
            setProductos(data.map(p => ({
                ...p,
                referenciaErp: '',
                unidadErp: '',
                factor: 1
            })));
        } catch {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar los productos pendientes.',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    }, [fileName]);

    useEffect(() => {
        if (visible && fileName) {
            loadProductos();
        }
    }, [visible, fileName, loadProductos]);

    const handleSaveRow = async (rowData: ProductoMapeo) => {
        if (!rowData.referenciaErp || !rowData.unidadErp || !rowData.factor) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Campos requeridos',
                detail: 'Por favor complete todos los campos de homologación.',
                life: 3000
            });
            return;
        }

        updateRowLoading(rowData.referenciaXml, true);
        try {
            const payload: HomologarPayload = {
                fileName,
                referenciaXml: rowData.referenciaXml,
                referenciaErp: rowData.referenciaErp,
                unidadErp: rowData.unidadErp,
                factor: rowData.factor
            };
            const res = await xmlService.homologarProducto(payload);
            if (res.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: res.mensaje || 'Producto homologado correctamente.',
                    life: 3000
                });

                setProductos(prev => {
                    const updated = prev.filter(p => p.referenciaXml !== rowData.referenciaXml);
                    if (updated.length === 0) {
                        onSuccess();
                    }
                    return updated;
                });
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: res.mensaje,
                    life: 3000
                });
            }
        } catch {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al intentar homologar el producto.',
                life: 3000
            });
        } finally {
            updateRowLoading(rowData.referenciaXml, false);
        }
    };

    const updateRowLoading = (referenciaXml: string, isLoading: boolean) => {
        setProductos(prev => prev.map(p =>
            p.referenciaXml === referenciaXml ? { ...p, loading: isLoading } : p
        ));
    };

    const onInputChange = (referenciaXml: string, field: keyof ProductoMapeo, value: string | number | null) => {
        setProductos(prev => prev.map(p =>
            p.referenciaXml === referenciaXml ? { ...p, [field]: value } : p
        ));
    };

    const erpReferenceEditor = (rowData: ProductoMapeo) => (
        <InputText
            value={rowData.referenciaErp}
            onChange={(e) => onInputChange(rowData.referenciaXml, 'referenciaErp', e.target.value)}
            placeholder="Ref ERP"
            className="w-full p-inputtext-sm"
        />
    );

    const erpUnitEditor = (rowData: ProductoMapeo) => (
        <InputText
            value={rowData.unidadErp}
            onChange={(e) => onInputChange(rowData.referenciaXml, 'unidadErp', e.target.value)}
            placeholder="Unidad ERP"
            className="w-full p-inputtext-sm"
        />
    );

    const factorEditor = (rowData: ProductoMapeo) => (
        <InputNumber
            value={rowData.factor}
            onValueChange={(e: InputNumberValueChangeEvent) => onInputChange(rowData.referenciaXml, 'factor', e.value ?? 0)}
            min={0}
            maxFractionDigits={4}
            className="w-full p-inputtext-sm"
        />
    );

    const actionTemplate = (rowData: ProductoMapeo) => (
        <Button
            icon="pi pi-save"
            text
            rounded
            severity="success"
            onClick={() => handleSaveRow(rowData)}
            loading={rowData.loading}
        />
    );

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-sync text-primary" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                        <h3 className="m-0 text-primary">Homologación de Productos</h3>
                        <small className="text-secondary">{fileName}</small>
                    </div>
                </div>
            }
            visible={visible}
            onHide={onHide}
            style={{ width: '80vw', maxWidth: '1000px' }}
            draggable={false}
            resizable={false}
            modal
        >
            <Toast ref={toast} />
            <div className="py-2">
                <DataTable
                    value={productos}
                    loading={loading}
                    className="p-datatable-sm"
                    emptyMessage="No hay productos pendientes por homologar."
                    responsiveLayout="scroll"
                >
                    <Column field="referenciaXml" header="REF XML" style={{ width: '15%' }} />
                    <Column field="nombre" header="NOMBRE PRODUCTO" style={{ width: '25%' }} />
                    <Column field="unidad" header="UND XML" style={{ width: '10%' }} />
                    <Column header="REF ERP" body={erpReferenceEditor} style={{ width: '15%' }} />
                    <Column header="UND ERP" body={erpUnitEditor} style={{ width: '15%' }} />
                    <Column header="FACTOR" body={factorEditor} style={{ width: '10%' }} />
                    <Column header="ACCIONES" body={actionTemplate} style={{ width: '10%' }} align="center" />
                </DataTable>
            </div>
            <div className="flex justify-content-end mt-4">
                <Button label="Cerrar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
            </div>
        </Dialog>
    );
};

export default HomologacionModal;
