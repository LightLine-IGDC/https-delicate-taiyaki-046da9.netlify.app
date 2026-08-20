/* 光线 · 数据模型（与前台 content.js 结构一致，并做扩展） */

export interface SocialLink {
  label: string
  url: string
}

export interface SiteConfig {
  name: string
  shortName: string
  nameEn: string
  shortEn: string
  slogan: string
  sloganEn: string
  founded: string
  location: string
  email: string
  social: SocialLink[]
}

export interface StatItem {
  num: string
  label: string
}

export interface IntroData {
  lead: string
  paragraphs: string[]
  stats: StatItem[]
  focus: string[]
}

/** 作品下载/游玩链接（type 区分「下载」与「游玩」） */
export interface LinkItem {
  label: string
  url: string
  type?: 'download' | 'play' | string
}

export interface TimelineItem {
  date: string
  title: string
  text: string
  image: string
}

export interface WorkItem {
  name: string
  nameEn: string
  cover: string
  tags: string[]
  desc: string
  status: string
  links: LinkItem[]
}

export interface KnowledgeItem {
  category: string
  title: string
  articleId: string
  desc: string
  tags: string[]
  author: string
  date: string
  link: string
}

export interface ActivityItem {
  name: string
  type: string
  date: string
  desc: string
  result: string
  link: string
}

export interface NewsItem {
  date: string
  title: string
  source: string
  summary: string
  link: string
}

export interface ShareItem {
  date: string
  title: string
  articleId: string
  author: string
  topic: string
  desc: string
  link: string
}

export interface SiteContent {
  site: SiteConfig
  intro: IntroData
  timeline: TimelineItem[]
  works: WorkItem[]
  knowledge: KnowledgeItem[]
  activities: ActivityItem[]
  news: NewsItem[]
  shares: ShareItem[]
}

export interface Article {
  id: string
  slug: string
  title: string
  category: string
  author: string
  date: string
  summary: string
  tags: string[]
  cover: string
  body_md: string
  body_html: string
  created_at?: string
  updated_at?: string
}

export interface MediaItem {
  id: string
  name: string
  storage_path: string
  public_url: string
  size: number
  mime: string
  created_at?: string
}
