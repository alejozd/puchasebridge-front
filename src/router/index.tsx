import { Navigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import XMLListPage from "../pages/xml/XMLListPage";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/app",
    element: <ProtectedRoute />,
    children: [
      {
        path: "",
        element: <MainLayout />,
        children: [
          {
            path: "",
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "xml",
            element: <XMLListPage />,
          },
          {
            path: "validacion",
            element: <div>Validación (Proximamente)</div>,
          },
          {
            path: "homologacion",
            element: <div>Homologación (Proximamente)</div>,
          },
          {
            path: "procesamiento",
            element: <div>Procesamiento (Proximamente)</div>,
          },
          {
            path: "configuracion",
            element: <div>Configuración (Proximamente)</div>,
          },
        ],
      },
    ],
  },
  {
    path: "/",
    element: <Navigate to="/app" replace />,
  },
]);
