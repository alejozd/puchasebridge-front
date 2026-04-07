import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LicenciaEstado } from '../types/licencia';
import { logStore } from '@/utils/logger';

interface LicenciaState {
  licencia: LicenciaEstado | null;
  ultimaValidacion: number | null;
  existeEnServidor: boolean | null;
  setLicencia: (licencia: LicenciaEstado | null) => void;
  setExisteEnServidor: (existe: boolean) => void;
  clearLicencia: () => void;
  reset: () => void;
}

const initialState = {
  licencia: null,
  ultimaValidacion: null,
  existeEnServidor: null,
};

export const useLicenciaStore = create<LicenciaState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setLicencia: (licencia: LicenciaEstado | null) => {
        logStore('Estableciendo licencia', licencia);
        set({ 
          licencia, 
          ultimaValidacion: Date.now(),
          existeEnServidor: licencia !== null 
        });
      },
      
      setExisteEnServidor: (existe: boolean) => {
        logStore(`Existe en servidor: ${existe}`);
        set({ existeEnServidor: existe });
      },
      
      clearLicencia: () => {
        logStore('Limpiando datos locales de licencia');
        set({ licencia: null, ultimaValidacion: null });
      },
      
      reset: () => {
        logStore('Reset completo del store');
        set(initialState);
      },
    }),
    {
      name: 'licencia-storage',
      partialize: (state) => ({
        licencia: state.licencia,
        ultimaValidacion: state.ultimaValidacion,
        existeEnServidor: state.existeEnServidor,
      }),
    }
  )
);
