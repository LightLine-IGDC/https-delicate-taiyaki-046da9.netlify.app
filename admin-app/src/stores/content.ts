import { defineStore } from 'pinia'
import { loadContent, saveContent } from '@/api/content'
import { defaultContent } from '@/config/modules'
import type { SiteContent } from '@/types'

export const useContentStore = defineStore('content', {
  state: () => ({
    content: null as SiteContent | null,
    loaded: false,
    saving: false,
  }),
  actions: {
    async load() {
      if (this.loaded) return
      const remote = await loadContent()
      const base = defaultContent() as unknown as SiteContent
      // 与默认结构浅合并：即使数据库内容不完整，也补齐缺失的顶层模块
      this.content = remote ? ({ ...base, ...remote } as SiteContent) : base
      this.loaded = true
    },
    async save() {
      if (!this.content) return
      this.saving = true
      try {
        await saveContent(this.content)
      } finally {
        this.saving = false
      }
    },
  },
})
