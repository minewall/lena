-- ============================================================================
-- 20260607000003 — RPC set_tenant_wa_config
--
-- O admin do tenant chama esta função (via supabase.rpc) para conectar o
-- WhatsApp. A função é security definer: ela escreve em tenant_secrets
-- (tabela sem policy de insert) e em wa_numbers numa transação só.
-- ============================================================================

create or replace function public.set_tenant_wa_config(
  p_tenant_id uuid,
  p_phone_e164 text,
  p_display_name text,
  p_phone_number_id text,
  p_waba_id text,
  p_system_user_token text,
  p_verify_token text,
  p_provider text default 'meta_cloud'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_wa_id uuid;
begin
  if not (public.is_tenant_admin(p_tenant_id) or public.is_platform_admin()) then
    raise exception 'access denied' using errcode = 'P0001';
  end if;

  -- secret (token + verify_token + ids)
  insert into public.tenant_secrets (tenant_id, kind, value, meta)
  values (
    p_tenant_id,
    'wa',
    p_system_user_token,
    jsonb_build_object(
      'verify_token', p_verify_token,
      'phone_number_id', p_phone_number_id,
      'waba_id', p_waba_id,
      'provider', p_provider
    )
  )
  on conflict (tenant_id, kind) do update
    set value = excluded.value,
        meta = excluded.meta,
        updated_at = now();

  -- metadados visíveis (sem secret)
  insert into public.wa_numbers (
    tenant_id, phone_e164, display_name, phone_number_id, waba_id, provider, status
  )
  values (
    p_tenant_id, p_phone_e164, p_display_name, p_phone_number_id, p_waba_id, p_provider, 'pending'
  )
  on conflict (tenant_id) do update
    set phone_e164 = excluded.phone_e164,
        display_name = excluded.display_name,
        phone_number_id = excluded.phone_number_id,
        waba_id = excluded.waba_id,
        provider = excluded.provider,
        updated_at = now()
  returning id into new_wa_id;

  return new_wa_id;
end;
$$;

comment on function public.set_tenant_wa_config(uuid, text, text, text, text, text, text, text) is
  'Grava configuração do WhatsApp para um tenant. Apenas admin do tenant ou platform admin pode chamar.';

revoke execute on function public.set_tenant_wa_config(uuid, text, text, text, text, text, text, text)
  from public, anon;
