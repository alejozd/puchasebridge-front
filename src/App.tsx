import { useEffect, useRef } from "react";
import { router } from "./router";
import { RouterProvider } from "react-router-dom";
import { Toast } from "primereact/toast";
import { useAuthStore } from "./store/authStore";
import SessionExpiredOverlay from "./components/common/SessionExpiredOverlay";
import "./App.css";

function App() {
  const toast = useRef<Toast>(null);
  const sessionExpired = useAuthStore((state) => state.sessionExpired);

  useEffect(() => {
    if (sessionExpired) {
      toast.current?.show({
        severity: "warn",
        summary: "Sesión expirada",
        detail: "Tu sesión ha expirado o el servidor no responde.",
        life: 4000,
      });
    }
  }, [sessionExpired]);

  return (
    <>
      <Toast ref={toast} />
      <RouterProvider router={router} />
      <SessionExpiredOverlay
        visible={sessionExpired}
        onReload={() => window.location.reload()}
      />
    </>
  );
}

export default App;
