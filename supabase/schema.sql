-- ============================================================
--  光线独立游戏制作社团 · Supabase 数据库初始化脚本
--  用法：在 Supabase Dashboard → SQL Editor 里整段粘贴并 Run。
--  它会创建 3 张表 + 1 个公开存储桶 + 行级安全策略(RLS)。
-- ============================================================

-- ---------- 1. 内容（单例 JSON，承载 7 个前台模块 + 站点信息） ----------
create table if not exists public.content (
  id text primary key default 'main' check (id = 'main'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- 2. 文章（知识库/分享的正文，Markdown 源 + 预渲染 HTML） ----------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null default '',
  category text not null default '',
  author text not null default '',
  date text not null default '',
  summary text not null default '',
  tags text[] not null default '{}',
  cover text not null default '',
  body_md text not null default '',
  body_html text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 3. 媒体库（图片元数据，真实文件存 storage.buckets 'media'） ----------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_path text not null,
  public_url text not null,
  size bigint not null default 0,
  mime text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- updated_at 自动更新 ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_content_updated on public.content;
create trigger trg_content_updated before update on public.content
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_articles_updated on public.articles;
create trigger trg_articles_updated before update on public.articles
  for each row execute function public.touch_updated_at();

-- ============================================================
--  行级安全（RLS）：访客可读；登录后的管理员可写
-- ============================================================
alter table public.content enable row level security;
alter table public.articles enable row level security;
alter table public.media enable row level security;

-- 公开读
drop policy if exists content_public_read on public.content;
create policy content_public_read on public.content
  for select using (true);

drop policy if exists articles_public_read on public.articles;
create policy articles_public_read on public.articles
  for select using (true);

drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media
  for select using (true);

-- 仅登录用户可写（在 admin 里用 Supabase Auth 登录）
drop policy if exists content_auth_write on public.content;
create policy content_auth_write on public.content
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists articles_auth_write on public.articles;
create policy articles_auth_write on public.articles
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists media_auth_write on public.media;
create policy media_auth_write on public.media
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
--  公开存储桶 'media'（图片公开读，登录用户可上传/删除）
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists media_bucket_public_read on storage.objects;
create policy media_bucket_public_read on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists media_bucket_auth_insert on storage.objects;
create policy media_bucket_auth_insert on storage.objects
  for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists media_bucket_auth_update on storage.objects;
create policy media_bucket_auth_update on storage.objects
  for update using (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists media_bucket_auth_delete on storage.objects;
create policy media_bucket_auth_delete on storage.objects
  for delete using (bucket_id = 'media' and auth.role() = 'authenticated');
