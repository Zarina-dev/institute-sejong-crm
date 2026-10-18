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
      // jspdf ships an optional html2canvas; the minutes export already uses
      // html2canvas-pro, so the bundle carries one canvas library, not two.
      html2canvas: 'html2canvas-pro',
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
    // The rich-text editor and the document exporters (docx, jspdf) are each
    // ~400 kB, loaded only by the admin when used; the warning would fire on
    // them with nothing to act on.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // React and its routing/data libraries change rarely: one long-cached
        // chunk. Ant Design is left to Rollup, so a page loads only the
        // components it uses rather than one ~1 MB bundle of all of them.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
        },
      },
    },
  },
})
