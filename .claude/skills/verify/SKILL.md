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
`verify-import.mjs`, `verify-parent-dashboard.mjs`, `verify-writing.mjs`,
`verify-speaking.mjs`, `verify-speaking-sync.mjs`, `verify-prod-m5.mjs` (modèle de
vérif prod avec nettoyage). Contexte mobile `{ width: 390, height: 844 }`, collecter
`pageerror`. Pour l'oral : lancer chromium avec
`args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']` et
`permissions: ['microphone']` sur le contexte (micro factice, ~330 Ko pour 21 s).

## Flux à dérouler

1. `/` : cinq cartes-modules (📚 Vocabulaire, 🧩 Grammaire, 🎧 Écoute, ✍️ Rédaction,
   🎤 Oral) avec compteurs dus/nouveaux (Rédaction et Oral plafonnés à 2).
2. Vocabulaire (`/session?m=vocab`) : mot NL (`p[lang=nl]`), « Voir la réponse » →
   « À revoir / Difficile / Réussi » ; « À revoir » re-met la carte en fin de file.
3. Grammaire (`/session?m=grammar`) : QCM `button[lang=nl]` ; bonne réponse = feedback
   700 ms puis carte suivante (prévoir `waitForTimeout(900)`) ; mauvaise réponse =
   bouton « Compris, on la retravaillera » + carte re-mise en file. Pour répondre juste,
   mapper `front → back` depuis `src/data/grammar.json`.
3b. Écoute (`/session?m=listening`) : bouton « 🔊 Écouter » (TTS, silencieux en headless),
   question FR (`p.text-xl` de la carte) + QCM `button[lang=fr]`, transcript « … » révélé
   après la réponse. Mapper `question → back` depuis `src/data/listening.json`.
3c. Rédaction (`/session?m=writing`) : consigne FR avec puces, `textarea` + compteur
   (« X mots — objectif ≈ 60 », bouton « J'ai terminé » actif à 40 mots), puis
   auto-évaluation : brouillon repris (label CSS uppercase → tester en case-insensitive),
   checklist `input[type=checkbox]`, `<details>` « Voir un exemple de réponse », hint de
   note suggérée, 3 boutons SM-2. 2 textes par session. Attendre ~500 ms après
   `waitForURL('**/bilan')` avant de lire `main`.
3d. Oral (`/session?m=speaking`) : consigne FR, « 🔊 Écouter un exemple d'abord » (TTS),
   « 🎙️ M'enregistrer » → timer ● m:ss → « Terminer la prise » → lecteur audio ;
   « J'ai terminé » désactivé sous 20 s (hint « un peu court », « 🔄 Refaire ») ;
   auto-évaluation comme la rédaction (« Vérifie ta présentation »). 2 sujets/session.
   Connecté : chaque prise part dans le bucket `recordings` ({userId}/{stamp}-{item}.webm) ;
   le dashboard parent affiche « 🎤 Derniers enregistrements » (URL signées).
4. Fin de file → `/bilan` (stats + « Session … terminée » + XP + célébration des nouveaux
   badges — 1re session d'un contexte vierge : « Premier pas » 🐣 et « Sans faute » 🎯 ;
   vitrine emoji à l'accueil ensuite ; `localStorage['klaar.badges.v1']`).
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
- ⚠️ `db push --include-seed` peut mettre à jour le hash du seed sans l'exécuter :
  vérifier le count de `content_items` après coup, sinon `psql <supabase/.temp/pooler-url>
  -f supabase/seed.sql` (PGPASSWORD = `SUPABASE_DB_PASSWORD`).
- Nettoyage prod/local : comptes + foyer + objets Storage `recordings/{userId}/…` (voir
  le bloc `finally` de `verify-prod-m5.mjs`).
