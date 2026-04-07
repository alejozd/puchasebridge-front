import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LicenciaEstado } from '../types/licencia';
import { logStore, logger } from '../utils/logger';

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
        logStore('SET_LICENCIA', licencia);
        set({ 
          licencia, 
          ultimaValidacion: Date.now(),
          existeEnServidor: licencia !== null 
        });
      },
      
      setExisteEnServidor: (existe: boolean) => {
        logger.info(`[LICENCIA STORE] Existe en servidor: ${existe}`, 'LicenciaStore');
        set({ existeEnServidor: existe });
      },
      
      clearLicencia: () => {
        logger.info('[LICENCIA STORE] Limpiando datos locales de licencia', 'LicenciaStore');
        set({ licencia: null, ultimaValidacion: null });
      },
      
      reset: () => {
        logger.info('[LICENCIA STORE] Reset completo del store', 'LicenciaStore');
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
