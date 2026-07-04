# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M1 (sous-étapes 1-4/5 terminées ; reste : projet Supabase hébergé)

## Dernière action terminée :

M1 sous-étape 4 : écran `/import` (réservé au parent connecté) — collage de texte `mot néerlandais ; traduction` ligne par ligne, parseur pur testé (`src/lib/importParse.ts`, 6 tests — 30 au total), prévisualisation avec erreurs par ligne (séparateur manquant, doublons), champs thème/unité/difficulté, insertion dans `content_items` du foyer. Lien depuis `/config` quand le rôle est parent. Vérifié E2E contre le stack local : import parent OK, élève bloqué, mots visibles côté serveur.

## Prochaine action à faire :

M1 sous-étape 5 (dernière) : brancher le projet Supabase HÉBERGÉ — **nécessite `npx supabase login` par Pierre** (taper `! npx supabase login` dans la session Claude). Ensuite : `npx supabase projects create klaar` (ou choisir un projet existant), `npx supabase link --project-ref <ref>`, `npx supabase db push`, appliquer le seed (`psql` ou copier seed.sql dans le SQL editor), désactiver la confirmation d'email (Dashboard > Auth > Sign In/Up > Email > Confirm email OFF), mettre `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` dans Vercel (`npx vercel env add`), redéployer, vérifier le wizard foyer en prod. Après ça M1 est terminé → M2 (grammaire drills + dashboard parent v1).

## Décisions en attente de validation par Pierre :

- **Supabase** : lancer `npx supabase login` (interactif, ouvre le navigateur) pour que je puisse créer le projet hébergé et pousser les migrations.
- Faire vérifier les 64 mots de vocabulaire de départ (`src/data/vocab.json`) par un néerlandophone (PRD §13) — générés par Claude, non validés par un tiers.
- Installer l'app GitHub de Vercel (https://vercel.link/git) pour l'auto-déploiement à chaque push. En attendant, déploiement manuel via `npx vercel deploy --prod --yes` (CLI authentifié, compte psaelens-8216, projet `klaar`, prod : https://klaar-nine.vercel.app).
- Le repo GitHub `psaelens/klaar` (créé par Pierre) est **public** — confirmer que c'est voulu pour une app familiale.

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session (dont « du 1er coup ») repartent de zéro — l'état SRS par carte est lui bien persisté après chaque réponse. Cosmétique, assumé pour M0 (noté dans DECISIONS.md).
- Le PRD a été reformaté une fois par Prettier (tables réalignées, contenu inchangé) ; `docs/PRD.md` est désormais dans `.prettierignore`.
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
