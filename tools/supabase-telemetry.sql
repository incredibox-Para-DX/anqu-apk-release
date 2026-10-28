-- ============================================================
-- 轻量遥测：错误上报 + 埋点。在 Supabase SQL Editor 执行一次。
-- 只允许匿名「写入」，读取请用 service_role / 后台查询。
-- ============================================================

-- 错误上报
create table if not exists public.ab_error_logs (
  id uuid default gen_random_uuid() primary key,
  uid text,
  version text,
  lang text,
  message text,
  stack text,
  url text,
  ctx text,
  ts timestamptz default now()
);
alter table public.ab_error_logs enable row level security;
drop policy if exists "insert_error_logs" on public.ab_error_logs;
create policy "insert_error_logs" on public.ab_error_logs for insert with check (true);
grant insert on public.ab_error_logs to anon;
create index if not exists ab_error_logs_ts_idx on public.ab_error_logs (ts desc);

-- 埋点
create table if not exists public.ab_events (
  id uuid default gen_random_uuid() primary key,
  uid text,
  version text,
  lang text,
  name text,
  props text,
  ts timestamptz default now()
);
alter table public.ab_events enable row level security;
drop policy if exists "insert_events" on public.ab_events;
create policy "insert_events" on public.ab_events for insert with check (true);
grant insert on public.ab_events to anon;
create index if not exists ab_events_ts_idx on public.ab_events (ts desc);

-- 允许匿名单读（GM 遥测看板用；如需隐私请改为 service_role 读取）
grant select on public.ab_error_logs to anon;
grant select on public.ab_events to anon;
