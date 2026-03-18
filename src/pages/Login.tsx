import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Message } from "primereact/message";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuthStore } from "../store/authStore";
import { AxiosError } from "axios";
import "../styles/login.css";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosClient.post(
        "/auth/login",
        {
          usuario: username,
          clave: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      const { usuario, empresa, token } = response.data;
      login(usuario, empresa, token);
      navigate("/app");
    } catch (err: unknown) {
      let errorMessage = "Error al iniciar sesión";
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
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
              Financial <br />
              Precision & <br />
              Editorial Clarity.
            </h1>
            <p className="brand-description">
              Bridging the gap between raw XML data and architectural ledger
              accuracy. Experience the new standard in ERP synchronization.
            </p>
          </div>
          <div className="brand-footer">
            <div className="security-badge">
              <span className="material-symbols-outlined">security</span>
              <div>
                <p className="security-title">Enterprise Grade Security</p>
                <p className="security-subtitle">
                  Multi-factor authentication and end-to-end encryption active.
                </p>
              </div>
            </div>
            <p className="copyright">
              © 2024 PurchaseBridge ERP Precision System
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
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">
              Enter your credentials to access the ledger.
            </p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {/* Field: Username/Email */}
            <div className="form-field">
              <label htmlFor="username" className="field-label">
                Username or Email
              </label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">
                  alternate_email
                </span>
                <InputText
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="login-input"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="form-field">
              <div className="label-row">
                <label htmlFor="password" className="field-label">
                  Password
                </label>
                <a href="#" className="forgot-password">
                  Forgot Password?
                </a>
              </div>
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

            {/* Remember Me */}
            <div className="remember-me">
              <Checkbox
                inputId="remember"
                checked={remember}
                onChange={(e) => setRemember(e.checked || false)}
                className="remember-checkbox"
              />
              <label htmlFor="remember" className="remember-label">
                Stay logged in for 30 days
              </label>
            </div>

            {error && (
              <Message severity="error" text={error} className="error-msg" />
            )}

            {/* Action Button */}
            <Button
              type="submit"
              loading={loading}
              className="submit-button"
            >
              <span>Sign In to PurchaseBridge</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Button>
          </form>

          {/* Footer / Support */}
          <div className="form-footer">
            <div className="footer-links">
              <a href="#" className="footer-link">
                Privacy Policy
              </a>
              <a href="#" className="footer-link">
                Support
              </a>
            </div>
            <div className="secure-badge">
              <span className="material-symbols-outlined secure-icon">
                verified_user
              </span>
              <span className="secure-text">Secure Link</span>
            </div>
          </div>
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
