import { supabase } from '@/lib/supabase'
import type { MediaItem } from '@/types'

const BUCKET = 'media'

export async function uploadMedia(file: File): Promise<MediaItem> {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const base = (file.name || 'image')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40)
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base}.${ext}`

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (upErr) throw upErr

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { data, error } = await supabase
    .from('media')
    .insert({
      name: file.name,
      storage_path: path,
      public_url: pub.publicUrl,
      size: file.size,
      mime: file.type,
    })
    .select()
    .single()
  if (error) throw error
  return data as MediaItem
}

export async function listMedia(): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as MediaItem[]) ?? []
}

export async function deleteMedia(item: MediaItem): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([item.storage_path])
  if (error) throw error
  await supabase.from('media').delete().eq('id', item.id)
}
