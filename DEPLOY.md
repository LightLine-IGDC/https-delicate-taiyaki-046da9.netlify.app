# 部署与使用说明（Netlify）

本项目 = **静态前端** + **Netlify 无服务器后端**，可以实现：

- 部署后人人可通过公开网址访问首页；
- 管理员用密码登录后台（`/admin`），在线编辑「时间线 / 文章 / 站点信息」，保存后前台即时生效，**无需改代码、无需重新部署**。

> 你问的「是否可以用 Netlify 来部署」——可以。下面的方案就基于 Netlify 免费额度，天然支持静态托管 + 云函数 + 数据存储，是这类需求最省事的组合。

---

## 一、整体架构

```
浏览器（访客）
  ├── /index.html        首页：打开时从 /api/content 拉取最新内容
  │                       （拉不到时自动回退到 public/js 里的默认内容）
  └── /admin             管理后台：登录 + 在线编辑

Netlify 后端（云函数，自动弹性，无需自建服务器）
  ├── POST /api/login     校验管理员密码 → 返回签名令牌（7 天有效）
  ├── GET  /api/content   公开读取全部内容（任何访客可读）
  └── POST /api/content   校验令牌 → 保存内容（仅管理员可写）

数据存储
  └── Netlify Blobs       免费键值存储，保存最新的网站内容 JSON
```

**目录结构**（已按部署最佳实践整理）：

```
├── public/                 ★ 发布目录（Netlify 只发布这里）
│   ├── index.html         首页
│   ├── admin.html         管理后台页面
│   ├── admin.css / admin.js
│   ├── css/style.css
│   └── js/
│       ├── content.js     默认内容（兜底）
│       ├── articles.js    默认文章正文（兜底）
│       └── main.js        渲染逻辑 + 启动时拉取远程内容
├── netlify/functions/      后端云函数（在发布目录之外，不会被公开）
│   ├── login.js           登录
│   ├── content.js         内容读写
│   └── _lib.js            共享工具（下划线开头 = 不作为函数端点）
├── netlify.toml           Netlify 配置（发布目录、函数目录、路由转发）
├── package.json           依赖 @netlify/blobs
└── README.md / DEPLOY.md
```

关键点：`public/` 是唯一会被发布到公网的目录；`netlify/functions/`、`node_modules/`、PDF 源文件、`package.json` 等都不会被公开。

---

## 二、部署前准备

1. 注册 **Netlify** 账号：<https://app.netlify.com>（免费）。
2. （推荐）准备一个 **GitHub** 仓库，把本项目推上去——Git 方式部署最省心，改代码推送即自动重新部署。
3. 确定一个管理员密码（自己保管，不要提交到代码里）。

---

## 三、部署方式（三选一）

### 方式 A：GitHub + Netlify（推荐，支持全部功能）

1. 把项目推送到 GitHub（`.gitignore` 已忽略 `node_modules`、`.netlify`、`.env`）。
2. 打开 Netlify → **Add new site → Import an existing project → GitHub**。
3. 选择你的仓库。
4. 部署设置（检测到 `netlify.toml` 时通常会自动带出，确认即可）：

   | 项 | 值 |
   | --- | --- |
   | Build command | 留空（或 `npm run build`） |
   | Publish directory | `public` |
   | Functions directory | `netlify/functions` |

5. 点击 **Deploy site**。完成后得到 `https://xxx.netlify.app`，**人人可访问**。

### 方式 B：Netlify CLI 本地部署（不想用 GitHub 时）

```bash
npm install                       # 安装依赖（@netlify/blobs）
npx netlify login                 # 登录 Netlify 账号
npx netlify sites:create          # 首次创建站点
npx netlify deploy --prod         # 发布到生产环境（自动读取 netlify.toml）
```

### 方式 C：拖拽部署（仅静态预览，不含后台）

Netlify 控制台 → **Deploy manually / 拖放**，把 **`public` 文件夹**拖进去即可得到一个静态网址。

> 注意：拖拽方式通常不带云函数，**后台编辑不可用**；需要后台时请用方式 A 或 B。

---

## 四、配置管理员（重要，否则后台无法登录）

部署完成后，进入 **Site configuration → Environment variables**，添加两个变量：

| 变量名 | 作用 | 建议 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 后台登录密码 | 设成你自己的强密码 |
| `ADMIN_TOKEN_SECRET` | 令牌签名密钥 | 一段随机长字符串（32 位以上） |

> ⚠️ 环境变量必须配在 Netlify 网站的设置里（不要写进 `netlify.toml`，写在那里对云函数无效）。
> ⚠️ 每次修改环境变量后，Netlify 会提示「需要重新部署」，点确认让它生效。

配置好后访问：

```
https://你的站点.netlify.app/admin
```

输入 `ADMIN_PASSWORD` 即可进入后台。

---

## 五、后台怎么用

登录后有三个页签：

1. **时间线**
   - 新增 / 编辑每条时间线的「日期、标题、正文、图片地址」；
   - 用「上移 / 下移」调整顺序，点「删除」移除；
   - 图片地址可留空（前台自动用「光线」占位图），也可填 `https://...` 或站内 `images/xxx.png`。

2. **文章**（对应知识库卡片 + 阅读弹窗里的完整正文）
   - 点击文章标题展开，编辑：标题、分类、作者、日期、卡片摘要、标签、正文；
   - 可「新增文章」「删除文章」；
   - **正文语法**（三规则）：
     - 空行 = 分段；
     - 行首 `## ` = 章节小标题；
     - 用三个反引号 ``` 包裹 = 代码块。

3. **站点信息**
   - 编辑社团全称、简称、口号、邮箱、地点、成立年份等。

编辑完点右上角 **「保存全部」**，出现「已保存 ✓」即成功；访客刷新首页即可看到最新内容（接口已设置不缓存）。

---

## 六、工作原理（数据流）

1. 首次部署时，Netlify Blobs 里还没有数据，首页显示 `public/js/content.js` + `articles.js` 里的**默认内容**。
2. 管理员在后台编辑并「保存全部」→ 前端把整份内容 `{ data, articles }` 通过 `POST /api/content`（带令牌）写入 Netlify Blobs。
3. 之后任何访客打开首页，`public/js/main.js` 会先渲染默认内容，同时请求 `GET /api/content`，拿到最新内容后覆盖并重新渲染。
4. 即使后端临时不可用，首页也会**自动回退到默认内容**，不会白屏。

---

## 七、本地开发调试（可选）

```bash
npm install            # 安装依赖
npx netlify dev        # 本地启动，自动运行云函数和 /api 转发
```

首次运行 `netlify dev` 会要求 `netlify login`，登录并关联到已部署站点后，本地也能读写同一个 Blobs 数据。

只想看纯前端效果时，直接双击打开 `public/index.html` 即可（后端拉不到会自动回退到默认内容）。

---

## 八、常见问题（FAQ）

| 现象 | 原因与处理 |
| --- | --- |
| 后台登录提示「未配置 ADMIN_PASSWORD」 | 环境变量没配，或配完没重新部署 |
| 后台保存提示 401 / 登录过期 | 令牌 7 天过期或密钥变了，重新登录即可 |
| 首页没显示后台改的内容 | 确认保存提示「已保存 ✓」；仍不生效就 Ctrl+F5 强刷 |
| 后台页面打不开（404） | 确认发布目录是 `public`，且 `admin.html` 在 `public/` 下 |
| `/api/*` 404 | 确认是用方式 A/B 部署（带云函数），且 `netlify/functions` 目录存在 |

---

## 九、安全与限制说明

- `ADMIN_PASSWORD` 只存在服务端环境变量里，**不会**出现在任何前端代码或公开文件中。
- 令牌只用于「写」操作；公开读取无需登录。
- `admin.html` 已内置 `<meta name="robots" content="noindex">`，避免被搜索引擎收录。
- 环境变量有约 4KB 上限；本项目只用了两个短变量，远低于上限。
- 云函数与 Blobs 均为免费额度，足够社团规模使用；若日后数据量变大，可平滑迁移到数据库或 headless CMS。

---

## 十、如果以后想换平台

前端（`public/`）完全可复用。后端只需把 `netlify/functions/*.js` 里的两个函数，改成目标平台的写法（Vercel Functions / Cloudflare Workers），存储换成对应平台的 KV（Vercel KV / Cloudflare KV）即可；接口路径 `/api/login`、`/api/content` 保持不变，前端无需改动。
