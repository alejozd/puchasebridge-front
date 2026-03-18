import React from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Button } from "primereact/button";
import "../styles/layout.css";

const MainLayout: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const usuario = useAuthStore((state) => state.usuario);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { label: "Bandeja XML", icon: "pi pi-file", to: "/app/xml" },
    { label: "Homologación", icon: "pi pi-sync", to: "/app/homologacion" },
    { label: "Procesamiento", icon: "pi pi-cog", to: "/app/procesamiento" },
  ];

  return (
    <div className="layout-wrapper">
      <div className="layout-topbar">
        <div className="topbar-left">
          <span className="topbar-logo">PurchaseBridge</span>
        </div>
        <div className="topbar-right">
          <span className="user-name">
            {usuario?.nombre || "Usuario Demo"}
          </span>
          <Button
            icon="pi pi-sign-out"
            rounded
            text
            severity="danger"
            onClick={handleLogout}
            tooltip="Cerrar Sesión"
          />
        </div>
      </div>

      <div className="layout-sidebar">
        <ul className="layout-menu">
          {menuItems.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="menu-item">
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="layout-main-container">
        <div className="layout-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
