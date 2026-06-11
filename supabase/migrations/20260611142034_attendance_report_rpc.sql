-- Relatório de atendimento da Central: sentimento + esforço + funil hora×tipo,
-- num único JSON. security_invoker → respeita a RLS de quem chama (admin do
-- tenant vê só o seu; platform admin filtra pelo p_tenant_id).
create or replace function public.attendance_report(p_tenant_id uuid, p_days int default 30)
returns json
language sql
stable
security invoker
set search_path = public
as $$
  with janela as (
    select c.* from public.conversations c
     where c.tenant_id = p_tenant_id
       and c.opened_at >= now() - make_interval(days => p_days)
  )
  select json_build_object(
    'total', (select count(*) from janela),
    'classificadas', (select count(*) from janela where classified_at is not null),
    'sentiment', (
      select coalesce(json_agg(json_build_object('sentiment', sentiment, 'n', n) order by n desc), '[]'::json)
      from (
        select sentiment, count(*) n from janela
         where classified_at is not null and sentiment is not null
         group by sentiment
      ) s
    ),
    'effort', (
      select coalesce(json_agg(json_build_object('desfecho', desfecho, 'n', n, 'trocas_medias', tm) order by n desc), '[]'::json)
      from (
        select desfecho, count(*) n, round(avg(trocas_ate_desfecho), 1) tm
        from public.conversation_effort
         where tenant_id = p_tenant_id
           and opened_at >= now() - make_interval(days => p_days)
         group by desfecho
      ) e
    ),
    'funnel', (
      select coalesce(json_agg(json_build_object(
        'hora', hora_local, 'tipo', tipo, 'n', conversas, 'agendamentos', agendamentos
      )), '[]'::json)
      from public.attendance_funnel
       where tenant_id = p_tenant_id
    )
  );
$$;
