# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M2 TERMINÉ et déployé → prochaine étape M3

## Dernière action terminée :

M2 sous-étape 4 : vérification prod + clôture. L'auto-déploiement Vercel au push sur `main` est confirmé (un déploiement Ready par commit M2.1/M2.2/M2.3). **Vérifié E2E en production** (https://klaar-nine.vercel.app) : foyer de test créé, les deux modules visibles à l'accueil, session grammaire complète jouée et synchronisée, dashboard parent avec les vraies données (streak 1, ⭐ 110, grammaire 100 %), puis nettoyage complet (2 comptes de test + foyer orphelin supprimés via service key — les éventuelles données réelles du foyer de Pierre n'ont pas été touchées). `.claude/skills/verify/SKILL.md` à jour (flux drills, dashboard, foyer, pièges, procédure prod).

Récap M2 : drills de grammaire QCM sur le SRS commun (41 items A2 seedés, migration `choices`/`module`), accueil à deux modules, dashboard parent v1 (`/parent` : calendrier 4 semaines, minutes/jour, streak, XP, taux de réussite global + par module). 40 tests unitaires ✅, RLS 18/18 ✅.

## Prochaine action à faire :

Démarrer M3 (PRD §11) : compréhension orale (items `listening` : audio + questions — trancher la source audio : TTS ou enregistrements, voir PRD §13/§16 pour les sources gratuites type Karrewiet/Wablieft) + badges (table `badges` du schéma cible §7, codes de badges + attribution à la fin de session + affichage). Réévaluer aussi le seuil de minutes du streak (toujours 0 ; le PRD vise 1 h/jour — avec vocab + grammaire on peut passer à un seuil intermédiaire, à décider avec Pierre).

## Décisions en attente de validation par Pierre :

- Faire vérifier le contenu de départ par un néerlandophone (PRD §13) : les 64 mots (`src/data/vocab.json`) ET les 41 drills de grammaire (`src/data/grammar.json`) — générés par Claude, non validés par un tiers.
- (Résolu 2026-07-05 : auto-déploiement Vercel au push sur `main` actif ; repo public confirmé par Pierre.)

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session (dont « du 1er coup ») repartent de zéro — l'état SRS par carte est lui bien persisté après chaque réponse. Cosmétique, assumé pour M0 (noté dans DECISIONS.md).
- Le PRD a été reformaté une fois par Prettier (tables réalignées, contenu inchangé) ; `docs/PRD.md` est désormais dans `.prettierignore`.
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
