import axios, { type AxiosError } from "axios";

type BackendErrorData = {
  message?: string;
  mensaje?: string;
  errores?: string[];
};

const isBackendErrorData = (data: unknown): data is BackendErrorData => {
  if (!data || typeof data !== "object") return false;
  return true;
};

export const extractErrorMessage = (
  error: unknown,
  fallback = "Error en la petición",
): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (isBackendErrorData(data)) {
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
      if (typeof data.mensaje === "string" && data.mensaje.trim()) {
        return data.mensaje;
      }
      if (Array.isArray(data.errores) && data.errores.length > 0) {
        return data.errores[0];
      }
    }
  }

  return fallback;
};

export const handleUnauthorized = () => {
  localStorage.removeItem("token");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

export const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  if (!response.ok) {
    let errorMessage = "Error en la petición";

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // respuesta no es JSON
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

export const normalizeAxiosError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) {
      handleUnauthorized();
      return new Error("Sesión expirada");
    }
  }

  return new Error(extractErrorMessage(error));
};

export const logUnknownError = (error: unknown, log: (message?: unknown, ...optionalParams: unknown[]) => void) => {
  if (error instanceof Error) {
    log(error.message);
    return;
  }

  log("Error desconocido", error);
};

export type { AxiosError };
