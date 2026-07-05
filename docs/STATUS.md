# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M3 TERMINÉ et déployé → prochaine étape M4

## Dernière action terminée :

M3 complet, **vérifié E2E en local ET en production** (https://klaar-nine.vercel.app) : foyer de test, session écoute complète (24 items A2 : transcript NL lu en TTS navigateur — voix nl, rate 0.9, transcript affiché si pas de synthèse vocale —, question FR + QCM, transcript révélé après réponse), badges gagnés/célébrés au bilan et synchronisés (vérifiés côté serveur), dashboard parent avec taux Écoute + chips badges ; nettoyage complet des données de test (comptes + foyer). En local en plus : les 3 modalités le même jour → badge « Menu complet » 🎒 synchronisé.

Récap M3 : migration `20260705140000` (table `badges` append-only unique par code, colonne `content_items.question`, `sessions.module` étendu à listening) appliquée local + hébergé, 129 items globaux seedés ; module écoute jouable sur le SRS commun ; 9 badges à règles pures (`src/lib/badges.ts`) attribués côté client à la fin de session, célébration au bilan, vitrine accueil, chips dashboard parent, sync multi-appareils (upsert ignoreDuplicates + file de retry). 48 tests ✅, RLS 23/23 ✅. NB : un commit intermédiaire (d094598) ne compilait pas (chaînage `;` au lieu de `&&`), réparé au commit suivant (614a95b) — leçon retenue, tout est chaîné en `&&` désormais.

## Prochaine action à faire :

Démarrer M4 (PRD §11) : module expression écrite guidée + feedback. Format examen à respecter (PRD §16) : deux rédactions courtes ~60 mots, sans dictionnaire, niveau A2-. À concevoir : items `writing_prompt` (consignes + points attendus), écran de rédaction (compteur de mots, checklist), et le mécanisme de feedback (auto-évaluation guidée par checklist en v1 ; PRD §13 : pas de juge automatique). Aussi à trancher avec Pierre : seuil de minutes du streak (toujours 0 ; avec 3 modalités, ~30-45 min/jour deviennent réalistes, le PRD vise 1 h).

## Décisions en attente de validation par Pierre :

- Faire vérifier le contenu de départ par un néerlandophone (PRD §13) : 64 mots (`vocab.json`), 41 drills de grammaire (`grammar.json`) et 24 items d'écoute (`listening.json`) — générés par Claude, non validés par un tiers.
- Seuil de minutes du streak : toujours 0 (≥ 1 session/jour suffit). Avec 3 modalités, passer à un seuil en minutes devient réaliste (PRD vise 1 h/jour) — Pierre décide du seuil.
- La voix TTS néerlandaise dépend de l'appareil (Android/iOS en ont en général une bonne) — à valider à l'oreille sur l'appareil de l'élève ; si la qualité déçoit, on branchera de vrais enregistrements via `audio_url` (déjà dans le schéma).

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session (dont « du 1er coup ») repartent de zéro — l'état SRS par carte est lui bien persisté après chaque réponse. Cosmétique, assumé pour M0 (noté dans DECISIONS.md).
- Le PRD a été reformaté une fois par Prettier (tables réalignées, contenu inchangé) ; `docs/PRD.md` est désormais dans `.prettierignore`.
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
