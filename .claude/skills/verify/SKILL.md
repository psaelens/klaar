---
name: verify
description: Recette de vérification runtime de Klaar! — build, servir, piloter le flux flashcards au navigateur avec Playwright.
---

# Vérifier Klaar! en conditions réelles

## Build + serveur

```bash
npm run build          # tsc -b + vite build → dist/
npm run preview        # sert dist/ sur http://localhost:4173 (fallback SPA inclus)
```

Lancer `npm run preview` en tâche de fond, puis piloter avec Playwright.

## Playwright

Chromium est installé dans `%LOCALAPPDATA%\ms-playwright`. Le package `playwright` est installable dans le scratchpad (pas une dépendance du projet). Script type : contexte mobile `{ width: 390, height: 844 }`, collecter `pageerror`.

## Flux à dérouler (M0)

1. `/` : accueil affiche le compte de cartes dues/nouvelles + bouton « Commencer la session ».
2. Clic → `/session` : mot NL (`p[lang=nl]`), badge « Nouveau » sur les cartes jamais vues.
3. « Voir la réponse » → traduction FR + boutons « À revoir / Difficile / Réussi ».
4. « À revoir » → la carte revient en fin de file, la progression n'avance pas.
5. Boucler « Réussi » jusqu'à la fin → redirection `/bilan` avec stats.
6. Persistance : `localStorage['klaar.srs.v1']` contient un état SM-2 par carte répondue.
7. Thème : bouton lune/soleil bascule la classe `dark` sur `<html>`, persiste au reload.

## Pièges connus

- Après un clic de navigation, attendre `waitForURL` avant de lire `main` (sinon on capture l'écran précédent).
- Recharger en pleine session recompose la file (comportement assumé M0) — ne pas le compter comme bug.
- Prod : https://klaar-nine.vercel.app (déployé via `npx vercel deploy --prod --yes`).
