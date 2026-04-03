import React, { useEffect, useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { getLicenciaEstado, registrarLicencia } from '../../services/licenciaService';
import type { LicenciaEstado } from '../../types/licencia';

const LicenciaPage: React.FC = () => {
    const [estado, setEstado] = useState<LicenciaEstado | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [codigo, setCodigo] = useState<string>('');
    const toast = useRef<Toast>(null);

    const fetchEstado = async () => {
        setLoading(true);
        try {
            const data = await getLicenciaEstado();
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

    const getEstadoSeverity = (estado?: string) => {
        switch (estado) {
            case 'activa': return 'success';
            case 'demo': return 'warning';
            case 'bloqueado': return 'danger';
            default: return 'info';
        }
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
                                        value={estado.estado.toUpperCase()}
                                        severity={getEstadoSeverity(estado.estado)}
                                        style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                                    />
                                </div>
                                <div className="flex align-items-center justify-content-between border-bottom-1 surface-border pb-2">
                                    <span className="font-semibold">Días restantes:</span>
                                    <span className={`text-xl font-bold ${estado.diasRestantes <= 5 ? 'text-red-500' : 'text-primary'}`}>
                                        {estado.diasRestantes} días
                                    </span>
                                </div>
                                <div className="flex align-items-center justify-content-between">
                                    <span className="font-semibold">Fecha de expiración:</span>
                                    <span>{new Date(estado.fechaExpiracion).toLocaleDateString()}</span>
                                </div>

                                {estado.diasRestantes <= 5 && estado.estado !== 'bloqueado' && (
                                    <Message
                                        severity="warn"
                                        text={`¡Atención! Su licencia expira en ${estado.diasRestantes} días.`}
                                        className="mt-2 w-full justify-content-start"
                                    />
                                )}

                                {estado.estado === 'bloqueado' && (
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

                {(estado?.estado === 'demo' || estado?.estado === 'bloqueado') && (
                    <div className="col-12 md:col-6">
                        <Card title="Activar Licencia" className="shadow-2">
                            <div className="flex flex-column gap-4">
                                {estado?.estado === 'demo' && (
                                    <Message
                                        severity="info"
                                        text="Sistema en modo demo. Ingrese su código de activación para habilitar todas las funciones."
                                        className="w-full justify-content-start"
                                    />
                                )}

                                <div className="flex flex-column gap-2">
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
                                            disabled={submitting}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                <Button
                                    label="Activar Licencia"
                                    icon="pi pi-check-circle"
                                    onClick={handleActivar}
                                    loading={submitting}
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
