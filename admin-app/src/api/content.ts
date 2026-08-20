import { supabase } from '@/lib/supabase'
import type { SiteContent } from '@/types'

export const CONTENT_ID = 'main'

export async function loadContent(): Promise<SiteContent | null> {
  const { data, error } = await supabase
    .from('content')
    .select('data')
    .eq('id', CONTENT_ID)
    .maybeSingle()
  if (error) throw error
  return (data?.data as SiteContent) ?? null
}

export async function saveContent(content: SiteContent): Promise<void> {
  const { error } = await supabase
    .from('content')
    .upsert({ id: CONTENT_ID, data: content }, { onConflict: 'id' })
  if (error) throw error
}
