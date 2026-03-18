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
    { label: "Dashboard", icon: "pi pi-th-large", to: "/app" },
    { label: "Bandeja XML", icon: "pi pi-file-import", to: "/app/xml" },
    { label: "Homologación", icon: "pi pi-share-alt", to: "/app/homologacion" },
    { label: "Procesamiento", icon: "pi pi-cog", to: "/app/procesamiento" },
  ];

  const footerMenuItems = [
    { label: "Settings", icon: "pi pi-cog", to: "/app/settings" },
    { label: "Support", icon: "pi pi-question-circle", to: "/app/support" },
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
          <span>New Entry</span>
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

          <div className="user-profile" onClick={handleLogout} style={{ cursor: 'pointer' }}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3DGRkht9ozWaKYPbp55fmeoeovFCkw1KxEpJnGIEAVzWlqYY__Oxdl2dvSYxDKKhg2joEImCho1Q_CF8SWj-y79aX8Up8ObKweThRfp0d3yCzxLiFbB8aSr9o-6vWd_XVxUnxYtn41G8n1YAcbOWGGKbcXj0OXlVlZS5Fsgdb0auslApJALRnMUyMO7ddxRyWyR9IcrRLe7S6YmutEz4aYlpy4bpmr7UTcP9vaH09jwdeiL-dxIRTqC6eh4mJh3uCToCuizMW1Drt"
              alt="User"
              className="user-avatar"
            />
            <div className="user-info">
              <span className="name">{usuario?.nombre || "Alex Rivera"}</span>
              <span className="role">Admin</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="layout-main-container">
        <header className="layout-topbar">
          <div className="topbar-left">
            <div className="topbar-search">
              <i className="pi pi-search"></i>
              <input type="text" placeholder="Search invoices, XMLs, or partners..." />
            </div>
            <nav className="topbar-nav">
              <Link to="/app" className={isActive("/app") ? "active" : ""}>Dashboard</Link>
              <Link to="/app/reports">Reports</Link>
              <Link to="/app/history">History</Link>
            </nav>
          </div>
          <div className="topbar-right">
            <button className="topbar-icon-btn">
              <i className="pi pi-bell"></i>
              <span className="notification-badge"></span>
            </button>
            <button className="topbar-icon-btn">
              <i className="pi pi-question-circle"></i>
            </button>
            <div className="divider-v"></div>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvl0UXF4rWTFhTsbbOEmAA_qdzXUAysSMcKda24H85IHCSgXdfAJCRv2fccTDHtalmkS8u8aqZbPM2F1fV0c3OHuSh9OUNSaNWi65YMDp2ZiWN4OgDjyQ4W8uq9PlW026RDHXJ_FdPeahS1uGcmebT9IClukwDjXYnHBjpdDLp-KFBFH9xZ-zfvIx1I-fx5Hb1eqQu1nQB1TtgpW6ETNdqMz4eqb_S57YpsngsmewiOv_Gk0SDRZhAyI5bR-Hw0loBnphUv6f3SyB-"
              alt="Profile"
              className="user-avatar"
              style={{ cursor: 'pointer' }}
            />
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
