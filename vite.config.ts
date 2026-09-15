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
  },
  build: {
    sourcemap: true,
    // Ant Design alone is ~950 kB raw / ~300 kB gzipped and is deliberately
    // isolated in its own long-lived chunk below, so the default 500 kB
    // warning would fire on every build with nothing to act on.
    chunkSizeWarningLimit: 1100,
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
