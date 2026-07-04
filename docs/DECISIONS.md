# Décisions techniques

Décisions non couvertes (ou différentes) du PRD, avec justification courte. Une ligne par décision, les plus récentes en bas.

- **2026-07-04 — Template Vite officiel actuel (Vite 8, TypeScript 6, oxlint)** : le scaffold officiel `create-vite` livre aujourd'hui oxlint comme linter au lieu d'ESLint ; on garde ce standard plutôt qu'une config ESLint maison, Prettier ajouté pour le formatage.
- **2026-07-04 — Tailwind CSS v4 via plugin `@tailwindcss/vite`** : version actuelle de Tailwind ; la config se fait en CSS (`@custom-variant` pour le mode sombre par classe), il n'y a plus de `tailwind.config.js` comme décrit dans le PRD (écrit pour v3).
- **2026-07-04 — React Router v7 (package `react-router`)** : version actuelle, import direct depuis `react-router` (le package `react-router-dom` est déprécié en v7).
- **2026-07-04 — SRS : SM-2 à 3 boutons** : « À revoir » (qualité 2, réinitialise l'intervalle), « Difficile » (qualité 3), « Réussi » (qualité 5). Trois boutons max pour un ado — moins de friction que l'échelle 0-5 complète d'Anki.
- **2026-07-04 — Carte ratée re-mise en fin de file de la session** : feedback non punitif (PRD §17) — on retravaille le mot immédiatement au lieu d'attendre le lendemain.
- **2026-07-04 — Sens de révision M0 : NL→FR uniquement (reconnaissance)** : le sens production FR→NL (plus difficile, plus proche de l'examen) sera ajouté quand le contenu réel arrivera, pour ne pas doubler la charge dès le premier jour.
- **2026-07-04 — Plafonds de session : 20 révisions + 8 nouveaux mots** : valeurs classiques type Anki, à ajuster à l'usage ; sessions courtes = sentiment de complétion fréquent (PRD §17).
- **2026-07-04 — PWA (`vite-plugin-pwa`) reportée à M1** : M0 = squelette minimal utilisable ; le manifest + service worker arrivent avec la premiere mise en prod réelle.
- **2026-07-04 — Stats de session non persistées en cours de route** : si l'élève quitte ou recharge en pleine session, la file est recomposée au retour et les compteurs de la session repartent de zéro. L'état SRS par carte, lui, est sauvegardé après chaque réponse — aucune progression d'apprentissage n'est perdue.
