-- 恢复全部兑换码（在 Supabase SQL Editor 执行一次）
insert into public.ab_redeem_codes(code, kind, payload, once, active) values
 ('Camona', 'value', '{"amount":20000000}', true, true),
 ('hefunadmin', 'gm', '{}', true, true),
 ('ItemPool', 'item_pool', '{}', true, true),
 ('Destiny', 'skill', '{"skill":"destiny_pity"}', true, true),
 ('CARD030', 'card', '{"card_id":"card_030"}', true, true),
 ('CARD052', 'card', '{"card_id":"card_052"}', true, true),
 ('CARD047', 'card', '{"card_id":"card_047"}', true, true),
 ('CARD017', 'card', '{"card_id":"card_017"}', true, true),
 ('GOLDNAME', 'gold_name', '{}', true, true),
 ('NAME-RED-8K2M', 'name_red', '{}', true, true),
 ('NAME-BLUE-5Q7X', 'name_blue', '{}', true, true),
 ('HEFUN-2026-ALL', 'bundle', '{"items":["gm","item_pool","gold_name","card:card_030","card:card_052","card:card_047","card:card_017"]}', true, true)
on conflict (code) do update
  set kind = excluded.kind,
      payload = excluded.payload,
      once = excluded.once,
      active = true;

select code, kind, active from public.ab_redeem_codes order by code;
