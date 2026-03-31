import React from "react";
import { Button } from "primereact/button";

interface Props {
  visible: boolean;
  onReload: () => void;
}

const SessionExpiredOverlay: React.FC<Props> = ({ visible, onReload }) => {
  if (!visible) return null;

  return (
    <div className="session-overlay">
      <div className="session-modal">
        <i className="pi pi-exclamation-triangle session-icon"></i>
        <h2>Sesión expirada</h2>
        <p>
          Tu sesión ha expirado o el servidor no está disponible.
          Por favor recarga la aplicación.
        </p>
        <Button label="Recargar" icon="pi pi-refresh" onClick={onReload} />
      </div>
    </div>
  );
};

export default SessionExpiredOverlay;
