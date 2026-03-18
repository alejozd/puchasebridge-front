import { Navigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import Login from "../pages/Login";
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
            element: <div>Dashboard (Proximamente)</div>,
          },
          {
            path: "xml",
            element: <div>Bandeja XML (Proximamente)</div>,
          },
          {
            path: "homologacion",
            element: <div>Homologación (Proximamente)</div>,
          },
          {
            path: "procesamiento",
            element: <div>Procesamiento (Proximamente)</div>,
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
