-- ============================================================
-- 容量防护：定期清理遥测/快照，避免只增不减（在 Supabase SQL Editor 执行一次）
-- 依赖 pg_cron（Supabase 支持）。若未启用：Database → Extensions → 启用 pg_cron。
-- ============================================================

create extension if not exists pg_cron;

-- 1) 遥测清理：错误保留 7 天、事件保留 30 天
create or replace function public.ab_cleanup_telemetry() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.ab_error_logs where ts < now() - interval '7 days';
  delete from public.ab_events where ts < now() - interval '30 days';
end;
$$;
select cron.unschedule('ab_cleanup_telemetry');
select cron.schedule('ab_cleanup_telemetry', '30 3 * * *', 'select public.ab_cleanup_telemetry();');

-- 2) 快照清理：超过 30 天未更新的删除（导出 zip 已按用户固定路径覆盖，不会无限增长）
create or replace function public.ab_cleanup_saves() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.ab_saves where updated_at < now() - interval '30 days';
end;
$$;
select cron.unschedule('ab_cleanup_saves');
select cron.schedule('ab_cleanup_saves', '45 3 * * *', 'select public.ab_cleanup_saves();');

-- 说明：
-- - ab_error_logs / ab_events：按天自动裁剪
-- - ab_saves：每人固定同步码(ab_snap_code)复用同一行，天然有界；此清理只删长期不用的
-- - 头像 avatars/<uid>.png：每人固定覆盖，有界
-- - 导出 mod-export/exports/<uid>.zip：每人固定覆盖，有界
