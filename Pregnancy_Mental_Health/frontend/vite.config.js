/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // 👇 ADD THIS BLOCK
  server: {
    host: true,
    allowedHosts: ['localhost', '127.0.0.1', '.ngrok-free.app', '.ngrok-free.dev'],
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          recharts: ['recharts'],
          pdf: ['jspdf']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.test.{js,jsx}',
        'vite.config.js'
      ]
    }
  }
})