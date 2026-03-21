import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

interface ValidationResultDialogProps {
    visible: boolean;
    onHide: () => void;
    fileName: string;
    errores?: string[];
    advertencias?: string[];
}

const ValidationResultDialog: React.FC<ValidationResultDialogProps> = ({
    visible,
    onHide,
    fileName,
    errores = [],
    advertencias = []
}) => {
    const hasIssues = errores.length > 0 || advertencias.length > 0;

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className={`pi ${errores.length > 0 ? 'pi-exclamation-triangle text-red-500' : 'pi-info-circle text-blue-500'}`} style={{ fontSize: '1.5rem' }}></i>
                    <div>
                        <h3 className="m-0">Resultado de Validación</h3>
                        <small className="text-secondary">{fileName}</small>
                    </div>
                </div>
            }
            visible={visible}
            onHide={onHide}
            style={{ width: '50vw', maxWidth: '600px' }}
            footer={
                <div className="flex justify-content-end">
                    <Button label="Cerrar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
                </div>
            }
            draggable={false}
            resizable={false}
        >
            {!hasIssues ? (
                <div className="text-center py-4">
                    <i className="pi pi-check-circle text-green-500 mb-3" style={{ fontSize: '3rem' }}></i>
                    <p className="m-0 text-xl font-medium">Validación Exitosa</p>
                    <p className="text-secondary">No se encontraron errores ni advertencias.</p>
                </div>
            ) : (
                <div className="flex flex-column gap-4">
                    {errores.length > 0 && (
                        <div>
                            <div className="flex align-items-center gap-2 text-red-600 font-bold mb-2">
                                <i className="pi pi-times-circle"></i>
                                <span>ERRORES ({errores.length})</span>
                            </div>
                            <ul className="m-0 pl-4 flex flex-column gap-2">
                                {errores.map((err, idx) => (
                                    <li key={idx} className="text-red-700">{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {advertencias.length > 0 && (
                        <div>
                            <div className="flex align-items-center gap-2 text-orange-600 font-bold mb-2">
                                <i className="pi pi-exclamation-circle"></i>
                                <span>ADVERTENCIAS ({advertencias.length})</span>
                            </div>
                            <ul className="m-0 pl-4 flex flex-column gap-2">
                                {advertencias.map((adv, idx) => (
                                    <li key={idx} className="text-orange-700">{adv}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </Dialog>
    );
};

export default ValidationResultDialog;
