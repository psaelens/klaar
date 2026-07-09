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

## État actuel (M5 terminé)

- Cinq modalités sur le même moteur SM-2 (3 boutons : À revoir / Difficile / Réussi) : vocabulaire NL→FR, drills de grammaire (QCM), compréhension orale (TTS navigateur + QCM), expression écrite guidée et expression orale (2 sujets par session au format examen CE1D, auto-évaluation par checklist ; l'oral s'enregistre au micro avec exemple TTS en prononciation de référence).
- Gamification : XP (pondéré difficulté, production ×2,5, plafond anti-farming), streak (≥ 1 h/jour), 11 badges célébrés au bilan.
- 153 items de départ dans `src/data/*.json` (64 mots, 41 drills, 24 écoutes, 12 rédactions, 12 sujets d'oral), seedés aussi dans Supabase — enrichis ensuite par l'import (écran parent `/import`).
- Espace parent : dashboard (calendrier 4 semaines, minutes, taux de réussite par modalité, badges, écoute des derniers enregistrements oraux — conservés 14 jours), réservé au rôle parent.
- Sync Supabase multi-appareils (facultative) : sans variables d'env l'app reste 100 % locale ; connecté, chaque écriture part au localStorage puis au serveur (file de retry hors ligne), pull au démarrage.
- Mode sombre, mobile-first.

## Supabase

```bash
npx supabase start                    # stack local (Docker) : applique migrations + seed
npx supabase db reset                 # ré-applique migrations + seed
node supabase/tests/rls-check.mjs     # 29 vérifications d'isolation RLS (stack local requis)
npx supabase gen types typescript --local > src/lib/database.types.ts
```

Schéma : `households`, `profiles` (rôle parent/enfant), `content_items` (contenu global ou du foyer ; `choices` pour les QCM, `question` pour l'écoute, `checklist` pour la rédaction et l'oral), `srs_state`, `sessions`, `xp_ledger`, `badges`, + bucket Storage privé `recordings` (enregistrements oraux, un dossier par élève, rétention 14 jours) — RLS sur toutes les tables (l'élève lit/écrit ses données, le parent lit celles du foyer sans pouvoir les modifier). Migrations versionnées dans `supabase/migrations/`, jamais d'édition manuelle du schéma.

Variables d'env (Vercel et `.env.local`, jamais commitées) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Absentes → mode local sans compte.

## Stockage local (clés versionnées)

| Clé                  | Contenu                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `klaar.srs.v1`       | `Record<itemId, SrsState>` — état SM-2 par carte (`easeFactor`, `intervalDays`, `repetitions`, `lapses`, `nextReviewAt`) |
| `klaar.sessions.v1`  | `SessionRecord[]` — historique des sessions (`finishedAt`, `cardsReviewed`, `correctFirstTry`, `lapsed`, durée, XP)      |
| `klaar.xp.v1`        | `XpEntry[]` — journal d'XP                                                                                               |
| `klaar.theme.v1`     | `'light' \| 'dark'`                                                                                                      |
| `klaar.pushqueue.v1` | File des écritures à repousser vers Supabase (hors ligne)                                                                |
| `klaar.synced.v1`    | Id de l'utilisateur déjà migré/synchronisé sur cet appareil                                                              |

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
