# 后台搭建指南（Supabase + Vue 后台）

本文档是**一次性搭建步骤**。做完之后，日常只需登录 `/admin` 在线编辑内容，无需再碰数据库。

## 架构一览

```
前台  public/（纯静态，读 Supabase 公开接口，拉不到时回退到内置默认内容）
后台  admin-app/（Vue3 + Element Plus，构建到 public/admin/，hash 路由）
后端  Supabase（Postgres 数据库 + Storage 对象存储 + Auth 登录）
```

- 结构化内容（站点信息 + 7 个模块）→ `content` 表（单行 JSON）
- 文章（标题/正文/封面等）→ `articles` 表
- 图片文件 → Storage 桶 `media` + `media` 表记录元数据

---

## 第一步：创建 Supabase 项目并拿到密钥

1. 打开 <https://supabase.com>，注册/登录，**New project**（选离你近的区域，如 Singapore）。
   > 创建过程中若出现可选的 **「Connect GitHub repository」** 步骤，**直接 Skip 跳过**——本方案不依赖它，建表是手动在 SQL Editor 里跑 `schema.sql` 完成的。
2. 进入项目 → **Project Settings → API**，记下两个值：
   - `Project URL`（形如 `https://xxxx.supabase.co`）
   - `anon public`（公开读密钥）
   - `service_role`（仅用于种子脚本，**绝不放进前端/前台代码**）

---

## 第二步：建表 + 存储桶 + 权限

1. 项目内打开 **SQL Editor** → **New query**。
2. 把本仓库 `supabase/schema.sql` 的**全部内容**粘贴进去，点 **Run**。

这一步会创建 3 张表（`content` / `articles` / `media`）、公开存储桶 `media`，以及行级安全策略（访客可读、登录用户可写）。

---

## 第三步：创建管理员账号

1. 项目内打开 **Authentication → Users → Add user → Create new user**。
2. 填一个**管理员邮箱**和**密码**，勾选 **Auto Confirm User**（否则要去邮箱点确认）。
3. 保存。这个账号就是后台登录账号。

> 权限模型：任何在 Auth Users 里的账号都能登录后台并编辑（`auth.role()='authenticated'`）。社团规模下够用——**只添加管理员账号**即可。若以后要细分权限，可再加 role 字段。

---

## 第四步：配置后台环境变量

在 `admin-app/` 下复制 `.env.example` 为 `.env`：

```bash
cp admin-app/.env.example admin-app/.env
```

填入：

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=你的 anon public 密钥
```

> `.env` 已被 gitignore，不会提交。部署到 Netlify 时，这两个值要在 Netlify 里配成**构建环境变量**（见 [DEPLOY.md](./DEPLOY.md)）。

---

## 第五步：把默认内容导入数据库（种子）

先把现有 `public/js/content.js`（站点+7 模块）与 `articles.js`（5 篇正文）写进 Supabase：

```bash
npm install            # 首次，安装根依赖（@netlify/blobs）
cd admin-app && npm install && cd ..

# 设置环境变量（PowerShell）
$env:SUPABASE_URL="https://xxxx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="你的 service_role 密钥"

node admin-app/scripts/seed.mjs
```

看到 `✓ 内容已写入 content 表` 即成功。

---

## 第六步：配置前台读取地址

编辑 `public/js/config.js`，把占位值换成真实值（anon key 是公开读密钥，放前端是安全的）：

```js
window.SUPABASE_CONFIG = {
  url: "https://xxxx.supabase.co",
  anonKey: "你的 anon public 密钥"
};
```

---

## 第七步：本地跑起来 / 部署

```bash
# 本地预览后台
cd admin-app && npm run dev          # http://localhost:5173/#/login

# 构建（产物输出到 public/admin/）
cd admin-app && npm run build
```

部署到 Netlify 见 [DEPLOY.md](./DEPLOY.md)；前端静态预览直接开 `public/index.html` 即可（未配 Supabase 时会回退默认内容）。

---

## 后台功能对照

| 需求 | 位置 |
| --- | --- |
| 7 个模块均可后台编辑 | 后台左侧「内容模块」→ 站点信息/简介/时间线/作品/知识库/活动/资讯/分享，全部可增删改排序 |
| 文章上传（链接 / Word / Markdown） | 「文章管理」→ 新增/编辑 → 顶部「导入正文」三个按钮 |
| 图片拖拽导入 | 「媒体库」拖拽上传；或在作品封面、时间线图片、文章封面字段里直接拖拽上传 |
| 作品下载/游玩链接 | 「作品展示」→ 每条作品的「下载/游玩链接」里，逐条选择类型（下载 / 游玩）+ 名称 + 地址 |
