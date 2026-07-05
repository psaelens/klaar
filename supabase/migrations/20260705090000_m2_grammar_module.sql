-- M2 : drills de grammaire + dashboard parent.
-- * content_items.choices : options d'un drill à choix (jsonb, tableau de textes
--   incluant la bonne réponse `back`) ; null pour le vocabulaire (flashcards).
-- * sessions.module : modalité de la session (vocab | grammar), null pour les
--   sessions d'avant M2 (toutes vocabulaire). Permet le taux de réussite par
--   compétence du dashboard parent (PRD §9).

alter table public.content_items
  add column choices jsonb
  check (choices is null or jsonb_typeof(choices) = 'array');

alter table public.sessions
  add column module text
  check (module is null or module in ('vocab', 'grammar'));
