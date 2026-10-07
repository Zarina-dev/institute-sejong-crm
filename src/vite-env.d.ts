/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the NestJS API, e.g. http://localhost:3000/api */
  readonly VITE_API_BASE_URL?: string
  /** Public address of the Cloudflare R2 bucket holding images and videos (the API's R2_PUBLIC_URL). */
  readonly VITE_MEDIA_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
