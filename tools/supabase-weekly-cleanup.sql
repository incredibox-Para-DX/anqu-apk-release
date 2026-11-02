-- ============================================================
-- 每周自动清理（在 Supabase SQL Editor 整段执行一次）
-- 目的：裁剪只增不减的历史数据，降低数据库体积与读取量
-- 依赖 pg_cron（Supabase 支持）：Database → Extensions 启用 pg_cron
-- ============================================================

create extension if not exists pg_cron;

-- 1) 表数据清理：错误 7 天、埋点 30 天、兑换日志 90 天、过期封禁、长期未用快照/档案
create or replace function public.ab_weekly_cleanup() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.ab_error_logs where ts < now() - interval '7 days';
  delete from public.ab_events where ts < now() - interval '30 days';
  delete from public.ab_redeem_log where created_at < now() - interval '90 days';
  delete from public.ab_bans where until is not null and until < now();
  delete from public.ab_saves where updated_at < now() - interval '30 days';
  delete from public.ab_profiles where updated_at < now() - interval '30 days';
end;
$$;

-- 2) 存储对象清理：头像 7 天、导出 zip 1 天
create or replace function public.ab_weekly_storage_cleanup() returns void
language plpgsql security definer set search_path = public, storage as $$
begin
  delete from storage.objects where bucket_id = 'avatars' and created_at < now() - interval '7 days';
  delete from storage.objects where bucket_id = 'mod-export' and created_at < now() - interval '1 day';
end;
$$;

-- 3) 已用完的兑换码标记停用（不删除记录，保留兑换历史）
create or replace function public.ab_weekly_disable_used_codes() returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.ab_redeem_codes
     set active = false
   where active = true
     and created_at < now() - interval '30 days'
     and (
       (once = true and used_count > 0)
       or (max_uses is not null and used_count >= max_uses)
     );
end;
$$;

-- 4) 调度：每周一 03:00 开始，错开执行
select cron.unschedule(jobid)
  from cron.job
 where jobname in ('ab_weekly_cleanup', 'ab_weekly_storage_cleanup', 'ab_weekly_disable_codes', 'ab_weekly_vacuum');

select cron.schedule('ab_weekly_cleanup', '0 3 * * 1', 'select public.ab_weekly_cleanup();');
select cron.schedule('ab_weekly_storage_cleanup', '15 3 * * 1', 'select public.ab_weekly_storage_cleanup();');
select cron.schedule('ab_weekly_disable_codes', '30 3 * * 1', 'select public.ab_weekly_disable_used_codes();');
select cron.schedule('ab_weekly_vacuum', '45 3 * * 1',
  'vacuum analyze public.ab_events; vacuum analyze public.ab_error_logs; vacuum analyze public.ab_redeem_log; vacuum analyze public.ab_saves;');

-- 5) 立即清理一次（不想等周一可单独执行）
-- select public.ab_weekly_cleanup();
-- select public.ab_weekly_storage_cleanup();
-- select public.ab_weekly_disable_used_codes();

-- 查看已调度的任务
-- select jobid, jobname, schedule, command from cron.job order by jobid;
