-- ============================================================
-- 跨设备完整快照 + 榜单头像：在 Supabase SQL Editor 执行一次
-- ============================================================

-- 1) 完整快照表（按快照码存取全部本地进度/设置）
create table if not exists public.ab_saves (
  code text primary key,
  data text,
  updated_at timestamptz default now()
);
alter table public.ab_saves enable row level security;
drop policy if exists "save_upsert" on public.ab_saves;
create policy "save_upsert" on public.ab_saves for insert with check (true);
drop policy if exists "save_update" on public.ab_saves;
create policy "save_update" on public.ab_saves for update using (true) with check (true);
drop policy if exists "save_read" on public.ab_saves;
create policy "save_read" on public.ab_saves for select using (true);
grant select, insert, update on public.ab_saves to anon;

-- 2) 头像档案表（uid → 头像 URL）
create table if not exists public.ab_profiles (
  uid text primary key,
  avatar_url text,
  updated_at timestamptz default now()
);
alter table public.ab_profiles enable row level security;
drop policy if exists "profile_upsert" on public.ab_profiles;
create policy "profile_upsert" on public.ab_profiles for insert with check (true);
drop policy if exists "profile_update" on public.ab_profiles;
create policy "profile_update" on public.ab_profiles for update using (true) with check (true);
drop policy if exists "profile_read" on public.ab_profiles;
create policy "profile_read" on public.ab_profiles for select using (true);
grant select, insert, update on public.ab_profiles to anon;

-- 3) 头像存储桶（公开读）+ 匿名上传策略
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects for insert
  with check (bucket_id = 'avatars');

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects for update
  using (bucket_id = 'avatars') with check (bucket_id = 'avatars');

-- 4) MOD 导出桶（公开读 + 匿名上传，供「导出 zip」生成下载链接）
insert into storage.buckets (id, name, public)
values ('mod-export', 'mod-export', true)
on conflict (id) do nothing;

drop policy if exists "modexport_read" on storage.objects;
create policy "modexport_read" on storage.objects for select using (bucket_id = 'mod-export');

drop policy if exists "modexport_insert" on storage.objects;
create policy "modexport_insert" on storage.objects for insert with check (bucket_id = 'mod-export');
