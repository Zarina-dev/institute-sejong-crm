import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Opens the connections to the API and to the R2 media bucket while the
 * browser is still reading the HTML: DNS + TCP + TLS is ~230 ms from
 * Kyrgyzstan, and otherwise it starts only when the first request is made.
 * Built from the same env vars the app uses, so no address is written twice.
 * The API is read with fetch (CORS: `crossorigin`); images are plain <img>
 * (no CORS), which use a separate connection pool, hence no attribute there.
 */
function preconnectOrigins(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const origin = (value?: string) => {
    try {
      return value ? new URL(value).origin : null
    } catch {
      return null // relative (/api) or unset: same origin, nothing to connect to
    }
  }
  const api = origin(env.VITE_API_BASE_URL)
  const media = origin(env.VITE_MEDIA_BASE_URL)

  return {
    name: 'preconnect-origins',
    transformIndexHtml: () => [
      ...(api ? [{ tag: 'link', attrs: { rel: 'preconnect', href: api, crossorigin: '' }, injectTo: 'head-prepend' as const }] : []),
      ...(media && media !== api ? [{ tag: 'link', attrs: { rel: 'preconnect', href: media }, injectTo: 'head-prepend' as const }] : []),
    ],
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), preconnectOrigins(mode)],
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
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
}))
