import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || ''
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase: SupabaseClient = createClient(url, anon)

/** 是否已配置 Supabase（用于给出友好提示） */
export function isConfigured(): boolean {
  return !!url && !!anon && url.includes('.supabase.co')
}
