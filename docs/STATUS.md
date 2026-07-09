# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M4 TERMINÉ et déployé → prochaine étape M5

## Dernière action terminée :

M4 complet, **vérifié E2E en local ET en production** (https://klaar-nine.vercel.app) : foyer de test, session rédaction complète (2 textes comme à l'examen : consigne FR servie par le serveur, compteur de mots avec objectif 60, auto-évaluation par checklist — 5 puis 4 points —, exemple de réponse repliable), badge « Première rédaction » ✍️ célébré au bilan et vérifié côté serveur, dashboard parent avec taux Rédaction ; nettoyage complet des données de test (2 comptes + foyer). En local en plus : bouton désactivé sous 40 mots, hints de note suggérée (À revoir → Réussi selon les points cochés), XP production 58 = 25 + 13 + 20, régression vocab/grammaire/écoute.

Récap M4 : migration `20260709100000` (type `writing` dans content_items — remplace `writing_prompt` du PRD, invariant type = modalité —, colonne `checklist` jsonb, `sessions.module` étendu) appliquée local + hébergé, 141 items globaux seedés (dont 12 rédactions A2- format examen PRD §16) ; écran de rédaction sur le SRS commun (2 textes/session, textarea + compteur, auto-évaluation guidée sans juge automatique PRD §13) ; XP production 25 × difficulté (PRD §8) ; badge `first-writing` ; taux Rédaction au dashboard parent. 60 tests ✅, RLS 23/23 ✅ (compte seed dérivé des 4 JSON).

## Prochaine action à faire :

Démarrer M5 (PRD §11) : module expression orale — enregistrement (MediaRecorder), prononciation de référence (TTS `speakDutch` déjà en place), checklist type examen. PRD §13 : la reconnaissance vocale reste une aide indicative, pas un juge ; prévoir le créneau hebdomadaire où le parent écoute un enregistrement de 2 min. Type de contenu à utiliser : `speaking` (déjà dans la contrainte du schéma). À concevoir : stockage des enregistrements (local seulement ? Supabase Storage ?) — trancher avec Pierre.

## Décisions en attente de validation par Pierre :

- Faire vérifier le contenu de départ par un néerlandophone (PRD §13) : 64 mots (`vocab.json`), 41 drills (`grammar.json`), 24 items d'écoute (`listening.json`) et 12 rédactions dont les textes modèles NL (`writing.json`) — générés par Claude, non validés par un tiers.
- Seuil de minutes du streak : toujours 0 (≥ 1 session/jour suffit). Avec 4 modalités dont la rédaction (~10 min/texte), le PRD (1 h/jour) devient atteignable — Pierre décide du seuil.
- La voix TTS néerlandaise dépend de l'appareil — à valider à l'oreille sur l'appareil de l'élève ; sinon vrais enregistrements via `audio_url` (déjà dans le schéma).
- Stockage des futurs enregistrements oraux M5 (local vs Supabase Storage, rétention).

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session repartent de zéro — l'état SRS par carte est bien persisté après chaque réponse. Cosmétique, assumé (DECISIONS.md). Pour la rédaction, le brouillon en cours est aussi perdu au rechargement (même statut).
- Le PRD est dans `.prettierignore` (reformaté une fois par Prettier, contenu inchangé).
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
