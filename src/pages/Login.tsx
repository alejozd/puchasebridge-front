import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import "../styles/login.css";
import { logUnknownError, handleResponse, BASE_URL } from "../utils/apiHandler";
import { logger } from "../utils/logger";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          usuario: username,
          clave: password,
        }),
      });

      const data = await handleResponse(response);

      const { usuario, empresa, token } = data;
      login(usuario, empresa, token);
      navigate("/app");
    } catch (err: unknown) {
      if (err instanceof Error) {
        // No mostrar logs de error en consola para bloqueo por licencia
        if (err.message === "LICENCIA_EXPIRADA") {
          setError("El sistema está bloqueado por licencia expirada. Por favor active una licencia.");
        } else {
          console.error(err.message);
          setError(err.message);
        }
      } else {
        console.error("Error desconocido", err);
        setError("Ocurrió un error inesperado");
      }
      // Solo loguear errores que no sean de licencia
      if (!(err instanceof Error) || err.message !== "LICENCIA_EXPIRADA") {
        logUnknownError(err, logger.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card-container">
        {/* Brand Narrative Side */}
        <div className="brand-side">
          <div className="brand-header">
            <div className="brand-logo-container">
              <span className="material-symbols-outlined brand-logo-icon">
                account_balance
              </span>
              <span className="brand-name">PurchaseBridge</span>
            </div>
            <h1 className="brand-headline">
              Importación y escaneo de facturas.
            </h1>
            <p className="brand-description">
              Optimice su flujo de trabajo con nuestra avanzada tecnología de
              procesamiento de documentos.
            </p>
          </div>
          <div className="brand-footer">
            <p className="copyright">
              © 2026 ZambranoSoft - Sistema lectura XML | v0.1.0
            </p>
          </div>
        </div>

        {/* Login Form Side */}
        <div className="form-side">
          <div className="mobile-brand-header">
            <span className="material-symbols-outlined mobile-logo-icon">
              account_balance
            </span>
            <span className="mobile-brand-name">PurchaseBridge</span>
          </div>

          <div className="form-header">
            <h2 className="form-title">Bienvenido de nuevo</h2>
            <p className="form-subtitle">
              Ingrese sus credenciales para acceder al sistema.
            </p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {/* Field: Username */}
            <div className="form-field">
              <label htmlFor="username" className="field-label">
                Nombre de usuario
              </label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">
                  person
                </span>
                <InputText
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario"
                  required
                  className="login-input"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="form-field">
              <label htmlFor="password" className="field-label">
                Contraseña
              </label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">
                  lock
                </span>
                <Password
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  feedback={false}
                  toggleMask
                  required
                  className="login-input"
                />
              </div>
            </div>

            {error && (
              <Message severity="error" text={error} className="error-msg" />
            )}

            {/* Action Button */}
            <Button type="submit" loading={loading} className="submit-button">
              <span>Ingresar</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Decorative Minimalist Background Elements */}
      <div className="background-decor">
        <div className="decor-circle decor-top"></div>
        <div className="decor-circle decor-bottom"></div>
      </div>
    </div>
  );
};

export default Login;
