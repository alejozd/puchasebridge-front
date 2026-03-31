import { create } from "zustand";

export interface User {
  codigo: number;
  nombre: string;
}

export interface Company {
  codigo: number;
  nombre: string;
  identidad: string;
  anoActual: number;
  tarifaReteCree: number;
}

interface AuthState {
  usuario: User | null;
  empresa: Company | null;
  token: string | null;
  sessionExpired: boolean;
  login: (usuario: User, empresa: Company, token: string) => void;
  logout: () => void;
  setSessionExpired: (expired: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  empresa: null,
  token: localStorage.getItem("token"),
  sessionExpired: false,
  login: (usuario, empresa, token) => {
    localStorage.setItem("token", token);
    set({ usuario, empresa, token, sessionExpired: false });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ usuario: null, empresa: null, token: null, sessionExpired: false });
  },
  setSessionExpired: (expired) => set({ sessionExpired: expired }),
}));
