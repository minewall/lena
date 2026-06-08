-- ============================================================================
-- 20260608000001 — habilita Supabase Realtime nas tabelas de inbox
--
-- Permite que a Central da Lena escute INSERT/UPDATE em tempo real sem
-- polling. RLS continua valendo no canal Realtime: o usuário só recebe
-- eventos das linhas que ele já podia ler via SELECT.
-- ============================================================================

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
