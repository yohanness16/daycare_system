import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dotenv from 'dotenv'

// Initialize dotenv environment configuration
dotenv.config()

const backendUrl = process.env.VITE_API_BASE_URL || 'http://localhost:5107'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3001,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

