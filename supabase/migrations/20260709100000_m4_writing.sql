-- M4 : expression écrite guidée.
-- * content_items.type : la modalité `writing` remplace le `writing_prompt` du
--   PRD §7 pour garder l'invariant type = modalité (comme vocab/grammar/
--   listening) ; `speaking` normalisé de la même façon en vue de M5.
-- * content_items.checklist : points attendus de la rédaction (jsonb, tableau
--   de textes FR) — support de l'auto-évaluation guidée, pas de juge
--   automatique (PRD §13).
-- * sessions.module : la modalité `writing` devient valide.

alter table public.content_items
  drop constraint content_items_type_check;
alter table public.content_items
  add constraint content_items_type_check
  check (type in ('vocab', 'grammar', 'listening', 'reading', 'writing', 'speaking'));

alter table public.content_items
  add column checklist jsonb;

alter table public.sessions
  drop constraint sessions_module_check;
alter table public.sessions
  add constraint sessions_module_check
  check (module is null or module in ('vocab', 'grammar', 'listening', 'writing'));
