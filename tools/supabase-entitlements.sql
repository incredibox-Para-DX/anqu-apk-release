-- 服务端权益 / 兑换码校验（在 Supabase SQL Editor 执行一次）
-- 说明：客户端不再直接读写这些表，只调用下面两个函数（SECURITY DEFINER）。

create table if not exists public.ab_entitlements (
  uid text not null,
  ekey text not null,
  evalue text,
  created_at timestamptz not null default now(),
  primary key (uid, ekey)
);
alter table public.ab_entitlements enable row level security;

create table if not exists public.ab_redeem_codes (
  code text primary key,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  once boolean not null default true,
  active boolean not null default true,
  max_uses int,
  used_count int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.ab_redeem_codes enable row level security;

create table if not exists public.ab_redeem_log (
  id bigserial primary key,
  uid text not null,
  code text not null,
  created_at timestamptz not null default now(),
  unique (uid, code)
);
alter table public.ab_redeem_log enable row level security;

create or replace function public.redeem_code(p_uid text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.ab_redeem_codes%rowtype;
  v_used int;
begin
  if p_uid is null or length(trim(p_uid)) = 0 or p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('ok', false, 'message', '参数错误');
  end if;

  select * into v_code
    from public.ab_redeem_codes
   where upper(code) = upper(trim(p_code)) and active = true;

  if not found then
    return jsonb_build_object('ok', false, 'message', '兑换码不存在或已失效');
  end if;

  select count(*) into v_used
    from public.ab_redeem_log
   where uid = p_uid and code = v_code.code;

  if v_code.once and v_used > 0 then
    return jsonb_build_object('ok', false, 'message', '该兑换码你已使用过');
  end if;

  if v_code.max_uses is not null and v_code.used_count >= v_code.max_uses then
    return jsonb_build_object('ok', false, 'message', '兑换码已达使用上限');
  end if;

  insert into public.ab_redeem_log(uid, code) values (p_uid, v_code.code)
    on conflict do nothing;

  update public.ab_redeem_codes set used_count = used_count + 1 where code = v_code.code;

  if v_code.kind = 'card' then
    insert into public.ab_entitlements(uid, ekey, evalue)
    values (p_uid, 'card:' || coalesce(v_code.payload->>'card_id', ''), '1')
    on conflict (uid, ekey) do update set evalue = '1';
  else
    insert into public.ab_entitlements(uid, ekey, evalue)
    values (p_uid, v_code.kind, coalesce(v_code.payload::text, '1'))
    on conflict (uid, ekey) do update set evalue = coalesce(v_code.payload::text, '1');
  end if;

  return jsonb_build_object('ok', true, 'kind', v_code.kind, 'payload', v_code.payload, 'message', '兑换成功');
end;
$$;

create or replace function public.get_entitlements(p_uid text)
returns table(ekey text, evalue text)
language sql
security definer
set search_path = public
as $$
  select ekey, evalue from public.ab_entitlements where uid = p_uid;
$$;

revoke all on public.ab_entitlements from anon, authenticated;
revoke all on public.ab_redeem_codes from anon, authenticated;
revoke all on public.ab_redeem_log from anon, authenticated;
grant execute on function public.redeem_code(text, text) to anon, authenticated;
grant execute on function public.get_entitlements(text) to anon, authenticated;

-- 现有兑换码迁移（之前已兑换的本地权益不受影响）
insert into public.ab_redeem_codes(code, kind, payload, once) values
 ('Camona', 'value', '{"amount":20000000}', true),
 ('hefunadmin', 'gm', '{}', true),
 ('ItemPool', 'item_pool', '{}', true),
 ('Destiny', 'skill', '{"skill":"destiny_pity"}', true),
 ('CARD030', 'card', '{"card_id":"card_030"}', true),
 ('CARD052', 'card', '{"card_id":"card_052"}', true),
 ('CARD047', 'card', '{"card_id":"card_047"}', true),
 ('CARD017', 'card', '{"card_id":"card_017"}', true),
 ('GOLDNAME', 'gold_name', '{}', true)
on conflict (code) do update set kind = excluded.kind, payload = excluded.payload, active = true;
