# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M2 (grammaire + dashboard parent v1)

## Dernière action terminée :

M2 sous-étape 3 : dashboard parent v1. Page `/parent` réservée au rôle parent (lien « Suivi de l'élève » dans /config), sélecteur d'enfant si plusieurs : calendrier 4 semaines (intensité = minutes/jour, jour travaillé = ≥ 1 session même courte), streak, XP total, minutes des 7 derniers jours, taux de réussite du 1er coup global + par module (les sessions d'avant M2 comptent comme vocab). Agrégations pures dans `src/lib/dashboard.ts` (dailyActivity, successRate, successRateByModule, minutesInLastDays) testées — 40 tests ✅. Vérifié E2E local (Playwright, stack Docker) : foyer créé, élève fait une session vocab + une grammaire (avec une faute), parent se connecte sur un 2e appareil et voit « Suivi de Théo » (streak 1, ⭐ 210, 94 % global, vocab 100 % / grammaire 88 %) ; l'élève est refusé sur /parent.

## Prochaine action à faire :

M2 sous-étape 4 (dernière) : pousser le commit M2.3 (auto-déploiement), vérifier le flux complet EN PROD (foyer de test → sessions → dashboard parent → nettoyage des comptes de test ET du foyer orphelin via service key), mettre à jour `.claude/skills/verify/SKILL.md`, puis annonce M2 terminé à Pierre. NB : la base hébergée est déjà migrée + seedée (fait en M2.1, avant tout push).

## Décisions en attente de validation par Pierre :

- Faire vérifier le contenu de départ par un néerlandophone (PRD §13) : les 64 mots (`src/data/vocab.json`) ET les 41 drills de grammaire (`src/data/grammar.json`) — générés par Claude, non validés par un tiers.
- (Résolu 2026-07-05 : auto-déploiement Vercel au push sur `main` actif ; repo public confirmé par Pierre.)

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session (dont « du 1er coup ») repartent de zéro — l'état SRS par carte est lui bien persisté après chaque réponse. Cosmétique, assumé pour M0 (noté dans DECISIONS.md).
- Le PRD a été reformaté une fois par Prettier (tables réalignées, contenu inchangé) ; `docs/PRD.md` est désormais dans `.prettierignore`.
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
