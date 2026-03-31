import { useAuthStore } from "../store/authStore";

export const BASE_URL = "http://localhost:9000";

export const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem("token");
    if (window.location.pathname !== "/login") {
      useAuthStore.getState().setSessionExpired(true);
    }
    throw new Error("Sesión expirada");
  }

  if (!response.ok) {
    let errorMessage = "Error en la petición";

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.mensaje || errorMessage;
    } catch {
      // respuesta no es JSON
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

export const logUnknownError = (
  error: unknown,
  log: (message?: unknown, ...optionalParams: unknown[]) => void,
) => {
  if (error instanceof Error) {
    log(error.message);
    return;
  }

  log("Error desconocido", error);
};
