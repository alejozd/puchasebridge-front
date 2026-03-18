export interface User {
  id: number;
  username: string;
  nombre: string;
  email: string;
}

export interface Company {
  id: number;
  nombre: string;
}

import { create } from "zustand";

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
