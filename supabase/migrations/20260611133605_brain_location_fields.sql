-- Localização no Cérebro (ideia Roberto 2026-06-10): a Lena responde
-- "onde vocês ficam" com objetividade e envia links de Google Maps/Waze
-- após confirmar agendamento. address já existia (mas não entrava no
-- prompt); aqui entram estacionamento e ponto de referência.
alter table public.tenant_brains
  add column parking text,
  add column landmark text;
