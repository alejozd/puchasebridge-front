import React from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import "../styles/layout.css";

const MainLayout: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const usuario = useAuthStore((state) => state.usuario);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { label: "Panel de Control", icon: "pi pi-th-large", to: "/app" },
    { label: "Bandeja XML", icon: "pi pi-file-import", to: "/app/xml" },
    { label: "Homologación", icon: "pi pi-share-alt", to: "/app/homologacion" },
    { label: "Procesamiento", icon: "pi pi-cog", to: "/app/procesamiento" },
  ];

  const footerMenuItems = [
    { label: "Configuración", icon: "pi pi-cog", to: "/app/settings" },
    { label: "Soporte", icon: "pi pi-question-circle", to: "/app/support" },
  ];

  const isActive = (path: string) => {
    if (path === "/app") {
      return location.pathname === "/app" || location.pathname === "/app/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="layout-wrapper">
      <aside className="layout-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <i className="pi pi-link" style={{ fontSize: '1.2rem' }}></i>
          </div>
          <div className="sidebar-logo-text">
            <h1>PurchaseBridge</h1>
            <p>ERP Precision</p>
          </div>
        </div>

        <button className="btn-new-entry">
          <i className="pi pi-plus"></i>
          <span>Nueva Entrada</span>
        </button>

        <nav className="layout-menu">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`menu-item ${isActive(item.to) ? "active" : ""}`}
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
              className={`menu-item ${isActive(item.to) ? "active" : ""}`}
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
