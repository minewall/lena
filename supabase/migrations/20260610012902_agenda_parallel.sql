-- ============================================================================
-- 20260609000004 — permite agendamentos paralelos por profissional
--
-- Remove as EXCLUSION constraints de sobreposição por profissional e por slot
-- avulso. A plataforma deixa de ser o árbitro de capacidade: cada negócio
-- gerencia sua própria agenda. Casos de uso: profissional inicia coloração
-- (60min) e faz escova em outro cliente enquanto aguarda; médico com grupo
-- de terapia + consulta individual simultânea; etc.
--
-- find_free_slots continua checando sobreposição — utilizada pela Lena para
-- sugerir horários "limpos". O agendamento manual da Central pode sobrepor.
-- O RPC book_appointment mantém a checagem de past_time.
-- ============================================================================

alter table public.appointments
  drop constraint if exists appts_staff_no_overlap,
  drop constraint if exists appts_unassigned_no_overlap;
