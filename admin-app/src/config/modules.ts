/* 8 个内容模块的字段 schema —— 驱动通用编辑器（对象表单 / 列表编辑器） */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'image'
  | 'tags'
  | 'link-list'
  | 'article'
  | 'list-text'
  | 'kv-list'

export interface LinkTypeOption {
  value: string
  label: string
}

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  /** 仅 link-list 用：给每条链接附加一个类型选择（如 下载/游玩） */
  linkTypes?: LinkTypeOption[]
}

export interface ModuleDef {
  key: string
  label: string
  en: string
  kind: 'object' | 'collection'
  description: string
  fields: FieldDef[]
}

export const MODULES: ModuleDef[] = [
  {
    key: 'site',
    label: '站点信息',
    en: 'SITE',
    kind: 'object',
    description: '社团全称、口号、邮箱、社交链接等全局信息。',
    fields: [
      { key: 'name', label: '社团全称', type: 'text' },
      { key: 'shortName', label: '简称', type: 'text' },
      { key: 'nameEn', label: '英文全称', type: 'text' },
      { key: 'shortEn', label: '英文简称', type: 'text' },
      { key: 'slogan', label: '口号', type: 'text' },
      { key: 'sloganEn', label: '英文口号', type: 'text' },
      { key: 'founded', label: '成立年份', type: 'text' },
      { key: 'location', label: '地点', type: 'text' },
      { key: 'email', label: '邮箱', type: 'text' },
      { key: 'social', label: '社交链接', type: 'link-list' },
    ],
  },
  {
    key: 'intro',
    label: '社团简介',
    en: 'ABOUT',
    kind: 'object',
    description: '简介导语、段落、关键数据与专注方向。',
    fields: [
      { key: 'lead', label: '导语', type: 'textarea' },
      { key: 'paragraphs', label: '正文段落（每行一段）', type: 'list-text' },
      { key: 'stats', label: '关键数据（每行：数字|标签）', type: 'kv-list' },
      { key: 'focus', label: '专注方向（逗号分隔）', type: 'tags' },
    ],
  },
  {
    key: 'timeline',
    label: '社团时间线',
    en: 'TIMELINE',
    kind: 'collection',
    description: '按顺序展示的社团大事记，可增删、排序、配图。',
    fields: [
      { key: 'date', label: '日期', type: 'text', placeholder: '2025.09' },
      { key: 'title', label: '标题', type: 'text' },
      { key: 'text', label: '正文', type: 'textarea' },
      { key: 'image', label: '图片', type: 'image' },
    ],
  },
  {
    key: 'works',
    label: '作品展示',
    en: 'WORKS',
    kind: 'collection',
    description: '社团作品；每个作品可单独配置「下载地址」或「游玩链接」。',
    fields: [
      { key: 'name', label: '作品名', type: 'text' },
      { key: 'nameEn', label: '英文名', type: 'text' },
      { key: 'cover', label: '封面图', type: 'image' },
      { key: 'tags', label: '标签（逗号分隔）', type: 'tags' },
      { key: 'desc', label: '简介', type: 'textarea' },
      { key: 'status', label: '状态/奖项', type: 'text', placeholder: '如：好评如潮奖' },
      {
        key: 'links',
        label: '下载 / 游玩链接',
        type: 'link-list',
        linkTypes: [
          { value: 'download', label: '下载' },
          { value: 'play', label: '游玩' },
        ],
      },
    ],
  },
  {
    key: 'knowledge',
    label: '知识库',
    en: 'KNOWLEDGE',
    kind: 'collection',
    description: '知识库卡片；可选关联一篇已录入的文章（点卡片阅读全文）。',
    fields: [
      { key: 'category', label: '分类', type: 'text', placeholder: '策划篇 / 程序篇' },
      { key: 'title', label: '标题', type: 'text' },
      { key: 'articleId', label: '关联文章（可选）', type: 'article' },
      { key: 'desc', label: '卡片摘要', type: 'textarea' },
      { key: 'tags', label: '标签（逗号分隔）', type: 'tags' },
      { key: 'author', label: '作者', type: 'text' },
      { key: 'date', label: '日期', type: 'text' },
      { key: 'link', label: '外链（可选）', type: 'text' },
    ],
  },
  {
    key: 'activities',
    label: '活动收录',
    en: 'ACTIVITIES',
    kind: 'collection',
    description: '社团参加的比赛 / Game Jam / 交流活动。',
    fields: [
      { key: 'name', label: '活动名', type: 'text' },
      { key: 'type', label: '类型', type: 'text', placeholder: 'Game Jam / 比赛' },
      { key: 'date', label: '日期', type: 'text' },
      { key: 'desc', label: '描述', type: 'textarea' },
      { key: 'result', label: '成果', type: 'text' },
      { key: 'link', label: '链接（可选）', type: 'text' },
    ],
  },
  {
    key: 'news',
    label: '行业资讯',
    en: 'NEWS',
    kind: 'collection',
    description: '游戏行业动态与参赛资讯。',
    fields: [
      { key: 'date', label: '日期', type: 'text' },
      { key: 'title', label: '标题', type: 'text' },
      { key: 'source', label: '来源', type: 'text' },
      { key: 'summary', label: '摘要', type: 'textarea' },
      { key: 'link', label: '链接（可选）', type: 'text' },
    ],
  },
  {
    key: 'shares',
    label: '社团分享',
    en: 'SHARING',
    kind: 'collection',
    description: '成员投稿分享；可关联一篇已录入的文章。',
    fields: [
      { key: 'date', label: '日期', type: 'text' },
      { key: 'title', label: '标题', type: 'text' },
      { key: 'articleId', label: '关联文章（可选）', type: 'article' },
      { key: 'author', label: '作者', type: 'text' },
      { key: 'topic', label: '话题', type: 'text', placeholder: '策划 / 程序' },
      { key: 'desc', label: '摘要', type: 'textarea' },
      { key: 'link', label: '链接（可选）', type: 'text' },
    ],
  },
]

export function getModule(key: string): ModuleDef | undefined {
  return MODULES.find((m) => m.key === key)
}

/** 依据 schema 生成一条默认（空）条目 */
export function emptyItem(def: ModuleDef): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const f of def.fields) {
    obj[f.key] = fieldDefault(f)
  }
  return obj
}

export function fieldDefault(f: FieldDef): unknown {
  switch (f.type) {
    case 'tags':
    case 'link-list':
    case 'list-text':
      return []
    case 'kv-list':
      return []
    default:
      return ''
  }
}

/** 构造一份完整的空内容（当 Supabase content 表为空时用作初始结构） */
export function defaultContent(): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const m of MODULES) {
    if (m.kind === 'collection') {
      obj[m.key] = []
    } else {
      const o: Record<string, unknown> = {}
      for (const f of m.fields) o[f.key] = fieldDefault(f)
      obj[m.key] = o
    }
  }
  return obj
}
