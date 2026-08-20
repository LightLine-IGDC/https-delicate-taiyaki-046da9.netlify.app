/* ============================================================
 *  种子脚本：把 public/js 里的默认内容一次性导入 Supabase
 *
 *  用法（在仓库根目录执行，先安装 admin-app 依赖）：
 *    $env:SUPABASE_URL="https://xxx.supabase.co"
 *    $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # Project Settings → API → service_role
 *    node admin-app/scripts/seed.mjs
 *
 *  会做两件事：
 *    1) 把 articles.js 的 5 篇默认文章写入 articles 表（Markdown + 预渲染 HTML）
 *    2) 把 content.js 的站点信息 + 7 个模块写入 content 表（并重写文章引用 id）
 * ============================================================ */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import MarkdownIt from 'markdown-it'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('请先设置环境变量 SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

function loadWindow(rel) {
  const code = readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
  const win = {}
  // content.js / articles.js 都是纯 `window.XXX = {...}`，无 DOM 依赖
  new Function('window', code)(win)
  return win
}

const dataWin = loadWindow('../../public/js/content.js')
const artWin = loadWindow('../../public/js/articles.js')
const content = dataWin.CLUB_DATA
const articles = artWin.CLUB_ARTICLES

function blocksToMarkdown(blocks) {
  return (blocks || [])
    .map((b) => {
      if (b.t === 'h') return '## ' + b.text
      if (b.t === 'code') return '```\n' + b.text + '\n```'
      return b.text
    })
    .join('\n\n')
}

const idMap = {}

for (const [slug, a] of Object.entries(articles)) {
  const card = (content.knowledge || []).find((k) => k.articleId === slug)
  const bodyMd = blocksToMarkdown(a.body)
  const { data, error } = await supabase
    .from('articles')
    .insert({
      slug,
      title: a.title || '',
      category: a.category || '',
      author: a.author || '',
      date: a.date || '',
      summary: card?.desc || '',
      tags: card?.tags || [],
      cover: '',
      body_md: bodyMd,
      body_html: md.render(bodyMd),
    })
    .select('id')
    .single()
  if (error) {
    console.error('✗ 文章插入失败', slug, error.message)
    continue
  }
  idMap[slug] = data.id
  console.log('✓ 文章', slug, '→', data.id)
}

// 重写知识库 / 分享里的文章引用
for (const k of content.knowledge || []) {
  if (k.articleId && idMap[k.articleId]) k.articleId = idMap[k.articleId]
}
for (const s of content.shares || []) {
  if (s.articleId && idMap[s.articleId]) s.articleId = idMap[s.articleId]
}

const { error } = await supabase.from('content').upsert({ id: 'main', data: content }, { onConflict: 'id' })
if (error) {
  console.error('✗ 内容保存失败', error.message)
  process.exit(1)
}
console.log('✓ 内容已写入 content 表（站点信息 + 7 个模块，共 ' + content.timeline.length + ' 条时间线等）')
