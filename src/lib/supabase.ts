import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Client Supabase, ou null si les variables d'env ne sont pas configurées :
 * l'app fonctionne alors en mode 100 % local (M0), sans compte ni sync.
 */
export const supabase: SupabaseClient<Database> | null =
  url !== undefined && url !== '' && anonKey !== undefined && anonKey !== ''
    ? createClient<Database>(url, anonKey)
    : null
