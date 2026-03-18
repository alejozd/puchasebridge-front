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
  login: (usuario: User, empresa: Company, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  empresa: null,
  token: localStorage.getItem("token"),
  login: (usuario, empresa, token) => {
    localStorage.setItem("token", token);
    set({ usuario, empresa, token });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ usuario: null, empresa: null, token: null });
  },
}));
