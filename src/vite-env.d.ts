/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL du projet Supabase — absente = mode 100 % local. */
  readonly VITE_SUPABASE_URL?: string
  /** Clé publique (anon/publishable) Supabase. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
