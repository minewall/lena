-- ============================================================================
-- 20260608000007 — RPCs de agenda: find_free_slots, book_appointment,
-- cancel_appointment
--
-- Todas security definer com check de membership. Trabalham no timezone do
-- tenant para gerar/interpretar horários corretamente.
-- ============================================================================

-- ───────── find_free_slots ─────────
-- Devolve horários livres num intervalo de datas, respeitando
-- tenant_availability e os appointments já marcados.
create or replace function public.find_free_slots(
  p_tenant_id uuid,
  p_from date,
  p_to date,
  p_duration_min int default null,
  p_limit int default 30
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  tz text;
  d date;
  av record;
  dur int;
  cur_min int;
  s_start timestamptz;
  s_end timestamptz;
  found int := 0;
begin
  if not (public.is_tenant_member(p_tenant_id) or public.is_platform_admin()) then
    raise exception 'access denied' using errcode = 'P0001';
  end if;

  select timezone into tz from public.tenants where id = p_tenant_id;
  tz := coalesce(tz, 'America/Sao_Paulo');

  d := greatest(p_from, (now() at time zone tz)::date);
  while d <= p_to and found < p_limit loop
    for av in
      select * from public.tenant_availability
      where tenant_id = p_tenant_id
        and active
        and weekday = extract(dow from d)::int
      order by start_minute
    loop
      dur := coalesce(p_duration_min, av.slot_minutes);
      cur_min := av.start_minute;
      while cur_min + dur <= av.end_minute and found < p_limit loop
        -- monta timestamptz no timezone do tenant
        s_start := (d::text || ' ' ||
          to_char((cur_min / 60), 'FM00') || ':' ||
          to_char((cur_min % 60), 'FM00') || ':00')::timestamp
          at time zone tz;
        s_end := s_start + make_interval(mins => dur);

        -- só horários futuros
        if s_start > now() then
          -- livre? (sem appointment ativo sobreposto)
          if not exists (
            select 1 from public.appointments a
            where a.tenant_id = p_tenant_id
              and a.status in ('booked', 'confirmed', 'done')
              and tstzrange(a.starts_at, a.ends_at) && tstzrange(s_start, s_end)
          ) then
            slot_start := s_start;
            slot_end := s_end;
            found := found + 1;
            return next;
          end if;
        end if;

        cur_min := cur_min + av.slot_minutes;
      end loop;
    end loop;
    d := d + 1;
  end loop;
end;
$$;

revoke execute on function public.find_free_slots(uuid, date, date, int, int) from public, anon;
grant execute on function public.find_free_slots(uuid, date, date, int, int) to authenticated;

-- ───────── book_appointment ─────────
-- Cria um agendamento. A EXCLUSION constraint garante atomicamente que não
-- haja sobreposição; se houver, devolve erro tratável.
create or replace function public.book_appointment(
  p_tenant_id uuid,
  p_starts_at timestamptz,
  p_duration_min int,
  p_customer_name text default null,
  p_contact_id uuid default null,
  p_service_id uuid default null,
  p_conversation_id uuid default null,
  p_origin public.appointment_origin default 'lena',
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_id uuid;
  v_ends timestamptz := p_starts_at + make_interval(mins => greatest(p_duration_min, 5));
begin
  if not (public.is_tenant_member(p_tenant_id) or public.is_platform_admin()) then
    raise exception 'access denied' using errcode = 'P0001';
  end if;

  if p_starts_at <= now() then
    return jsonb_build_object('ok', false, 'error', 'past_time');
  end if;

  begin
    insert into public.appointments (
      tenant_id, contact_id, service_id, conversation_id,
      starts_at, ends_at, origin, customer_name, notes
    )
    values (
      p_tenant_id, p_contact_id, p_service_id, p_conversation_id,
      p_starts_at, v_ends, p_origin, p_customer_name, p_notes
    )
    returning id into new_id;
  exception when exclusion_violation then
    return jsonb_build_object('ok', false, 'error', 'slot_taken');
  end;

  return jsonb_build_object('ok', true, 'appointment_id', new_id, 'ends_at', v_ends);
end;
$$;

revoke execute on function public.book_appointment(uuid, timestamptz, int, text, uuid, uuid, uuid, public.appointment_origin, text) from public, anon;
grant execute on function public.book_appointment(uuid, timestamptz, int, text, uuid, uuid, uuid, public.appointment_origin, text) to authenticated;

-- ───────── cancel_appointment ─────────
create or replace function public.cancel_appointment(
  p_appointment_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  appt record;
begin
  select * into appt from public.appointments where id = p_appointment_id;
  if appt is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if not (public.is_tenant_member(appt.tenant_id) or public.is_platform_admin()) then
    raise exception 'access denied' using errcode = 'P0001';
  end if;

  update public.appointments
  set status = 'cancelled',
      notes = coalesce(notes, '') ||
        case when p_reason is not null then ' [cancelado: ' || p_reason || ']' else '' end
  where id = p_appointment_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.cancel_appointment(uuid, text) from public, anon;
grant execute on function public.cancel_appointment(uuid, text) to authenticated;
