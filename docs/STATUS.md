# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M1 (sous-étapes 1-2/5 terminées : XP+streak, schéma Supabase+RLS)

## Dernière action terminée :

M1 sous-étape 2 : migration `supabase/migrations/20260704120000_initial_schema.sql` (households, profiles, content_items, srs_state, sessions, xp_ledger — RLS sur toutes les tables, grants explicites, RPC atomique `create_household_with_profile`), seed des 64 items vocab, types générés (`src/lib/database.types.ts`), et **18/18 vérifications RLS vertes** contre le stack local Docker (`node supabase/tests/rls-check.mjs`). `@supabase/supabase-js` installé.

## Prochaine action à faire :

M1 sous-étape 3 : intégration app — client Supabase derrière variables d'env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, mode local si absentes), écrans d'onboarding (création foyer parent, profil enfant, connexion) et couche de sync : lecture contenu depuis `content_items`, écriture `srs_state`/`sessions`/`xp_ledger`, migration transparente des données localStorage existantes au premier login. **Toujours en attente** : `npx supabase login` par Pierre pour créer le projet hébergé et y pousser la migration (`supabase link` + `supabase db push`) ; le dev/test se fait sur le stack local Docker en attendant.

## Décisions en attente de validation par Pierre :

- **Supabase** : lancer `npx supabase login` (interactif, ouvre le navigateur) pour que je puisse créer le projet hébergé et pousser les migrations.
- Faire vérifier les 64 mots de vocabulaire de départ (`src/data/vocab.json`) par un néerlandophone (PRD §13) — générés par Claude, non validés par un tiers.
- Installer l'app GitHub de Vercel (https://vercel.link/git) pour l'auto-déploiement à chaque push. En attendant, déploiement manuel via `npx vercel deploy --prod --yes` (CLI authentifié, compte psaelens-8216, projet `klaar`, prod : https://klaar-nine.vercel.app).
- Le repo GitHub `psaelens/klaar` (créé par Pierre) est **public** — confirmer que c'est voulu pour une app familiale.

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session (dont « du 1er coup ») repartent de zéro — l'état SRS par carte est lui bien persisté après chaque réponse. Cosmétique, assumé pour M0 (noté dans DECISIONS.md).
- Le PRD a été reformaté une fois par Prettier (tables réalignées, contenu inchangé) ; `docs/PRD.md` est désormais dans `.prettierignore`.
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
