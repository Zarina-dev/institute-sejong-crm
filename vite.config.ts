import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // tsconfig.app.json already declares this path mapping, but Vite had no
      // matching alias — so any `@/...` import type-checked and then failed
      // to resolve at build time.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    /**
     * `npm run preview` doubles as the demo server: built with
     * `VITE_API_BASE_URL=/api`, the site, the API and the uploaded files all
     * answer on one origin, so a single tunnel URL is enough to show the
     * whole thing. `allowedHosts` lets that tunnel's hostname through.
     */
    allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok-free.app'],
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: {
    sourcemap: true,
    // Ant Design alone is ~950 kB raw / ~300 kB gzipped and is deliberately
    // isolated in its own long-lived chunk below, so the default 500 kB
    // warning would fire on every build with nothing to act on.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Keep the large, rarely-changing vendor code in its own chunk so a
        // change to app code does not invalidate it in the browser cache.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          antd: ['antd', '@ant-design/icons'],
        },
      },
    },
  },
})
