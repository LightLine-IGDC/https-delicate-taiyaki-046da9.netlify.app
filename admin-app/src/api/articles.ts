import { supabase } from '@/lib/supabase'
import { renderMarkdown } from '@/lib/markdown'
import type { Article } from '@/types'

export async function listArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data as Article[]) ?? []
}

export async function getArticle(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Article) ?? null
}

export async function upsertArticle(article: Partial<Article>): Promise<Article> {
  const payload: Record<string, unknown> = {
    ...article,
    body_html: renderMarkdown(article.body_md || ''),
  }
  const { data, error } = await supabase
    .from('articles')
    .upsert(payload)
    .select()
    .single()
  if (error) throw error
  return data as Article
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw error
}

/** 依据标题生成一个用于路由/引用的英文 slug */
export function slugify(title: string): string {
  const s = (title || 'article').trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
  return s.replace(/^-+|-+$/g, '').slice(0, 80) || 'article'
}
