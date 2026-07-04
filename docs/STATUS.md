# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M1 (sous-étape 1/5 terminée : XP + streak)

## Dernière action terminée :

XP + streak livrés (M1 sous-étape 1) : fonctions pures `src/lib/xp.ts` (XP pondéré difficulté, raté = 0, bonus complétion +20, plafond anti-farming 300/session) et `src/lib/streak.ts` (jours consécutifs, seuil minutes paramétrable — 0 tant que seul le vocab existe), 14 nouveaux tests (24 au total). Session enregistre durée + XP ; accueil affiche pastilles 🔥 streak / ⭐ XP ; bilan affiche +XP. Vérifié au navigateur (Playwright, recette `.claude/skills/verify/SKILL.md`).

## Prochaine action à faire :

M1 sous-étape 2 : `npx supabase init` + migration SQL `0001` (households, profiles, content_items, srs_state, sessions, xp_ledger — RLS activée sur TOUTES les tables dès cette migration : enfant lit/écrit ses données, parent lit le foyer) + test du stack local (`npx supabase start`, Docker est dispo et fonctionnel sur cette machine). **Blocage partiel** : le CLI Supabase n'est PAS authentifié (`npx supabase projects list` → LegacyPlatformAuthRequiredError) — Pierre doit taper `! npx supabase login` dans la session (ou fournir SUPABASE_ACCESS_TOKEN) pour créer/lier le projet hébergé. Le développement local (migrations + tests RLS) avance sans ça.

## Décisions en attente de validation par Pierre :

- **Supabase** : lancer `npx supabase login` (interactif, ouvre le navigateur) pour que je puisse créer le projet hébergé et pousser les migrations.
- Faire vérifier les 64 mots de vocabulaire de départ (`src/data/vocab.json`) par un néerlandophone (PRD §13) — générés par Claude, non validés par un tiers.
- Installer l'app GitHub de Vercel (https://vercel.link/git) pour l'auto-déploiement à chaque push. En attendant, déploiement manuel via `npx vercel deploy --prod --yes` (CLI authentifié, compte psaelens-8216, projet `klaar`, prod : https://klaar-nine.vercel.app).
- Le repo GitHub `psaelens/klaar` (créé par Pierre) est **public** — confirmer que c'est voulu pour une app familiale.

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session (dont « du 1er coup ») repartent de zéro — l'état SRS par carte est lui bien persisté après chaque réponse. Cosmétique, assumé pour M0 (noté dans DECISIONS.md).
- Le PRD a été reformaté une fois par Prettier (tables réalignées, contenu inchangé) ; `docs/PRD.md` est désormais dans `.prettierignore`.
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
