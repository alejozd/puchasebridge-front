import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuthStore } from "../store/authStore";
import { AxiosError } from "axios";
import "../styles/login.css";

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
    <div className="login-container">
      <Card title="PurchaseBridge Login" className="login-card">
        <form onSubmit={handleLogin} className="flex flex-column gap-3">
          <div className="flex flex-column gap-2">
            <label htmlFor="username">Usuario</label>
            <InputText
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="password">Contraseña</label>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              feedback={false}
              toggleMask
              required
            />
          </div>
          {error && (
            <Message severity="error" text={error} className="mt-2 w-full" />
          )}
          <Button
            label="Iniciar Sesión"
            icon="pi pi-sign-in"
            type="submit"
            loading={loading}
            className="mt-4"
          />
        </form>
      </Card>
    </div>
  );
};

export default Login;
