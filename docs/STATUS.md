# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M0 terminée et déployée → prochaine étape M1

## Dernière action terminée :

M0 déployé en production sur **https://klaar-nine.vercel.app** et vérifié au navigateur (Playwright) : flashcards vocab NL→FR avec SRS SM-2 (10 tests unitaires verts), 64 mots de départ en JSON, localStorage, mode sombre, fallback SPA Vercel. Repo GitHub : https://github.com/psaelens/klaar (branche `main`).

## Prochaine action à faire :

Démarrer M1 (PRD §11) : 1) vérifier si le CLI Supabase est authentifié (`npx supabase projects list`) — sinon demander à Pierre de créer le projet Supabase (gratuit) ; 2) `npx supabase init` + première migration SQL versionnée (tables `users`, `content_items`, `srs_state`, `sessions`, `attempts`, `xp_ledger` du PRD §7) **avec RLS activée dès cette première migration** ; 3) sync de l'état SRS local vers Supabase avec migration transparente des données localStorage existantes ; 4) streak + XP (fonctions pures testées) ; 5) écran d'import de contenu.

## Décisions en attente de validation par Pierre :

- Faire vérifier les 64 mots de vocabulaire de départ (`src/data/vocab.json`) par un néerlandophone (PRD §13) — générés par Claude, non validés par un tiers.
- Installer l'app GitHub de Vercel (https://vercel.link/git) pour l'auto-déploiement à chaque push (`vercel git connect` a échoué faute d'app installée). En attendant, le déploiement se fait manuellement via `npx vercel deploy --prod --yes` — le CLI Vercel est authentifié sur cette machine (compte psaelens-8216, projet `klaar`).
- Le repo GitHub `psaelens/klaar` (créé par Pierre) est **public** — confirmer que c'est voulu pour une app familiale.

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session (dont « du 1er coup ») repartent de zéro — l'état SRS par carte est lui bien persisté après chaque réponse. Cosmétique, assumé pour M0 (noté dans DECISIONS.md).
- Le PRD a été reformaté une fois par Prettier (tables réalignées, contenu inchangé) ; `docs/PRD.md` est désormais dans `.prettierignore`.
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
