# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M1 (sous-étapes 1-3/5 terminées : XP+streak, schéma+RLS, sync app)

## Dernière action terminée :

M1 sous-étape 3 : intégration Supabase dans l'app. `src/lib/supabase.ts` (client derrière env, null = mode local), `src/lib/repo.ts` (couche d'accès : write-through localStorage→cloud, file de retry `klaar.pushqueue.v1`, migration unique des données pré-connexion, pull serveur au démarrage), écran `/config` (login + wizard « créer le foyer » : compte parent, compte élève en plus-addressing, l'appareil reste connecté élève). Vérifié E2E au navigateur contre le stack local : migration (8 SRS + session + 100 XP), write-through, pull sur 2e appareil, login parent. `.env.local` (gitignoré) pointe le stack local pour ces tests.

## Prochaine action à faire :

M1 sous-étape 4 : écran d'import de contenu (réservé au parent connecté) — coller du texte (une ligne = `mot néerlandais ; traduction`, ou JSON), prévisualisation/validation, insertion dans `content_items` du foyer avec `theme`/`curriculum_unit`. Puis sous-étape 5 : brancher le projet Supabase HÉBERGÉ — **nécessite `npx supabase login` par Pierre** — créer le projet, `supabase link`, `supabase db push`, seed, désactiver la confirmation d'email (Auth > Sign In / Up), mettre `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` dans Vercel (`npx vercel env add`), redéployer, re-vérifier le wizard en prod.

## Décisions en attente de validation par Pierre :

- **Supabase** : lancer `npx supabase login` (interactif, ouvre le navigateur) pour que je puisse créer le projet hébergé et pousser les migrations.
- Faire vérifier les 64 mots de vocabulaire de départ (`src/data/vocab.json`) par un néerlandophone (PRD §13) — générés par Claude, non validés par un tiers.
- Installer l'app GitHub de Vercel (https://vercel.link/git) pour l'auto-déploiement à chaque push. En attendant, déploiement manuel via `npx vercel deploy --prod --yes` (CLI authentifié, compte psaelens-8216, projet `klaar`, prod : https://klaar-nine.vercel.app).
- Le repo GitHub `psaelens/klaar` (créé par Pierre) est **public** — confirmer que c'est voulu pour une app familiale.

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session (dont « du 1er coup ») repartent de zéro — l'état SRS par carte est lui bien persisté après chaque réponse. Cosmétique, assumé pour M0 (noté dans DECISIONS.md).
- Le PRD a été reformaté une fois par Prettier (tables réalignées, contenu inchangé) ; `docs/PRD.md` est désormais dans `.prettierignore`.
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
