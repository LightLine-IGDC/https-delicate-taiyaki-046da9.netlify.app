/* 文章导入：Markdown 文件 / Word(.docx) 文件 / 链接 → Markdown 源文本 */
import TurndownService from 'turndown'
import mammoth from 'mammoth'

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' })

/** 读取 .md / .txt 文件文本 */
export async function importMarkdownFile(file: File): Promise<string> {
  return await file.text()
}

/** .docx → HTML → Markdown */
export async function importWordFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer: buf })
  return turndown.turndown(result.value)
}

/** 抓取网页正文 → Markdown（先直连，失败走公开 CORS 代理） */
export async function importFromLink(url: string): Promise<string> {
  const html = await fetchHtml(url)
  return htmlToMarkdown(html)
}

async function fetchHtml(url: string): Promise<string> {
  try {
    const r = await fetch(url, { redirect: 'follow' })
    if (r.ok) return await r.text()
  } catch {
    /* fallthrough to proxy */
  }
  const proxied = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url))
  if (!proxied.ok) throw new Error('链接抓取失败（目标站点可能禁止抓取）')
  return await proxied.text()
}

function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script, style, nav, header, footer, aside, noscript, iframe').forEach((n) => n.remove())
  const title = doc.querySelector('h1')?.textContent?.trim() || doc.title || ''
  const body = doc.body ? doc.body.innerHTML : html
  const md = turndown.turndown(body)
  return title ? `# ${title}\n\n${md}` : md
}
