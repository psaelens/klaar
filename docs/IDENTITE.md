# Identité visuelle Klaar! — charte « Oranje Trainer »

Direction validée par Pierre le 9 juillet 2026 (piste A de la proposition de
direction artistique). Référence d'implémentation : tokens dans
`src/index.css` (`@theme` Tailwind v4). Complète le PRD §17 (UX) et §18 (ton de
marque) — en cas de doute, le PRD prime sur cette charte, cette charte prime
sur le goût du moment.

## Le concept

**L'entraînement sportif × le graphisme néerlandais.** Klaar! n'est ni un
cahier de vacances ni un jeu pour enfants : c'est l'app d'entraînement d'un
ado qui prépare un match (le CE1D). Les références : NS (chemins de fer
néerlandais) pour la franchise orange/encre, Strava pour la culture du record
et du bilan, l'héritage De Stijl pour la géométrie assumée — sans pastiche.

## Palette

| Token             | Hex (clair)                  | Hex (sombre)        | Rôle — et rien d'autre                                                                                                                      |
| ----------------- | ---------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `action` (oranje) | #E04E12 (600)                | #FF6A2E             | **Seule couleur d'action** : boutons « Commencer », liens, anneau d'objectif, barres de progression. Si tout est orange, rien n'est orange. |
| `reward` (geel)   | #FFC72C (400)                | #FFD054             | **Récompense uniquement** : badges, XP, boss battles. Signal pavlovien — quand le jaune apparaît, quelque chose a été gagné.                |
| `ink` (encre)     | #12203A (900)                | #EDF1F7 (texte)     | Textes et fonds sombres. Neutres teintés marine — **jamais de gris pur**.                                                                   |
| papier            | #F2F4F0 (`ink-50`)           | #0E1626 (`ink-950`) | Fond de page. Froid, très légèrement vert.                                                                                                  |
| `zee`             | #1D4ED8                      | #7BA3FF             | Secondaire rare (avatars, liens externes).                                                                                                  |
| sémantiques       | vert #15803D / rouge #B91C1C | #4ADE80 / #F87171   | Juste/faux, succès/erreur — indépendants de l'accent.                                                                                       |

Échelles complètes (50 → 950) définies dans `src/index.css`. Contraste : le
texte orange sur papier utilise `action-700` (#BC3F0C) minimum ; `action-600`
est réservé aux fonds de boutons (texte blanc) et aux gros titres.

## Typographie

| Rôle          | Police                                                 | Usage                                                                                  |
| ------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Display       | **Bricolage Grotesque** (variable, 700-800, resserrée) | Titres, logo « KLAAR! », gros chiffres (streak, XP, scores, minutes)                   |
| Texte         | **Instrument Sans** (variable)                         | Tout le reste                                                                          |
| Accessibilité | **Atkinson Hyperlegible**                              | Option dyslexie/lisibilité (M7) : remplace Instrument Sans via une classe sur `<html>` |

Toutes gratuites, auto-hébergées via Fontsource (compatible PWA/offline —
aucune requête externe). Chiffres alignés : `tabular-nums` partout où des
nombres se comparent (compteurs, scores, minutes).

## Logo & favicon

« Klaar » en encre (s'inverse avec le thème), « ! » toujours en oranje —
partout : header, splash, écran visiteur. Favicon : carré arrondi encre,
« K » papier + « ! » oranje (`public/favicon.svg`), `theme-color` encre.

## L'en-tête

Logo à gauche ; à droite, la **chip utilisateur** (icône Lucide + prénom du
connecté, ou « Démo »/« Local », lien vers le profil) puis la bascule de
thème. Pas de pastille d'état dans le contenu des pages.

**Mode démo mis en évidence** : la chip « Démo » passe en orange à bordure
pointillée (exception assumée : l'orange y signale « une action attendue » —
se connecter), et l'accueil affiche un bandeau fin cliquable du même style
(« tout reste sur cet appareil — Se connecter »). Jamais de rappel démo en
session ou en examen.

## Iconographie

- **Lucide** (trait 2 px) pour tout l'UI structurel : navigation, modules,
  boutons d'action (Volume2 = écouter, Mic = s'enregistrer, Square = stop,
  RotateCcw = refaire, Timer = chrono, Pencil = éditer, Users = co-parent,
  ClipboardList/Trophy = sections) — même visage sur Android, iOS et Windows.
- Les emojis restent là où ils sont un contenu émotionnel : 🔥 flamme du
  streak, 🎉 célébrations, ⭐ XP gagné, encouragements du bilan, emojis des
  badges.

## Le néerlandais dans l'interface

On garde et on assume (PRD §18) : « Sessie klaar! », « Goed zo! », les noms de
badges. C'est le différenciateur le plus fort — aucune couleur ne raconte
mieux « app de néerlandais » qu'un mot de néerlandais.

## Navigation & responsive

- **Smartphone** : onglets en bas (zone du pouce) — Réviser / Examens /
  Progrès / Profil pour l'élève ; **Suivi / Importer / Profil pour le parent**
  (pas de révisions : l'accueil le redirige vers le suivi de l'élève). La
  session et l'examen blanc masquent les onglets (mode focus).
- **Tablette (≥ md)** : accueil et bilans en grille 2 colonnes ; la session
  reste étroite et centrée — **le focus est une feature**.
- **PC (≥ lg)** : rail de navigation latéral ; le dashboard parent s'étale
  (calendrier + courbes côte à côte). Espace parent = même charte, ambiance
  inversée (fond encre, « salle de contrôle » vs « terrain d'entraînement »).

## Motion

Trois moments, pas plus : le compteur d'XP qui monte au bilan, la flamme du
streak qui s'anime quand la journée est validée, un confetti bref au badge.
Tout est désactivé sous `prefers-reduced-motion` (utiliser `motion-safe:`).

## Ce que la charte interdit

- Une deuxième couleur d'action sur un même écran.
- Du jaune hors récompense (pas de warnings jaunes : utiliser l'encre).
- Des gris purs (#808080…), des dégradés violets, des emojis de navigation.
- Un écran de session élargi sur desktop.
- Des animations décoratives permanentes.
