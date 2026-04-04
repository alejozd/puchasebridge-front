import React, { useEffect, useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { getLicenciaEstado, registrarLicencia, activarOnline } from '../../services/licenciaService';
import type { LicenciaEstado } from '../../types/licencia';

const LicenciaPage: React.FC = () => {
    const [estado, setEstado] = useState<LicenciaEstado | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [onlineLoading, setOnlineLoading] = useState<boolean>(false);
    const [codigo, setCodigo] = useState<string>('');
    const toast = useRef<Toast>(null);

    const fetchEstado = async () => {
        setLoading(true);
        try {
            const data = await getLicenciaEstado();
            console.log("Licencia:", data);
            setEstado(data);
        } catch (error: unknown) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error instanceof Error ? error.message : 'Error al obtener estado de licencia',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEstado();
    }, []);

    const handleActivar = async () => {
        if (!codigo.trim()) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Debe ingresar un código de licencia',
                life: 3000
            });
            return;
        }

        setSubmitting(true);
        try {
            const response = await registrarLicencia({ codigo });
            if (response.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: response.mensaje || 'Licencia activada correctamente',
                    life: 3000
                });
                setCodigo('');
                await fetchEstado();
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: response.mensaje || 'No se pudo activar la licencia',
                    life: 3000
                });
            }
        } catch (error: unknown) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error instanceof Error ? error.message : 'Error al activar la licencia',
                life: 3000
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleActivarOnline = async () => {
        setOnlineLoading(true);
        try {
            const response = await activarOnline();
            if (response.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: response.mensaje || 'Licencia activada en línea correctamente',
                    life: 3000
                });
                await fetchEstado();
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: response.mensaje || 'No se pudo activar la licencia en línea',
                    life: 3000
                });
            }
        } catch (error: unknown) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error instanceof Error ? error.message : 'Error al activar en línea',
                life: 3000
            });
        } finally {
            setOnlineLoading(false);
        }
    };

    const getEstadoSeverity = (estado?: string) => {
        switch (estado) {
            case 'activa': return 'success';
            case 'demo': return 'warning';
            case 'bloqueado': return 'danger';
            default: return 'info';
        }
    };

    const formatExpiracion = (expira: string | undefined) => {
        if (!expira) return "Sin fecha de expiración";
        const fecha = new Date(expira);
        if (isNaN(fecha.getTime())) return "Sin fecha de expiración";
        // Detectar fechas inválidas de Delphi (ej: 1899-12-30)
        if (fecha.getFullYear() < 2000) return "Sin fecha de expiración";
        return fecha.toLocaleDateString();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.current?.show({
                severity: 'success',
                summary: 'Copiado',
                detail: 'ID de instalación copiado al portapapeles',
                life: 2000
            });
        }).catch(() => {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo copiar el ID',
                life: 2000
            });
        });
    };

    if (loading && !estado) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <h2 className="page-title mb-4">Gestión de Licencia</h2>

            <div className="grid">
                <div className="col-12 md:col-6">
                    <Card title="Estado del Sistema" className="shadow-2">
                        {estado && (
                            <div className="flex flex-column gap-3">
                                <div className="flex align-items-center justify-content-between border-bottom-1 surface-border pb-2">
                                    <span className="font-semibold">Estado:</span>
                                    <Tag
                                        value={(estado.estado || 'demo').toUpperCase()}
                                        severity={getEstadoSeverity(estado.estado)}
                                        style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                                    />
                                </div>
                                <div className="flex align-items-center justify-content-between border-bottom-1 surface-border pb-2">
                                    <span className="font-semibold">Tipo de Licencia:</span>
                                    <Tag
                                        value={(estado.tipo_licencia || 'demo').toUpperCase()}
                                        severity="info"
                                        style={{ fontSize: '0.8rem' }}
                                    />
                                </div>
                                <div className="flex align-items-center justify-content-between border-bottom-1 surface-border pb-2">
                                    <span className="font-semibold">Días restantes:</span>
                                    {estado.dias_restantes !== null ? (
                                        <span className={`text-xl font-bold ${estado.dias_restantes <= 5 ? 'text-red-500' : 'text-primary'}`}>
                                            {estado.dias_restantes} días
                                        </span>
                                    ) : (
                                        <Tag value="LICENCIA PERMANENTE" severity="success" style={{ fontSize: '0.8rem' }} />
                                    )}
                                </div>
                                {estado.dias_restantes !== null && (
                                    <div className="flex align-items-center justify-content-between border-bottom-1 surface-border pb-2">
                                        <span className="font-semibold">Fecha de expiración:</span>
                                        <span>{formatExpiracion(estado.expira)}</span>
                                    </div>
                                )}

                                <div className="flex flex-column gap-2 mt-2">
                                    <span className="font-semibold">ID Instalación:</span>
                                    <div className="flex align-items-center gap-2 p-2 surface-100 border-round overflow-hidden">
                                        <span className="text-sm font-monospace text-overflow-ellipsis white-space-nowrap overflow-hidden flex-1" style={{ fontFamily: 'monospace' }}>
                                            {estado.instalacion_hash}
                                        </span>
                                        <Button
                                            icon="pi pi-copy"
                                            className="p-button-rounded p-button-text p-button-sm"
                                            onClick={() => copyToClipboard(estado.instalacion_hash)}
                                            tooltip="Copiar ID"
                                            tooltipOptions={{ position: 'top' }}
                                        />
                                    </div>
                                </div>

                                {estado.dias_restantes !== null && estado.dias_restantes === 0 && (estado.estado || 'demo') !== 'bloqueado' && (
                                    <Message
                                        severity="error"
                                        text="¡ADVERTENCIA! Su licencia ha expirado hoy. El sistema se bloqueará mañana si no se renueva."
                                        className="mt-2 w-full justify-content-start font-bold"
                                    />
                                )}

                                {estado.dias_restantes !== null && estado.dias_restantes > 0 && estado.dias_restantes <= 5 && (estado.estado || 'demo') !== 'bloqueado' && (
                                    <Message
                                        severity="warn"
                                        text={`¡Atención! Su licencia expira en ${estado.dias_restantes} días.`}
                                        className="mt-2 w-full justify-content-start"
                                    />
                                )}

                                {(estado.estado || 'demo') === 'activa' && (estado.tipo_licencia || 'demo') === 'demo' && (
                                    <div className="mt-3">
                                        <Button
                                            label="Activar licencia completa"
                                            icon="pi pi-star"
                                            onClick={handleActivarOnline}
                                            loading={onlineLoading}
                                            className="p-button-primary w-full shadow-2"
                                        />
                                    </div>
                                )}

                                {(estado.estado || 'demo') === 'activa' && (
                                    <Message
                                        severity="success"
                                        text="Su licencia está activa y funcionando correctamente."
                                        className="mt-2 w-full justify-content-start"
                                    />
                                )}

                                {(estado.estado || 'demo') === 'demo' && (
                                    <Message
                                        severity="info"
                                        text="El sistema está en modo demo con funcionalidades limitadas."
                                        className="mt-2 w-full justify-content-start"
                                    />
                                )}

                                {(estado.estado || 'demo') === 'bloqueado' && (
                                    <Message
                                        severity="error"
                                        text="El sistema se encuentra bloqueado. Por favor, active una licencia válida."
                                        className="mt-2 w-full justify-content-start"
                                    />
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                {((estado?.estado || 'demo') === 'demo' || estado?.estado === 'bloqueado') && (
                    <div className="col-12 md:col-6">
                        <Card title="Activar Licencia" className="shadow-2">
                            <div className="flex flex-column gap-4">
                                {(estado?.estado || 'demo') === 'demo' && (
                                    <Message
                                        severity="info"
                                        text="Sistema en modo demo. Ingrese su código de activación o active en línea."
                                        className="w-full justify-content-start"
                                    />
                                )}

                                <div className="border-bottom-1 surface-border pb-3">
                                    <h4 className="m-0 mb-3 text-900">Activación Rápida</h4>
                                    <Button
                                        label="Activar en línea"
                                        icon="pi pi-globe"
                                        onClick={handleActivarOnline}
                                        loading={onlineLoading}
                                        disabled={submitting}
                                        className="p-button-outlined p-button-success w-full"
                                    />
                                </div>

                                <div className="flex flex-column gap-2 mt-2">
                                    <h4 className="m-0 mb-1 text-900">Activación Manual</h4>
                                    <label htmlFor="codigoLicencia" className="font-medium">Código de Licencia</label>
                                    <div className="p-inputgroup">
                                        <span className="p-inputgroup-addon">
                                            <i className="pi pi-key"></i>
                                        </span>
                                        <InputText
                                            id="codigoLicencia"
                                            value={codigo}
                                            onChange={(e) => setCodigo(e.target.value)}
                                            placeholder="XXXX-XXXX-XXXX-XXXX"
                                            disabled={submitting || onlineLoading}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                <Button
                                    label="Activar Licencia Manualmente"
                                    icon="pi pi-check-circle"
                                    onClick={handleActivar}
                                    loading={submitting}
                                    disabled={onlineLoading}
                                    className="p-button-primary w-full"
                                />
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LicenciaPage;
