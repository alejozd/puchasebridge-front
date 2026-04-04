import React, { useEffect, useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useLocation } from 'react-router-dom';
import { getLicenciaEstado, activarOnline } from '../../services/licenciaService';
import { useLicenciaStore } from '../../store/licenciaStore';
import type { LicenciaEstado } from '../../types/licencia';

const LicenciaPage: React.FC = () => {
    const [estado, setEstado] = useState<LicenciaEstado | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [onlineLoading, setOnlineLoading] = useState<boolean>(false);
    const toast = useRef<Toast>(null);
    const location = useLocation();
    
    // Clave para almacenar el mensaje de bloqueo en sessionStorage
    const LICENCIA_BLOQUEO_KEY = 'licencia_bloqueo_mensaje';
    
    // Obtener mensaje de redirección desde el estado de navegación o desde sessionStorage
    const getMensajeBloqueo = (): string | undefined => {
        // Primero intentar obtener del estado de navegación
        const mensajeFromState = location.state?.mensaje as string | undefined;
        
        // Si viene del estado de navegación, guardarlo en sessionStorage para persistencia
        if (mensajeFromState) {
            sessionStorage.setItem(LICENCIA_BLOQUEO_KEY, mensajeFromState);
            return mensajeFromState;
        }
        
        // Si no viene del estado, intentar obtener de sessionStorage (para recargas)
        return sessionStorage.getItem(LICENCIA_BLOQUEO_KEY) || undefined;
    };
    
    const mensajeBloqueo = getMensajeBloqueo();
    
    // Store de licencia
    const licenciaStore = useLicenciaStore();
    const existeEnServidor = useLicenciaStore(state => state.existeEnServidor);

    const crearLicenciaDemo = (): LicenciaEstado => {
        console.log("[LICENCIA] Creando nueva licencia demo");
        return {
            estado: 'demo',
            tipo_licencia: 'demo',
            dias_restantes: 30,
            expira: null,
            nit: '',
            instalacion_hash: `DEMO-${Date.now()}`
        };
    };

    const fetchEstado = async () => {
        setLoading(true);
        try {
            console.log("[LICENCIA] Intentando validación online obligatoria...");
            const data = await getLicenciaEstado();
            
            if (data === null) {
                // No existe licencia en servidor
                console.log("[LICENCIA] No existe licencia en servidor");
                console.log("[LICENCIA] Limpiando datos locales");
                licenciaStore.clearLicencia();
                
                console.log("[LICENCIA] Creando nueva licencia demo");
                const demoLicencia = crearLicenciaDemo();
                setEstado(demoLicencia);
                licenciaStore.setLicencia(demoLicencia);
                licenciaStore.setExisteEnServidor(false);
            } else {
                // Licencia válida obtenida del servidor
                console.log("[LICENCIA] Usando licencia del servidor");
                setEstado(data);
                licenciaStore.setLicencia(data);
                licenciaStore.setExisteEnServidor(true);
            }
        } catch (error: unknown) {
            console.error("[LICENCIA] Error en validación online:", error);
            
            // Solo permitir validación offline si ya existe licencia previamente sincronizada
            if (existeEnServidor === true && licenciaStore.licencia) {
                console.log("[LICENCIA] Usando licencia local (offline)");
                setEstado(licenciaStore.licencia);
            } else {
                console.log("[LICENCIA] No hay licencia local válida, creando demo");
                const demoLicencia = crearLicenciaDemo();
                setEstado(demoLicencia);
                licenciaStore.setLicencia(demoLicencia);
            }
            
            toast.current?.show({
                severity: 'warn',
                summary: 'Sin conexión',
                detail: 'No se pudo conectar con el servidor. Usando modo offline.',
                life: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEstado();
    }, []);

    // Limpiar el mensaje de bloqueo cuando la licencia se active exitosamente
    useEffect(() => {
        if (estado && estado.estado === 'activa' && mensajeBloqueo) {
            sessionStorage.removeItem(LICENCIA_BLOQUEO_KEY);
        }
    }, [estado, mensajeBloqueo]);

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
                <div className="col-12 md:col-8 md:col-offset-2">
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
                                        <span>{formatExpiracion(estado.expira ?? undefined)}</span>
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

                                {/* Mensajes claros según estado */}
                                {(estado.estado || 'demo') === 'demo' && (
                                    <Message
                                        severity="warn"
                                        text="Modo de prueba activo"
                                        className="mt-2 w-full justify-content-start"
                                    />
                                )}

                                {(estado.estado || 'demo') === 'activa' && (estado.tipo_licencia || 'demo') === 'anual' && (
                                    <Message
                                        severity="success"
                                        text="Licencia anual activa"
                                        className="mt-2 w-full justify-content-start"
                                    />
                                )}

                                {(estado.estado || 'demo') === 'activa' && (estado.tipo_licencia || 'demo') === 'permanente' && (
                                    <Message
                                        severity="success"
                                        text="Licencia permanente activa"
                                        className="mt-2 w-full justify-content-start"
                                    />
                                )}

                                {(estado.estado || 'demo') === 'activa' && (estado.tipo_licencia || 'demo') === 'demo' && (
                                    <Message
                                        severity="success"
                                        text="Su licencia está activa y funcionando correctamente."
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

                                {/* Mostrar mensaje de bloqueo por redirección desde Login */}
                                {mensajeBloqueo && (
                                    <Message
                                        severity="error"
                                        text={mensajeBloqueo}
                                        className="mt-2 w-full justify-content-start font-bold"
                                    />
                                )}

                                {/* Botón único de activación - solo visible en demo o bloqueado */}
                                {((estado.estado || 'demo') === 'demo' || (estado.estado || 'demo') === 'bloqueado') && (
                                    <div className="mt-3">
                                        <Button
                                            label="Activar licencia"
                                            icon="pi pi-globe"
                                            onClick={handleActivarOnline}
                                            loading={onlineLoading}
                                            className="p-button-primary w-full shadow-2"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LicenciaPage;
