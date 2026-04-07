import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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