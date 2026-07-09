# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M5 TERMINÉ et déployé → prochaine étape M6

## Dernière action terminée :

M5 complet, **vérifié E2E en local ET en production** (https://klaar-nine.vercel.app) : foyer de test, session d'oral complète (2 sujets : consigne FR servie par le serveur, exemple TTS, enregistrement micro factice 21 s, réécoute, auto-évaluation par checklist), 2 prises uploadées dans le bucket privé `recordings` et vérifiées côté serveur, badge « Première prise de parole » 🎤 célébré, dashboard parent : taux Oral + section « Derniers enregistrements » avec lecteurs audio (URL signées téléchargeables) ; nettoyage complet (comptes + foyer + enregistrements). En local en plus : prise trop courte refusée (< 20 s), refaire une prise, fallback affiché sans micro.

Récap M5 : migration `20260709120000` (module `speaking`, bucket Storage privé `recordings` 10 Mo/MIME audio avec policies par dossier — élève écrit/lit/supprime le sien, parent du foyer écoute) appliquée local + hébergé, 153 items seedés (dont 12 sujets d'oral) ; écran d'oral (MediaRecorder via `useRecorder`, min 20 s / max 3 min, exemple TTS en prononciation de référence, checklist partagée avec la rédaction) ; upload best-effort à la notation ; rétention 14 jours nettoyée au démarrage ; XP production ; badge `first-speaking` ; écoute parent au dashboard. 69 tests ✅, RLS 29/29 ✅ (dont 6 sur le Storage). Aussi ce jour : streak passé à 1 h/jour (décision Pierre), tooltip des minutes restantes à l'accueil.

## Prochaine action à faire :

Démarrer M6 (PRD §11) : examens blancs chronométrés (écrit + oral) + rapport hebdo parent. Format : épreuves CE1D officielles d'enseignement.be (PRD §16 — Pierre doit télécharger les PDF des sessions passées ; le module se calibre sur le vrai format, PRD §13). Boss battles : bonus XP significatif (PRD §8). Table `mock_exams` déjà prévue au schéma cible (PRD §7). Rapport hebdo : résumé lisible auto-généré côté parent (PRD §9).

## Décisions en attente de validation par Pierre :

- Faire vérifier le contenu de départ par un néerlandophone (PRD §13) : 64 mots, 41 drills, 24 écoutes, 12 rédactions, 12 sujets d'oral — générés par Claude, non validés par un tiers.
- La voix TTS néerlandaise dépend de l'appareil — à valider à l'oreille sur l'appareil de l'élève ; sinon vrais enregistrements via `audio_url` (déjà dans le schéma).
- Télécharger les épreuves CE1D officielles (enseignement.be) pour calibrer M6 — action Pierre.
- Le portefeuille pièces → minutes d'écran (PRD §8/§9, table `screen_time_wallet`) n'est rattaché à aucune étape de la roadmap — à planifier ou à abandonner si la contrainte d'écran se gère autrement.

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs repartent de zéro — l'état SRS par carte est persisté après chaque réponse. Pour la rédaction/l'oral, le brouillon ou la prise en cours est aussi perdu au rechargement (assumé, DECISIONS.md).
- `npx supabase db push --include-seed` peut mettre à jour le hash du seed SANS l'exécuter (vu au M5 : 141 items au lieu de 153) — toujours vérifier le count après coup et re-seeder via `psql <pooler-url> -f supabase/seed.sql` au besoin (mot de passe : `SUPABASE_DB_PASSWORD` de `.env.local`).
- Le PRD est dans `.prettierignore` (reformaté une fois par Prettier, contenu inchangé).
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
