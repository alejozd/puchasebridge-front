import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useLicenciaStore } from "../store/licenciaStore";

export const ProtectedRoute = () => {
  const token = useAuthStore((state) => state.token);
  const licencia = useLicenciaStore((state) => state.licencia);
  const location = useLocation();

  // Si no hay token, redirigir a login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si la licencia está bloqueada y no estamos ya en la página de licencia, redirigir
  if (licencia?.estado === 'bloqueado' && location.pathname !== '/app/licencia') {
    return <Navigate to="/app/licencia" replace />;
  }

  return <Outlet />;
};
