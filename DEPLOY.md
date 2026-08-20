# 部署与使用说明（Netlify + Supabase）

本项目 = **静态前台** + **Vue 后台（构建产物）** + **Supabase 后端**。

- 部署后人人可访问首页 `https://你的站点.netlify.app`
- 管理员访问 `/admin` 登录，在线编辑 7 个模块 / 文章 / 图片，保存即生效，**无需改代码、无需重新部署**

> 首次搭建请先按 **[SUPABASE.md](./SUPABASE.md)** 完成 Supabase 建表、建管理员、种子导入。本文档只管部署与日常使用。

---

## 一、整体架构

```
浏览器（访客）      /index.html         前台：读 Supabase 公开接口，失败回退默认内容
浏览器（管理员）    /admin              后台：Vue SPA（构建到 public/admin/，hash 路由）

Supabase（后端）
  ├─ content 表        站点信息 + 7 个模块（单行 JSON）
  ├─ articles 表       文章（标题/正文/封面等）
  ├─ media 表 + Storage 图片文件（公开读、登录写）
  └─ Auth              管理员邮箱密码登录

Netlify
  ├─ 构建：cd admin-app && npm install && npm run build → 输出到 public/admin/
  └─ 发布：public/（前台 + 后台产物）
```

---

## 二、部署前准备

1. 按 [SUPABASE.md](./SUPABASE.md) 完成：建表 / 建管理员 / 种子导入 / 前台 `config.js` 已填。
2. 准备好 GitHub 仓库（推荐），把本项目推送上去。

---

## 三、部署到 Netlify

1. Netlify → **Add new site → Import an existing project → GitHub**，选仓库。
2. 部署设置（`netlify.toml` 已写好，会自动带出）：
   | 项 | 值 |
   | --- | --- |
   | Build command | `cd admin-app && npm install && npm run build` |
   | Publish directory | `public` |
3. **重要：配置构建环境变量**（后台 SPA 在构建时读取，`admin-app/.env` 不会提交到 Git）：
   | 变量名 | 值 |
   | --- | --- |
   | `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | anon public 密钥 |
4. 点 **Deploy site**。完成后访问 `https://你的站点.netlify.app`（前台）与 `/admin`（后台）。

> ⚠️ 修改环境变量后 Netlify 会要求重新部署，点确认即可。

---

## 四、后台怎么用

登录后左侧菜单：

- **内容模块（8 项）**：站点信息、社团简介、时间线、作品展示、知识库、活动收录、资讯、分享——每项都可增删改、排序、配图。
  - 「作品展示」里每条作品的**下载/游玩链接**可逐条选类型：`下载`（⬇）或 `游玩`（▶）。
- **文章管理**：新增/编辑文章，正文用 Markdown 编写并实时预览；顶部「导入正文」支持：
  - **Markdown 文件**（.md/.txt）
  - **Word 文件**（.docx，自动转 Markdown）
  - **链接**（粘贴 URL 抓取正文）
- **媒体库**：拖拽上传本地图片，点「复制 URL」粘贴到任意图片字段。

编辑完点右上角/顶部「保存」，出现「已保存 ✓」即成功；访客刷新首页即可看到。

---

## 五、数据流

1. 首次用种子脚本把默认内容写入 Supabase。
2. 管理员在后台编辑并保存 → 写入 Supabase（`content` / `articles` / `media`）。
3. 访客打开首页 → 渲染内置默认内容 → 请求 Supabase 公开接口 → 拉到最新内容覆盖重渲染。
4. 后端不可用 / 未配置时，前台自动回退到 `public/js` 里的默认内容，不会白屏。

---

## 六、本地开发

```bash
# 前台（可选）
cd public && python -m http.server 8000

# 后台
cd admin-app
cp .env.example .env    # 填入 Supabase url + anon key
npm install
npm run dev             # http://localhost:5173
```

---

## 七、常见问题（FAQ）

| 现象 | 原因与处理 |
| --- | --- |
| 后台登录提示邮箱或密码错误 | Supabase Auth 里没有该账号，或密码不对；到 Authentication → Users 核对 |
| 后台提示「未配置 Supabase」 | `admin-app/.env`（本地）或 Netlify 构建变量没配 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` |
| 保存提示 401 / 权限错误 | 未登录或会话过期；退出重新登录 |
| 前台显示的是默认内容，不是后台改的 | 确认 `public/js/config.js` 填了真实 url+anon key；确认已保存；强刷页面 |
| 上传图片失败 | 确认 `supabase/schema.sql` 已执行（storage 桶 `media` + RLS 策略） |
| 后台页面 404 | 确认发布目录是 `public`，且构建成功产出了 `public/admin/` |

---

## 八、安全与限制

- `anon key` 是**公开读**密钥，可放前端；写操作由 RLS 限制为登录用户。
- `service_role` 密钥**绝不**放进前端/前台/仓库，只用于本地种子脚本。
- 任何 Supabase Auth 里的账号都能登录后台（当前权限模型）；只添加管理员账号。
- 文章正文在后台保存时已用 DOMPurify 消毒，前台直接渲染安全 HTML。
- 链接抓取：优先直连，目标站禁止 CORS 时走公开代理 `api.allorigins.win`（仅用于正文导入）。
