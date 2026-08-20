import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

const md: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  highlight(str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const { value } = hljs.highlight(str, { language: lang, ignoreIllegals: true })
        return `<pre class="hljs"><code>${value}</code></pre>`
      } catch {
        /* fallthrough */
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  },
})

/** Markdown → 安全 HTML（存储前调用，前台直接渲染该结果） */
export function renderMarkdown(src: string): string {
  const html = md.render(src || '')
  return DOMPurify.sanitize(html)
}
