-- ============================================================
-- Mod 下载量统计：在 Supabase 的 SQL Editor 里整段执行一次即可
-- ============================================================

-- 1) 下载量表
create table if not exists public.ab_mod_downloads (
  mod_id text primary key,
  count  bigint not null default 0
);

-- 2) 开启行级安全
alter table public.ab_mod_downloads enable row level security;

-- 3) 允许匿名读取（商店页统计）
drop policy if exists "read_mod_downloads" on public.ab_mod_downloads;
create policy "read_mod_downloads"
  on public.ab_mod_downloads
  for select
  using (true);

-- 4) 原子自增函数（客户端只调这个，无需写权限）
create or replace function public.increment_mod_download(p_mod_id text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if p_mod_id is null or length(p_mod_id) = 0 then
    return;
  end if;
  insert into public.ab_mod_downloads (mod_id, count)
  values (left(p_mod_id, 200), 1)
  on conflict (mod_id) do update
    set count = public.ab_mod_downloads.count + 1;
end;
$fn$;

-- 5) 允许匿名调用该函数
grant execute on function public.increment_mod_download(text) to anon;
