# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M2 (grammaire + dashboard parent v1)

## Dernière action terminée :

M2 sous-étape 1 : schéma + contenu grammaire. Migration `20260705090000_m2_grammar_module.sql` (colonne `content_items.choices` jsonb pour les options de QCM, colonne `sessions.module` vocab|grammar) appliquée en local ET sur l'hébergé (`supabase db push` après re-link — le mot de passe DB est lu depuis `SUPABASE_DB_PASSWORD` de `.env.local`, jamais affiché). 41 drills de grammaire A2 dans `src/data/grammar.json` (présent, hebben/zijn, négation, inversion, perfectum, modaux, pronoms, pluriel, interrogatifs), `supabase/generate-seed.mjs` régénère `seed.sql` (upsert), 105 items globaux seedés sur l'hébergé. Types Supabase régénérés (via `--db-url`, le mode `--local` échouait en auth). Repo/pages adaptés (filtre vocab provisoire, l'UI drill arrive en M2.2). RLS 18/18 ✅, 30 tests ✅, build ✅.

## Prochaine action à faire :

M2 sous-étape 2 : écran de drill grammaire — Session paramétrée par module (`/session?m=vocab|grammar`), UI QCM (correct = Réussi, faux = À revoir + re-mise en file), accueil à deux modules avec compteurs par modalité, `SessionRecord.module` renseigné, XP inchangé, tests à jour. Puis M2.3 : dashboard parent v1 (`/parent`, calendrier 4 semaines, minutes/jour, taux de réussite global + par module, agrégations pures testées dans `src/lib/dashboard.ts`). Puis M2.4 : vérif E2E Playwright + prod, STATUS/annonce. NB : l'auto-déploiement Vercel au push sur `main` est actif (app GitHub installée par Pierre) — la base hébergée doit toujours être migrée AVANT le push.

## Décisions en attente de validation par Pierre :

- Faire vérifier le contenu de départ par un néerlandophone (PRD §13) : les 64 mots (`src/data/vocab.json`) ET les 41 drills de grammaire (`src/data/grammar.json`) — générés par Claude, non validés par un tiers.
- (Résolu 2026-07-05 : auto-déploiement Vercel au push sur `main` actif ; repo public confirmé par Pierre.)

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session (dont « du 1er coup ») repartent de zéro — l'état SRS par carte est lui bien persisté après chaque réponse. Cosmétique, assumé pour M0 (noté dans DECISIONS.md).
- Le PRD a été reformaté une fois par Prettier (tables réalignées, contenu inchangé) ; `docs/PRD.md` est désormais dans `.prettierignore`.
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
