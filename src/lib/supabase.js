import { createClient } from '@supabase/supabase-js'
import { demoSupabase } from './demoSupabase'

// `?demo` nur im Dev-Server: In-Memory-Daten statt echter Datenbank
export const IS_DEMO = import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo')

export const supabase = IS_DEMO
  ? demoSupabase
  : createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
