# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M2 (grammaire + dashboard parent v1)

## Dernière action terminée :

M2 sous-étape 2 : écran de drill grammaire. Session paramétrée par module (`/session?m=vocab|grammar`), UI QCM (options mélangées, bonne réponse = qualité 5 avec feedback 700 ms, faute = surlignage correct/choisi + bouton « Compris, on la retravaillera » qui re-met la carte en fin de file), accueil à deux cartes-modules (📚 Vocabulaire / 🧩 Grammaire) avec compteurs par modalité, `SessionRecord.module` renseigné et poussé/tiré via Supabase, bilan libellé par module. Helpers purs `src/lib/modules.ts` (itemsForModule, shuffle Fisher-Yates injectable) testés. 33 tests ✅, lint/build ✅, vérifié au runtime via Playwright (drill complet avec une faute volontaire + non-régression vocab). (M2.1 : migration choices/module + 41 drills seedés local & hébergé, RLS 18/18 ✅.)

## Prochaine action à faire :

M2 sous-étape 3 : dashboard parent v1 — page `/parent` réservée au rôle parent (même garde que /import), lien depuis /config : calendrier 4 semaines des jours travaillés, minutes/jour, taux de réussite global + par module (via `sessions.module`), streak/XP de l'élève ; agrégations pures testées dans `src/lib/dashboard.ts` ; lecture des sessions de l'élève via les policies parent déjà testées (`is_parent_of`). Puis M2.4 : vérif E2E Playwright (drill + dashboard avec données), vérif prod, STATUS/annonce. NB : l'auto-déploiement Vercel au push sur `main` est actif — la base hébergée doit toujours être migrée AVANT le push (fait pour M2).

## Décisions en attente de validation par Pierre :

- Faire vérifier le contenu de départ par un néerlandophone (PRD §13) : les 64 mots (`src/data/vocab.json`) ET les 41 drills de grammaire (`src/data/grammar.json`) — générés par Claude, non validés par un tiers.
- (Résolu 2026-07-05 : auto-déploiement Vercel au push sur `main` actif ; repo public confirmé par Pierre.)

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session (dont « du 1er coup ») repartent de zéro — l'état SRS par carte est lui bien persisté après chaque réponse. Cosmétique, assumé pour M0 (noté dans DECISIONS.md).
- Le PRD a été reformaté une fois par Prettier (tables réalignées, contenu inchangé) ; `docs/PRD.md` est désormais dans `.prettierignore`.
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
