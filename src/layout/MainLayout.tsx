import React, { useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Tooltip } from "primereact/tooltip";
import "../styles/layout.css";

const MainLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const usuario = useAuthStore((state) => state.usuario);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { label: "Dashboard", icon: "pi pi-th-large", to: "/app/dashboard" },
    { label: "Bandeja de XML", icon: "pi pi-file-import", to: "/app/xml" },
    { label: "Validación", icon: "pi pi-check-square", to: "/app/validacion" },
    { label: "Homologación", icon: "pi pi-share-alt", to: "/app/homologacion" },
    { label: "Procesamiento", icon: "pi pi-cog", to: "/app/procesamiento" },
  ];

  const footerMenuItems = [
    { label: "Configuración", icon: "pi pi-cog", to: "/app/configuracion" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`layout-wrapper ${isCollapsed ? "collapsed" : ""}`}>
      <Tooltip target=".menu-item-tooltip" position="right" />
      <aside className="layout-sidebar">
        <div className="sidebar-header">
          <button
            className="btn-toggle-sidebar"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expandir" : "Colapsar"}
          >
            <div className="sidebar-logo-icon">
              <i className={`pi ${isCollapsed ? "pi-bars" : "pi-align-left"}`} style={{ fontSize: '1.2rem' }}></i>
            </div>
          </button>
          <div className="sidebar-logo-text">
            <h1>PurchaseBridge</h1>
            <p>ERP Precision</p>
          </div>
        </div>

        <button className="btn-new-entry" title={isCollapsed ? "Nueva Entrada" : ""}>
          <i className="pi pi-plus"></i>
          <span>Nueva Entrada</span>
        </button>

        <nav className="layout-menu">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`menu-item ${isActive(item.to) ? "active" : ""} ${isCollapsed ? "menu-item-tooltip" : ""}`}
              data-pr-tooltip={isCollapsed ? item.label : ""}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {footerMenuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`menu-item ${isActive(item.to) ? "active" : ""} ${isCollapsed ? "menu-item-tooltip" : ""}`}
              data-pr-tooltip={isCollapsed ? item.label : ""}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="sidebar-info">
            <div className="company">ZambranoSoft</div>
            <div className="date">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
            <div className="version">v0.0.0</div>
          </div>
        </div>
      </aside>

      <div className="layout-main-container">
        <header className="layout-topbar">
          <div className="topbar-left">
          </div>
          <div className="topbar-right">
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="user-info" style={{ textAlign: 'right' }}>
                <span className="name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600 }}>{usuario?.nombre || "ADMINISTRADOR"}</span>
                <span className="role" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>ADMIN</span>
              </div>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3DGRkht9ozWaKYPbp55fmeoeovFCkw1KxEpJnGIEAVzWlqYY__Oxdl2dvSYxDKKhg2joEImCho1Q_CF8SWj-y79aX8Up8ObKweThRfp0d3yCzxLiFbB8aSr9o-6vWd_XVxUnxYtn41G8n1YAcbOWGGKbcXj0OXlVlZS5Fsgdb0auslApJALRnMUyMO7ddxRyWyR9IcrRLe7S6YmutEz4aYlpy4bpmr7UTcP9vaH09jwdeiL-dxIRTqC6eh4mJh3uCToCuizMW1Drt"
                alt="User"
                className="user-avatar"
                style={{ width: '2.5rem', height: '2.5rem' }}
              />
            </div>
            <button className="btn-logout" onClick={handleLogout} title="Cerrar Sesión">
              <i className="pi pi-sign-out"></i>
            </button>
          </div>
        </header>

        <main className="layout-main" style={{ display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
