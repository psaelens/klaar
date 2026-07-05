---
name: verify
description: Recette de vérification runtime de Klaar! — build, servir, piloter les flux (flashcards, drills, sync, dashboard parent) au navigateur avec Playwright.
---

# Vérifier Klaar! en conditions réelles

## Build + serveur

```bash
npm run build          # tsc -b + vite build → dist/ (lit .env.local : VITE_* = stack local)
npm run preview        # sert dist/ sur http://localhost:4173 (fallback SPA inclus)
```

Lancer `npm run preview` en tâche de fond, puis piloter avec Playwright. Pour les flux
synchronisés, `npx supabase start` (Docker) doit tourner ; les clés se lisent via
`npx supabase status -o json` (API_URL, ANON_KEY, SERVICE_ROLE_KEY).

## Playwright

Chromium est installé dans `%LOCALAPPDATA%\ms-playwright`. Le package `playwright` est
installé dans le scratchpad `1d7b2eb0-…/scratchpad/verify/` (pas une dépendance du projet),
avec les scripts existants : `verify-grammar.mjs`, `verify-vocab-regression.mjs`,
`verify-import.mjs`, `verify-parent-dashboard.mjs`. Contexte mobile `{ width: 390, height: 844 }`,
collecter `pageerror`.

## Flux à dérouler

1. `/` : deux cartes-modules (📚 Vocabulaire, 🧩 Grammaire) avec compteurs dus/nouveaux.
2. Vocabulaire (`/session?m=vocab`) : mot NL (`p[lang=nl]`), « Voir la réponse » →
   « À revoir / Difficile / Réussi » ; « À revoir » re-met la carte en fin de file.
3. Grammaire (`/session?m=grammar`) : QCM `button[lang=nl]` ; bonne réponse = feedback
   700 ms puis carte suivante (prévoir `waitForTimeout(900)`) ; mauvaise réponse =
   bouton « Compris, on la retravaillera » + carte re-mise en file. Pour répondre juste,
   mapper `front → back` depuis `src/data/grammar.json`.
4. Fin de file → `/bilan` (stats + « Session vocabulaire/grammaire terminée » + XP).
5. Foyer : `/config` → « Première fois : créer le foyer » (l'appareil reste connecté élève).
6. Parent (2e contexte) : login `/config` → liens « Suivi de l'élève » (`/parent` :
   streak, XP, minutes 7 jours, taux global + par module, calendrier 4 semaines) et
   « Importer du vocabulaire » (`/import`). Un élève sur ces pages doit être refusé.
7. Persistance : `localStorage['klaar.srs.v1']` ; thème lune/soleil → classe `dark` sur `<html>`.

## Pièges connus

- Après un clic de navigation, attendre `waitForURL` avant de lire `main`.
- Après login/création de foyer, laisser ~1,5 s aux push/pull avant d'inspecter le serveur.
- Recharger en pleine session recompose la file (comportement assumé) — pas un bug.
- Nettoyage : supprimer les utilisateurs de test via `admin.auth.admin` (cascade sur
  profiles/srs/sessions/xp) ET le foyer orphelin (`households`), + `content_items` importés.
- Prod : https://klaar-nine.vercel.app — auto-déployée à chaque push sur `main` (app GitHub
  Vercel). La base hébergée doit être migrée/seedée AVANT le push (`npx supabase db push`,
  mot de passe DB : env `SUPABASE_DB_PASSWORD` depuis `.env.local`, ne jamais l'afficher).
