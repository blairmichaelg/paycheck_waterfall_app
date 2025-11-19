/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_OBSERVABILITY?: string
  readonly VITE_ANALYTICS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
