-- 兑换码收敛（在 Supabase SQL Editor 执行一次）
-- 只保留 4 个可用码：Camona / Destiny / NAME-RED-8K2M / NAME-BLUE-5Q7X

delete from public.ab_redeem_codes
 where code not in ('Camona', 'Destiny', 'NAME-RED-8K2M', 'NAME-BLUE-5Q7X');

insert into public.ab_redeem_codes(code, kind, payload, once, active)
values
 ('Camona', 'value', '{"amount":20000000}', true, true),
 ('Destiny', 'skill', '{"skill":"destiny_pity"}', true, true),
 ('NAME-RED-8K2M', 'name_red', '{}', true, true),
 ('NAME-BLUE-5Q7X', 'name_blue', '{}', true, true)
on conflict (code) do update
  set kind = excluded.kind,
      payload = excluded.payload,
      once = excluded.once,
      active = true;

-- 查看结果
select code, kind, active from public.ab_redeem_codes order by code;
