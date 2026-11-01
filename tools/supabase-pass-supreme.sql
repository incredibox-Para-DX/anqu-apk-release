-- 尊享通行证兑换码（在 Supabase SQL Editor 执行）
insert into public.ab_redeem_codes(code, kind, payload, once, active)
values ('PASS-S1-SUPREME', 'pass_supreme', '{}', true, true)
on conflict (code) do update
  set kind = excluded.kind,
      payload = excluded.payload,
      active = true;

select code, kind, active from public.ab_redeem_codes where code = 'PASS-S1-SUPREME';
