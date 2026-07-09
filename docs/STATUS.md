# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M6 TERMINÉ et déployé → prochaine étape M7

## Dernière action terminée :

**Charte « Oranje Trainer »** (piste A validée par Pierre, 9 juillet) : identité documentée (docs/IDENTITE.md), 4 commits déployés et vérifiés — tokens + typo (Bricolage Grotesque/Instrument Sans/Atkinson Hyperlegible auto-hébergées), navigation onglets bas + rail lg avec pages Examens et Progrès, anneau d'objectif quotidien, icônes Lucide, breakpoints tablette/PC (dashboard parent 2 colonnes), micro-motion (XP animé, flamme, confetti — motion-safe) et panneau Affichage (taille de texte, police lisibilité). Régression Playwright complète verte (welcome, 5 modalités, examen 15/15, co-parent), prod OK. Une bonne partie de M7 (accessibilité, polish) est donc couverte.

## Avant :

**Renommage du parent** (demande Pierre, 9 juillet) : crayon ✏️ dans /config, migration `20260709190000` (grant UPDATE sur la seule colonne `display_name` + policy self/parent) appliquée local + hébergé, RLS 44/44, vérifié E2E local et production (pastille accueil à jour, rôle intact côté serveur).

**Invitation co-parent** (demande Pierre, 9 juillet) : lien d'invitation dans /config (id du foyer = code non devinable), flux `/config?invite=` pour que la maman crée son compte parent et voie le même suivi (dashboard, rapport hebdo, enregistrements). Sans migration, RLS 39/39, vérifié E2E local ET production (papa copie le lien → maman rejoint → dashboard « Suivi de TestProd », nettoyage complet). Également ce jour : accueil visiteur + mode démo, pastille de profil, REX coûts (docs/REX-COUT-IA.md).

## Avant (M6) :

M6 complet, **vérifié E2E en local ET en production** (https://klaar-nine.vercel.app) : examen blanc écrit joué de bout en bout (intro au barème officiel, chrono par partie, CA avec écoutes limitées, auto-correction par corrigé à cocher, résultat 40/70 « réussi » + 200 XP boss battle), résultat dans `mock_exams` (details par section vérifiés côté serveur), dashboard parent avec rapport hebdo et score de l'examen ; nettoyage complet. En local en plus : épreuve orale complète (26/30), plafond < 55 mots en EE, 3 écoutes max épuisées, fin de chrono, record affiché à l'accueil.

Récap M6 : calibrage sur les épreuves CE1D officielles 2022-2026 téléchargées par Pierre dans `docs/CE1D/` (ignoré par git) → `docs/CE1D-FORMAT.md` (structure, barème CA /30 + CL /20 + EE /20 + EO /30, grille EE officielle, seuil 50 %) ; migration `20260709150000` (table `mock_exams` append-only + module `exam`) local + hébergé ; 2 épreuves blanches originales (`src/data/exams.json`) ; lecteur `/examen` chronométré avec auto-correction (PRD §13) ; XP boss battle 100/200 hors plafond ; rapport hebdo parent (`src/lib/report.ts`) : jours/minutes/taux vs semaine précédente + point faible. 83 tests ✅, RLS 33/33 ✅. Aussi ce jour : M4 (rédaction), M5 (oral + Storage), streak 1 h.

## Prochaine action à faire :

Démarrer M7 (PRD §11, dernière étape) : ciblage des points faibles (le rapport hebdo détecte déjà la modalité faible — ajouter la heatmap par thème PRD §9 et/ou des sessions ciblées sur les thèmes faibles), polish, accessibilité (taille de police ajustable, police dyslexie, contrastes — PRD §12). Aussi en attente : PWA (`vite-plugin-pwa`, reportée depuis M1), pondération des thèmes du vrai manuel quand les scans arriveront, et le portefeuille pièces → minutes d'écran si Pierre le veut toujours.

## Décisions en attente de validation par Pierre :

- Faire vérifier le contenu par un néerlandophone (PRD §13) : 64 mots, 41 drills, 24 écoutes, 12 rédactions, 12 sujets d'oral + les 2 épreuves blanches (transcripts, corrigés, exemples) — générés par Claude.
- La voix TTS néerlandaise dépend de l'appareil — à valider à l'oreille (les CA des blancs en dépendent aussi ; sinon utiliser les MP3 officiels de `docs/CE1D/` sur papier).
- Répétitions papier : les guides de correction officiels ne sont pas dans les zips téléchargés — à récupérer sur enseignement.be pour corriger les épreuves officielles.
- Portefeuille pièces → minutes d'écran (PRD §8/§9) : toujours pas rattaché à une étape — à planifier ou abandonner.

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session OU en plein examen blanc, l'état en cours est perdu (file recomposée / examen à recommencer) — l'état SRS et les résultats déjà enregistrés sont sûrs. Assumé (DECISIONS.md).
- `npx supabase db push --include-seed` peut mettre à jour le hash du seed SANS l'exécuter — vérifier le count de `content_items` et re-seeder via `psql` au besoin (voir `.claude/skills/verify/SKILL.md`).
- Le PRD est dans `.prettierignore`.
- Recette de vérification runtime : `.claude/skills/verify/SKILL.md` (preview + Playwright).
