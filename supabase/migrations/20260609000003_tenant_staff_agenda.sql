-- ============================================================================
-- 20260609000003 — profissionais por tenant + agenda multi-profissional
--
-- tenant_staff: profissionais/colaboradores do negócio (independente de login).
-- appointments: adiciona staff_id + reschedule_requested_at.
-- EXCLUSION: substituída por duas constraints parciais (por profissional /
--            por slot genérico sem profissional).
-- RPCs:  find_free_slots e book_appointment ganham p_staff_id opcional.
--        request_reschedule: verifica janela 24h WhatsApp e marca reagendamento.
-- ============================================================================

-- ───────── tenant_staff ─────────
create table public.tenant_staff (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  name       text not null,
  role       text,            -- livre: "Médico", "Tosador", "Professor", etc.
  color      text not null default '#579bfc',  -- hex da paleta fixa
  active     boolean not null default true,
  position   integer not null default 0,       -- ordem nas colunas
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tenant_staff is
  'Profissionais/colaboradores do tenant. Independente de login — genérico para '
  'qualquer tipo de negócio (médico, tosador, professor, instrutor…).';

create index tenant_staff_tenant_idx
  on public.tenant_staff (tenant_id, position)
  where active;

create trigger tenant_staff_touch_updated_at
  before update on public.tenant_staff
  for each row execute function public.touch_updated_at();

alter table public.tenant_staff enable row level security;

create policy "staff: members read"
  on public.tenant_staff for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

create policy "staff: admin manage"
  on public.tenant_staff for all
  using  (public.is_tenant_admin(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

-- ───────── appointments: novos campos ─────────
alter table public.appointments
  add column staff_id                uuid references public.tenant_staff (id) on delete set null,
  add column reschedule_requested_at timestamptz;

create index appointments_staff_idx
  on public.appointments (tenant_id, staff_id, starts_at)
  where status in ('booked', 'confirmed');

-- ───────── EXCLUSION: substituir constraint tenant-wide por duas parciais ─────
-- A antiga bloqueava qualquer dois agendamentos simultâneos no mesmo tenant,
-- o que impede múltiplos profissionais atenderem ao mesmo tempo.
-- Nova lógica:
--   1. Staff definido → bloqueio é POR profissional (mesmo tenant + mesmo staff)
--   2. Sem staff     → mantém bloqueio tenant-wide para slots "avulsos"
alter table public.appointments
  drop constraint appointments_no_overlap;

alter table public.appointments
  add constraint appts_staff_no_overlap
  exclude using gist (
    tenant_id with =,
    staff_id  with =,
    tstzrange(starts_at, ends_at) with &&
  )
  where (status in ('booked', 'confirmed', 'done') and staff_id is not null);

alter table public.appointments
  add constraint appts_unassigned_no_overlap
  exclude using gist (
    tenant_id with =,
    tstzrange(starts_at, ends_at) with &&
  )
  where (status in ('booked', 'confirmed', 'done') and staff_id is null);

-- ───────── find_free_slots (atualizado com p_staff_id) ─────────
create or replace function public.find_free_slots(
  p_tenant_id    uuid,
  p_from         date,
  p_to           date,
  p_duration_min int  default null,
  p_limit        int  default 30,
  p_staff_id     uuid default null
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  tz      text;
  d       date;
  av      record;
  dur     int;
  cur_min int;
  s_start timestamptz;
  s_end   timestamptz;
  found   int := 0;
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
      dur     := coalesce(p_duration_min, av.slot_minutes);
      cur_min := av.start_minute;
      while cur_min + dur <= av.end_minute and found < p_limit loop
        s_start := (d::text || ' ' ||
          to_char((cur_min / 60), 'FM00') || ':' ||
          to_char((cur_min % 60), 'FM00') || ':00')::timestamp
          at time zone tz;
        s_end := s_start + make_interval(mins => dur);

        if s_start > now() then
          -- livre? considera sobreposição apenas para o mesmo staff (ou geral)
          if not exists (
            select 1 from public.appointments a
            where a.tenant_id = p_tenant_id
              and a.status in ('booked', 'confirmed', 'done')
              and tstzrange(a.starts_at, a.ends_at) && tstzrange(s_start, s_end)
              and (
                (p_staff_id is null     and a.staff_id is null) or
                (p_staff_id is not null and a.staff_id = p_staff_id)
              )
          ) then
            slot_start := s_start;
            slot_end   := s_end;
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

revoke execute on function public.find_free_slots(uuid,date,date,int,int,uuid) from public, anon;
grant  execute on function public.find_free_slots(uuid,date,date,int,int,uuid) to authenticated;

-- ───────── book_appointment (atualizado com p_staff_id) ─────────
create or replace function public.book_appointment(
  p_tenant_id       uuid,
  p_starts_at       timestamptz,
  p_duration_min    int,
  p_customer_name   text  default null,
  p_contact_id      uuid  default null,
  p_service_id      uuid  default null,
  p_conversation_id uuid  default null,
  p_origin          public.appointment_origin default 'lena',
  p_notes           text  default null,
  p_staff_id        uuid  default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_id  uuid;
  v_ends  timestamptz := p_starts_at + make_interval(mins => greatest(p_duration_min, 5));
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
      starts_at, ends_at, origin, customer_name, notes, staff_id
    )
    values (
      p_tenant_id, p_contact_id, p_service_id, p_conversation_id,
      p_starts_at, v_ends, p_origin, p_customer_name, p_notes, p_staff_id
    )
    returning id into new_id;
  exception when exclusion_violation then
    return jsonb_build_object('ok', false, 'error', 'slot_taken');
  end;

  return jsonb_build_object('ok', true, 'appointment_id', new_id, 'ends_at', v_ends);
end;
$$;

revoke execute on function public.book_appointment(uuid,timestamptz,int,text,uuid,uuid,uuid,public.appointment_origin,text,uuid) from public, anon;
grant  execute on function public.book_appointment(uuid,timestamptz,int,text,uuid,uuid,uuid,public.appointment_origin,text,uuid) to authenticated;

-- ───────── request_reschedule ─────────
-- Verifica janela WhatsApp de 24h e marca reagendamento.
-- Retorna: ok, window_open (bool), contact_phone (para contato manual).
create or replace function public.request_reschedule(p_appointment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  appt     record;
  last_msg timestamptz;
  phone    text;
begin
  select a.*, co.phone_e164
    into appt
    from public.appointments a
    left join public.contacts co on co.id = a.contact_id
   where a.id = p_appointment_id;

  if appt is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if not (public.is_tenant_member(appt.tenant_id) or public.is_platform_admin()) then
    raise exception 'access denied' using errcode = 'P0001';
  end if;

  -- última mensagem do contato neste tenant
  select max(c.last_message_at)
    into last_msg
    from public.conversations c
   where c.tenant_id = appt.tenant_id
     and c.contact_id = appt.contact_id;

  update public.appointments
     set reschedule_requested_at = now()
   where id = p_appointment_id;

  return jsonb_build_object(
    'ok',           true,
    'window_open',  (last_msg is not null and last_msg > now() - interval '24 hours'),
    'contact_phone', appt.phone_e164
  );
end;
$$;

revoke execute on function public.request_reschedule(uuid) from public, anon;
grant  execute on function public.request_reschedule(uuid) to authenticated;
