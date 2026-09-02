import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const runtimeConfig = window.SUPABASE_CONFIG || {}
const url = import.meta.env.VITE_SUPABASE_URL || runtimeConfig.url || ''
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || runtimeConfig.anonKey || ''

const client: SupabaseClient | null = isConfigured() ? createClient(url, anon) : null

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!client) {
      throw new Error('未配置 Supabase：请设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY 后重新构建。')
    }
    return client[prop as keyof SupabaseClient]
  },
})

/** 是否已配置 Supabase（用于给出友好提示） */
export function isConfigured(): boolean {
  return !!url && !!anon && url.includes('.supabase.co')
}
