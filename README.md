# Klaar!

App web de révision du néerlandais (PWA à terme) pour préparer la session de rattrapage CE1D fin août. Voir `docs/PRD.md` pour le produit complet et `docs/STATUS.md` pour l'état d'avancement exact.

## Lancer en local

```bash
npm install
npm run dev        # serveur de dev (http://localhost:5173)
```

## Scripts

| Commande          | Effet                                                    |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Serveur de développement Vite                            |
| `npm run build`   | Type-check (`tsc -b`) + build de production dans `dist/` |
| `npm run preview` | Sert le build de production en local                     |
| `npm test`        | Tests unitaires (Vitest) — SRS et sélection de session   |
| `npm run lint`    | Lint (oxlint)                                            |
| `npm run format`  | Formatage (Prettier)                                     |

## Déploiement

Chaque commit sur `main` doit compiler, passer les tests et être déployable. Déploiement cible : Vercel/Netlify branché sur le repo GitHub (voir `docs/STATUS.md` pour l'état du branchement).

## État actuel (M0)

- Flashcards de vocabulaire NL→FR avec répétition espacée type SM-2 (3 boutons : À revoir / Difficile / Réussi).
- 64 mots de départ génériques (8 thèmes) dans `src/data/vocab.json` — remplacés/enrichis en M1 par l'import des feuilles scannées.
- Stockage 100 % local (localStorage), sans compte. Supabase arrive en M1.
- Mode sombre, mobile-first.

## Schéma de données actuel (localStorage, clés versionnées)

| Clé                 | Contenu                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `klaar.srs.v1`      | `Record<itemId, SrsState>` — état SM-2 par carte (`easeFactor`, `intervalDays`, `repetitions`, `lapses`, `nextReviewAt`) |
| `klaar.sessions.v1` | `SessionRecord[]` — historique des sessions (`finishedAt`, `cardsReviewed`, `correctFirstTry`, `lapsed`)                 |
| `klaar.theme.v1`    | `'light' \| 'dark'`                                                                                                      |

Les types sont dans `src/types.ts`, alignés sur le futur schéma Postgres du PRD §7 pour faciliter la migration Supabase (M1).

## Structure

```
src/
  data/        contenu pédagogique (JSON importé, jamais en dur dans les composants)
  lib/         logique métier pure et testée (SRS, stockage)
  hooks/       hooks React (thème)
  components/  composants UI réutilisables
  pages/       écrans (Accueil, Session, Bilan)
docs/          PRD, décisions techniques, état d'avancement
```
