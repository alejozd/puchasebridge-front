import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import removeConsole from 'vite-plugin-remove-console'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Elimina console.log, console.debug, console.info en producción
    // Mantiene console.warn y console.error para monitoreo de errores
    removeConsole({
      exclude: ['warn', 'error'],
    }),
  ],
  server: {
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
})
