-- ============================================================================
-- 20260608000010 — carimbo de quando o prospect mudou de estágio no funil
--
-- updated_at muda em qualquer edição (inclusive notas). Para ordenar o Kanban
-- por "movido de um estágio para outro" precisamos de um timestamp dedicado,
-- atualizado SÓ quando funil muda.
-- ============================================================================

alter table public.prospects
  add column funil_changed_at timestamptz not null default now();

-- backfill: updated_at é a melhor aproximação do último movimento existente
update public.prospects set funil_changed_at = updated_at;

create or replace function public.touch_prospect_funil_changed()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.funil is distinct from old.funil then
    new.funil_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger prospects_touch_funil_changed
  before update on public.prospects
  for each row execute function public.touch_prospect_funil_changed();
