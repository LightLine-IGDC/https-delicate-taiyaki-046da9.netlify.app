# 哈尔滨理工大学光线独立游戏制作社团 · 官方网站

「以光为笔，创造世界」—— 社团官方网站，高级黑白 + 光谱渐变（白光色散）视觉风格，交互参考 [jiejoe.com](https://www.jiejoe.com) 的设计语言。

## 架构

- **前台** `public/`：纯静态，打开即渲染内置默认内容，同时从 Supabase 拉取后台保存的最新内容（拉不到时自动回退默认，不白屏）。
- **后台** `admin-app/`：Vue3 + Vite + Element Plus，构建到 `public/admin/`；登录后在线编辑 **站点信息 + 7 个内容模块 + 文章 + 媒体库**。
- **后端** Supabase：Postgres + Storage（图片）+ Auth（登录）。详见 **[SUPABASE.md](./SUPABASE.md)** 与 **[DEPLOY.md](./DEPLOY.md)**。

## 如何本地运行

```bash
# 前台（无需构建，直接打开或起静态服务）
cd public && python -m http.server 8000

# 后台（需先配 admin-app/.env 与 Supabase）
cd admin-app && npm install && npm run dev     # http://localhost:5173
```

> 前台未配置 Supabase 时，会显示 `public/js/content.js` + `articles.js` 里的默认内容，开箱即用。

## 目录结构

```
├── public/                 ★ 前台（部署时发布这个目录）
│   ├── index.html          首页（加载动画 / 全屏菜单 / 7 个模块）
│   ├── css/style.css       全部样式（光线视觉系统）
│   └── js/
│       ├── config.js       Supabase 读取配置（url + anon key，公开）
│       ├── content.js      默认内容（站点 + 7 模块，兜底）
│       ├── articles.js     默认文章正文（兜底）
│       └── main.js         交互与渲染逻辑
├── admin-app/              ★ 后台（Vue3 SPA，构建产物输出到 public/admin/）
│   ├── src/
│   │   ├── config/modules.ts   8 个模块的字段 schema（驱动通用编辑器）
│   │   ├── views/              登录 / 模块编辑 / 文章 / 媒体库
│   │   ├── components/         布局 / 字段渲染器 / Markdown 编辑器 / 图片上传
│   │   ├── api/ + lib/         Supabase 客户端、内容/文章/媒体读写、导入器
│   │   └── scripts/seed.mjs    种子脚本（把默认内容导入 Supabase）
│   └── package.json
├── supabase/schema.sql     ★ 建表 + RLS + 存储桶（一次性执行）
├── netlify.toml            Netlify 部署配置（构建后台 + 发布 public）
└── package.json            根依赖
```

## 如何更新内容

1. **在线后台（推荐）**：访问 `/admin` 登录，编辑 7 个模块 / 文章 / 图片，点「保存」，前台刷新即生效。
2. **直接改文件（兜底）**：默认文案在 `public/js/content.js`、文章正文在 `public/js/articles.js`。

```js
window.CLUB_DATA = {
  site: { ... },        // 站点信息
  intro: { ... },       // 1. 社团简介
  timeline: [ ... ],    // 2. 社团时间线（图文）
  works: [ ... ],       // 3. 社团作品展示（封面 + 下载/游玩链接）
  knowledge: [ ... ],   // 4. 社团知识库
  activities: [ ... ],  // 5. 游戏开发活动收录
  news: [ ... ],        // 6. 游戏行业资讯
  shares: [ ... ]       // 7. 社团分享
};
```

### 字段约定

| 字段 | 说明 |
| --- | --- |
| `image` / `cover` | 图片地址。留 `""` 时自动用内置「光线」占位图；可填上传后的图片 URL |
| `links`（作品） | 数组，每项含 `type`（`download` 下载 / `play` 游玩）、`label`、`url` |
| `articleId`（知识库/分享） | 关联文章的 id，后台用下拉选择；有值时卡片可点击阅读全文 |

## 设计说明

- **配色**：背景 `#060708`（高级黑），主色 `#ffffff`（高级白）。
- **光谱渐变**：对应 logo 色带——深绿 → 深蓝 → 浅蓝 → 白 → 淡黄 → 橙 → 红 → 暗紫（白光经棱镜色散）。
- **光线元素**：Hero 旋转光束、漂浮光粒子画布、光标光晕跟随、卡片悬停辉光。
- **响应式**：桌面 / 平板 / 手机自适应；`prefers-reduced-motion` 下自动关闭动画。

## 备注

- 站点内容已按工作区内的社团 PDF 文档填充；默认数据内联在 `public/js/content.js` 与 `articles.js` 中。
- 社团时间线已压缩为关键节点；作品清单经 OCR 整理。
- 上线后以后台在线编辑为准；默认文件仅作兜底与首次种子导入的来源。
