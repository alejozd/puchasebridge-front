import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import removeConsole from 'vite-plugin-remove-console'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    // Elimina console.log, console.debug, console.info en producción
    // Mantiene console.warn y console.error para monitoreo de errores
    removeConsole()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',  // <--- MUY IMPORTANTE: Debe ser '/'
  build: {
    outDir: 'dist',
  },
  server: {
    // Esto es solo para tu desarrollo local, no afecta al build final
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      }
    }
  }
})