# PRD — App de révision Néerlandais (CE1D, rattrapage fin août)

**Auteur** : Pierre (parent) — **Développement** : Claude Fable 5 via Claude Code
**Date** : 3 juillet 2026 — **Échéance dure** : session de rattrapage CE1D fin août (oral + écrit)

---

## 1. Contexte & enjeu

Élève de 2e secondaire (Belgique), échec en néerlandais (1re langue étrangère) toute l'année, CE1D raté, examen de repêchage fin août. Le parent ne maîtrise pas le néerlandais et ne peut donc pas valider lui-même la qualité pédagogique du contenu — c'est une contrainte structurante du produit (voir §10 et §13).

Fenêtre disponible : ~8 semaines. L'app doit être **utilisable dès les premiers jours**, pas seulement à la fin du développement.

## 2. Objectifs

1. Faire travailler l'élève **≥ 1h/jour, ≥ 5 j/semaine**, sans plafond, de façon mesurable.
2. Couvrir les objectifs du programme (vocabulaire, grammaire, compréhension orale/écrite, expression orale/écrite) tels que définis par les feuilles de révision fournies.
3. Motiver via gamification adossée à une monnaie d'échange : **temps d'écran**.
4. Donner au parent une visibilité claire et actionnable sur la progression, sans qu'il ait besoin de comprendre le néerlandais.
5. Préparer spécifiquement l'épreuve orale et l'épreuve écrite du CE1D (formats d'examen réels).

## 3. Utilisateurs

- **Élève** : utilisateur principal, session de travail quotidienne, sur téléphone/tablette/PC.
- **Parent** : consulte un tableau de bord, ajuste le taux de conversion points→écran, ajoute du contenu (photos des feuilles scannées), reçoit des alertes.

## 4. Contraintes clés

- Deadline dure fin août → mise en prod incrémentale obligatoire, jamais de "gros bang" final.
- Contenu réel pas encore disponible (photos à venir) → l'architecture de contenu doit être **indépendante du contenu figé dans le code** (import, pas hardcodé en dur dans les composants).
- Multi-device (tel/tablette/PC) → besoin d'un stockage synchronisé, pas seulement du localStorage.
- Parent non-néerlandophone → le produit doit inclure des garde-fous de qualité de contenu (voir §13).
- Possible profil d'apprentissage en difficulté (échecs répétés) → prévoir accessibilité (police, lecture audio, rythme).

## 5. Vision fonctionnelle globale

- **Module de révision** : vocabulaire (répétition espacée), grammaire (drills), compréhension écrite, compréhension orale (audio + questions), expression écrite (rédaction guidée + feedback), expression orale (enregistrement + entraînement structuré).
- **Moteur de gamification** : XP, streaks, badges, "pièces" convertibles en minutes d'écran.
- **Espace parent** : dashboard temps réel, rapports hebdomadaires, gestion du taux de change, import de contenu, alertes.
- **Simulateur d'examen CE1D** : épreuves blanches chronométrées en conditions réelles (dernières semaines).

## 6. Architecture technique recommandée

**Option retenue (hybride, pour aller vite sans sacrifier l'évolutivité) :**

- **Frontend** : React + Vite, PWA (installable sur tel/tablette/PC, fonctionne offline pour la session en cours).
- **Backend/sync** : Supabase (Postgres + Auth + Realtime) — gratuit au départ, gère nativement le multi-device et le dashboard parent en live, évite de réinventer une API.
- **Hébergement** : Vercel ou Netlify (déploiement automatique à chaque commit sur `main` = chaque commit livrable).
- **Audio** : Web Speech API (SpeechSynthesis pour la prononciation de référence en néerlandais ; SpeechRecognition en bonus pour un feedback approximatif, à ne pas sur-vendre comme évaluateur fiable).

**Séquence de bootstrap** :

1. Jours 1-3 : version 100% locale (localStorage), zéro backend, pour valider l'UX de révision immédiatement.
2. Semaine 2 : bascule vers Supabase, migration transparente, dashboard parent activé.

Cette séquence permet à l'élève de commencer à réviser dès le 2e ou 3e jour de développement, pendant que la partie "suivi parent" se construit en parallèle.

## 7. Modèle de données (schéma cible, à créer progressivement)

```
users (id, role[parent|child], name)
content_items (id, type[vocab|grammar|listening|reading|writing_prompt|speaking_prompt],
                theme, source_ref, front, back, audio_url, difficulty, curriculum_unit)
srs_state (user_id, content_item_id, ease_factor, interval, next_review_at, repetitions)
sessions (id, user_id, started_at, ended_at, duration_seconds, modality_breakdown)
attempts (id, session_id, content_item_id, correct, response_time_ms, answer_given)
xp_ledger (id, user_id, amount, reason, created_at)
screen_time_wallet (user_id, balance_minutes, exchange_rate_points_per_minute)
badges (id, user_id, badge_code, earned_at)
mock_exams (id, user_id, exam_type[oral|ecrit], score, taken_at, details)
```

Le SRS (répétition espacée) utilise un algorithme type SM-2 : chaque item a un intervalle qui augmente si la réponse est correcte, se réinitialise sinon. C'est le cœur de l'efficacité du drill vocabulaire/grammaire.

## 8. Gamification — design détaillé

- **XP** : pondéré par difficulté et par modalité (l'oral et l'écrit "production" rapportent plus que le simple vocabulaire, pour équilibrer l'effort vers les compétences examinées).
- **Streak** : compteur de jours consécutifs avec ≥ 1h ; un jour manqué casse le streak (pas de "vie" ou de rattrapage — la contrainte parentale est ferme).
- **Pièces** : converties en XP obtenu, à un taux ajustable par le parent (ex. 100 XP = 10 min d'écran). Le parent fixe le taux dans son espace, pas dans le code.
- **Badges thématiques** : alignés sur les unités du programme (ex. "Maître de la nourriture", "As du présent"), débloqués par maîtrise réelle (SRS stable), pas juste par volume.
- **Boss battles** : les examens blancs CE1D débloquent un bonus XP significatif, pour créer un pic de motivation avant les échéances clés.
- **Anti-triche léger** : XP plafonné par session pour éviter le "farming" bête ; temps réellement actif tracké (pas juste l'app ouverte).

## 9. Espace parent — suivi & pilotage

Doit répondre à 3 questions sans connaître le néerlandais :

1. **A-t-il travaillé assez, régulièrement ?** → calendrier avec jours validés/manqués, minutes/jour, streak.
2. **Progresse-t-il réellement ?** → courbe de taux de réussite par compétence (vocab / grammaire / écoute / oral / écrit) dans le temps, pas juste un score brut.
3. **Où sont ses points faibles ?** → heatmap par thème du programme (issu des unités scannées), pour cibler les révisions ou l'aide d'un tuteur si besoin.

Fonctions additionnelles : rapport hebdomadaire auto-généré (résumé lisible), réglage du taux de change écran, historique des échanges de pièces, alerte si le quota du jour n'est pas atteint en fin de journée.

## 10. Contenu pédagogique — ingestion & structure

Puisque tu vas scanner les feuilles :

- Prévoir dès le MVP un **écran d'import** : photo → extraction de texte (OCR, ou usage direct de Claude pour lire la photo et structurer en JSON `content_items`) → validation manuelle rapide avant intégration.
- Chaque item est rattaché à une `curriculum_unit` (ex. "Unité 5 — au restaurant") pour que le dashboard et le SRS s'organisent autour du vrai programme de ton fils, pas d'un programme générique.
- Ne jamais coder le contenu en dur dans les composants React — toujours en base/JSON importé, pour pouvoir ajouter du contenu sans redéploiement de code.

## 11. Roadmap incrémentale (chaque étape = déployée et utilisable)

| Étape | Période  | Livrable                                                                        | Testable par ton fils |
| ----- | -------- | ------------------------------------------------------------------------------- | --------------------- |
| M0    | J1–J3    | Flashcards vocab + SRS basique, local, sans compte                              | Oui, dès J3           |
| M1    | Sem. 1–2 | Sync Supabase, streak, XP, écran d'import de contenu                            | Oui                   |
| M2    | Sem. 2–3 | Grammaire (drills), dashboard parent v1                                         | Oui + toi             |
| M3    | Sem. 3–4 | Compréhension orale (audio+questions), badges                                   | Oui                   |
| M4    | Sem. 4–5 | Module expression écrite guidée + feedback                                      | Oui                   |
| M5    | Sem. 5–6 | Module oral (enregistrement, prononciation de référence, checklist type examen) | Oui                   |
| M6    | Sem. 6–7 | Examens blancs chronométrés (écrit + oral), rapport hebdo parent                | Oui + toi             |
| M7    | Sem. 7–8 | Ciblage des points faibles, polish, accessibilité (police, TTS)                 | Oui                   |

Chaque étape doit être mergée sur `main` avec déploiement automatique — jamais de branche de dév qui traîne plus de quelques jours.

## 12. Instructions de développement pour Claude Fable 5

À donner telles quelles en début de session de code :

- Stack imposée : React + Vite + TypeScript strict, Supabase, déploiement Vercel/Netlify.
- Chaque commit doit : compiler, passer les tests existants, être déployable en l'état (feature flags si une fonctionnalité est incomplète, jamais de code cassé sur `main`).
- Composants petits, réutilisables ; logique métier (SRS, calcul XP) isolée dans des fonctions pures testées unitairement.
- Tests unitaires obligatoires sur : algorithme SRS, calcul XP/streak, conversion pièces→écran.
- Accessibilité dès le départ : taille de police ajustable, option police adaptée dyslexie, contrastes suffisants, lecture audio des consignes.
- Pas de contenu pédagogique en dur dans le code — toujours via la couche de données.
- README tenu à jour à chaque étape avec : comment lancer en local, comment déployer, schéma de données actuel.
- Corrections de bugs : fix ciblé et minimal, jamais de refonte non demandée.

## 13. Recommandations complémentaires (au-delà de l'app)

- **Validation du contenu** : comme tu ne lis pas le néerlandais, fais valider les items importés (traductions, exemples) soit par Claude au moment de l'import, soit par un tiers (prof particulier, voisin néerlandophone) sur un échantillon — pour éviter d'ancrer une erreur dans le SRS pendant 8 semaines.
- **Examens blancs officiels** : cherche les épreuves CE1D des sessions précédentes (site enseignement.be, "session de qualification") pour calibrer le module d'examen blanc sur le vrai format, plutôt que d'inventer un format.
- **Oral** : la reconnaissance vocale automatique reste approximative pour évaluer la prononciation — utilise-la comme aide (feedback indicatif), pas comme juge. Prévoir un créneau hebdomadaire où _toi_ (ou un tuteur) écoutes un enregistrement de 2 minutes, même sans comprendre le fond, pour la fluidité/l'aisance.
- **Rythme quotidien suggéré dans l'heure minimum** : ~20 min vocabulaire (SRS), ~15 min grammaire, ~15 min écoute, ~10 min production (oral ou écrit en alternance). Cette répartition peut se paramétrer dans l'app.
- **Renfort humain** : si le dashboard révèle un point faible persistant (ex. temps du passé), un cours particulier ciblé de 2-3h sur ce point précis est souvent plus efficace que plus d'heures d'app.

## 14. Risques & mitigations

| Risque                                                     | Mitigation                                                                       |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Contenu scanné en retard                                   | MVP M0 fonctionne avec un jeu de vocabulaire de base générique en attendant      |
| Démotivation malgré gamification                           | Taux de change ajustable + boss battles fréquents pour maintenir un pic régulier |
| Erreur de contenu non détectée (parent non-néerlandophone) | Process de validation §13, échantillonnage par un tiers                          |
| Reconnaissance vocale peu fiable                           | Positionnée comme aide, pas comme juge ; complément humain hebdo                 |
| Sur-ingénierie qui retarde l'usage réel                    | Roadmap strictement incrémentale, usage dès M0                                   |

## 15. KPIs de succès

- % de jours avec ≥ 1h atteint sur les 8 semaines (cible : ≥ 90% des jours ouvrés).
- Taux de réussite SRS par compétence, tendance à la hausse semaine après semaine.
- Score aux examens blancs vs score visé pour réussir le rattrapage.
- Streak maximum atteint.

## 16. Sources de contenu recommandées (vérifiées juillet 2026)

### Examens CE1D blancs — source officielle

La Fédération Wallonie-Bruxelles publie toutes les épreuves CE1D antérieures, y compris néerlandais, avec livrets élève, guide de correction et grille d'évaluation, sur enseignement.be > De A à Z > CE1D > Langues modernes (années 2013 à 2025 disponibles, livrets + guides de passation/correction).

- Alternative si le lien direct est capricieux : la page "Matières du CE1D" du site des Jurys (jurys.cfwb.be), qui renvoie vers les mêmes archives, avec la précision utile que ces questions d'exemple sont fournies à titre indicatif — s'y préparer uniquement sur cette base est jugé insuffisant par la Fédération elle-même. À utiliser comme examens blancs finaux, en complément du travail quotidien.
- Repère de calibrage utile : en juin 2025, environ 68% des élèves ayant le néerlandais comme langue moderne ont réussi l'épreuve, pour un score moyen d'environ 58%, le seuil de réussite étant 50%.
- L'épreuve écrite a évolué vers deux rédactions courtes (~60 mots chacune), sans dictionnaire, format A2- du CECRL — le module d'expression écrite (§11, M4) doit s'entraîner sur ce format précis.
- ⚠️ Éviter les copies trouvées sur Scribd/Studocu (versions parfois incomplètes ou sans guide de correction officiel) — préférer systématiquement le PDF officiel enseignement.be.

### Contenu de révision quotidienne (vocabulaire, grammaire, écoute) — sources gratuites

- **Klascement** (klascement.net) : plateforme flamande de partage de ressources pédagogiques, beaucoup de fiches et exercices de langue pour le secondaire inférieur.
- **Wablieft** (wablieft.be) : actualités en néerlandais simplifié — bon pour la compréhension écrite/orale de niveau A2 avec du vocabulaire réel et actuel.
- **VRT NWS / Karrewiet** : journal télévisé néerlandais pour enfants, débit lent, vocabulaire simple — excellent pour la compréhension orale sans décourager.
- **Duolingo** (parcours néerlandais) : bon complément ludique pour le vocabulaire de base, mais ne couvre pas le programme belge spécifique — à utiliser en appoint, pas comme colonne vertébrale.
- Les feuilles que tu vas scanner restent la référence n°1 pour le contenu aligné au programme — les sources ci-dessus servent à enrichir/varier une fois le socle couvert.

## 17. UX & Design de l'application

Principes clés pour un ado de 13-14 ans en échec scolaire, donc probablement démotivé et sensible à l'échec visible :

- **Ton bienveillant, jamais infantilisant** : éviter l'esthétique "app pour enfant de 6 ans". Viser quelque chose qu'il choisirait d'utiliser lui-même (type Duolingo/Kahoot en plus sobre), pas un cahier de vacances numérique.
- **Zéro friction au lancement** : ouvrir l'app doit mener à "commencer la session" en 1 tap, pas à un menu qui invite à procrastiner.
- **Feedback d'erreur non punitif** : pas de croix rouge agressive ni de son négatif — une erreur montre la bonne réponse et propose de réessayer, sans décompte de vie ni pénalité écrasante. L'objectif est qu'il continue, pas qu'il évite l'app après un échec.
- **Progression très visible** : barre de progression par session courte (2-3 min par bloc), pour des sentiments de complétion fréquents plutôt qu'un seul objectif lointain d'1h.
- **Mode sombre** disponible.
- **Accessibilité dès le départ** : police lisible réglable, option police adaptée dyslexie, contrastes AA minimum, pas de texte dans des images.
- **Dashboard parent visuellement distinct** : palette différente de l'espace élève, pour signaler clairement "ceci n'est pas l'espace de jeu", avec des graphiques simples plutôt que des tableaux bruts.

### Pour générer des mockups avec Claude

Pour obtenir des maquettes exploitables, fournir dans la conversation :

1. Ce PRD (ou au moins les sections 5, 8, 9, 17) comme contexte.
2. Les tailles d'écran cibles : mobile en priorité (portrait), puis tablette/desktop en responsive.
3. 2-3 écrans prioritaires à maquetter d'abord : écran de session de révision, écran de résumé de session (XP gagné, streak), dashboard parent (vue semaine).
4. Une direction esthétique même approximative ("sobre et moderne, pas cartoon" ou à l'inverse "coloré et énergique") — sinon un style par défaut générique sera choisi.
5. Le contenu réel d'un item (un mot de vocabulaire, une question de grammaire) une fois les feuilles scannées, pour que la maquette montre du vrai contenu plutôt que du texte de remplissage.
6. Demander explicitement un rendu en artifact HTML/React interactif plutôt qu'une image statique, pour pouvoir cliquer dedans et juger l'ergonomie réelle.

## 18. Nom de l'app & identité visuelle

**Nom retenu : Klaar!**
Mot néerlandais signifiant "prêt !" — immersif dès le nom (premier mot néerlandais que l'élève voit et comprend chaque jour), court, facile à décliner ("Klaar aujourd'hui ?" comme accroche de streak), et ne sonne pas comme un outil scolaire classique.

**Ton de marque**

- Complice, jamais scolaire ni infantilisant — se rapproche du ton d'une app de fitness/habitude (Duolingo, Strava) plutôt que d'un cahier d'exercices numérique.
- Les accroches internes ("Klaar aujourd'hui ?", "Streak sauvé !") utilisent volontairement le mot néerlandais du nom pour ancrer un peu de langue cible même dans l'UI, sans jamais bloquer la compréhension (toujours accompagné du français au besoin).

**Piste de palette (à ajuster en mockup, §17)**

- Couleur principale : un bleu-vert franc (type "teal/petrol"), évoque le drapeau/l'identité néerlandophone sans tomber dans l'orange cliché (trop associé aux Pays-Bas/fête).
- Couleur d'accent streak/succès : jaune-orangé chaleureux, réservé aux moments de récompense (XP gagné, badge débloqué) pour qu'il reste associé au positif.
- Espace parent : palette neutre (gris/bleu ardoise), délibérément différente de l'espace élève pour signaler visuellement qu'on change de contexte.
- Typographie : une police arrondie mais pas enfantine pour les titres, une police très lisible (type Inter/Nunito) pour le corps de texte — cohérent avec l'exigence d'accessibilité du §17.

**Déclinaisons à prévoir dès le MVP**

- Icône d'app (favicon + PWA icon) : lettrage "K" ou point d'exclamation stylisé, simple à reconnaître en petit format sur un écran d'accueil.
- Écran de lancement (splash screen) court avec le nom, pour renforcer l'identité dès l'ouverture.

## 19. Prochaines étapes immédiates

1. Scanner et envoyer les feuilles de révision (même partiellement) pour calibrer §10 dès M0/M1.
2. Décider du taux de change initial pièces→minutes d'écran (proposition de départ : 10 XP = 1 minute, ajustable).
3. Lancer le développement de M0 avec Claude Fable 5 dans Claude Code en utilisant ce document comme contexte initial.

## Annexe A — Détail de la stack technique

### React + Vite

- **React 18** en composants fonctionnels + hooks uniquement (pas de classes).
- **Vite** comme bundler/dev server : démarrage et rechargement à chaud quasi instantanés, bien plus simple qu'un setup Webpack.
- Pas de Next.js : inutile ici, l'app n'a pas besoin de SSR/SEO (usage privé, pas de référencement).
- **Routing** : React Router (SPA classique).
- **State management** : Context + `useReducer` pour l'état global (session en cours, XP, streak) au démarrage. Si l'état devient complexe en cours de route, migrer vers **Zustand** (léger) plutôt que Redux (trop lourd pour la taille du projet).

### PWA (Progressive Web App)

- `vite-plugin-pwa` génère le manifest + service worker automatiquement.
- **Stratégie offline** : mise en cache de l'app + du contenu du jour, pour qu'une session puisse se dérouler sans connexion (utile en voiture, en vacances). Les résultats (`attempts`) sont mis en file d'attente locale (IndexedDB) et synchronisés vers Supabase dès que la connexion revient.
- Manifest avec icônes pour "Ajouter à l'écran d'accueil" sur tel/tablette.

### Tailwind CSS

- Utility-first : évite de maintenir une couche CSS séparée à gérer manuellement.
- Fichier `tailwind.config.js` centralisant les tokens (couleurs, espacements) alignés sur les principes UX du §17, avec mode sombre activé via la stratégie `class`.
- Optionnel : **shadcn/ui** pour des composants de base (boutons, cartes, dialogues) cohérents sans dépendance lourde — signalé dans le prompt à Claude Fable 5 si utilisé, comme indiqué dans les contraintes React de la plateforme.

### Supabase (backend + Postgres)

- Base de données **relationnelle** (Postgres) plutôt que Firestore (NoSQL) : le modèle de données du §7 est fait de relations (utilisateur ↔ tentatives ↔ items ↔ état SRS), Postgres est naturellement adapté, Firestore serait plus pénible pour ce type de requêtes.
- **Row Level Security (RLS)** à activer dès le premier commit touchant la base : l'enfant ne peut lire/écrire que ses propres données, le parent peut lire les données de son foyer mais pas modifier les réponses. Ne pas repousser cette étape — la sécuriser après coup sur des données réelles est plus risqué.
- **Migrations versionnées** : utiliser le Supabase CLI avec des fichiers SQL de migration commités dans le repo, jamais d'édition manuelle du schéma via le dashboard — indispensable pour la maintenabilité sur 8 semaines de développement incrémental.
- Limites du plan gratuit largement suffisantes pour un usage familial (500 Mo de DB, très au-delà du besoin réel).

### Authentification

- **Parent** : compte réel Supabase Auth (email + mot de passe ou lien magique).
- **Enfant** : recommandé de garder simple — un code PIN court ou sélection d'avatar rattaché au compte du foyer, plutôt qu'un vrai compte email pour un ado de cet âge. Point de décision à trancher tôt avec Claude Fable 5 : simplicité d'usage quotidien vs rigueur de sécurité (peu critique ici, données non sensibles).

### Hébergement (Vercel ou Netlify)

- Déploiement automatique à chaque push sur `main` = chaque commit livré, conforme à la contrainte du projet.
- **Preview deployments** par branche/PR : utile même en solo pour tester une fonctionnalité avant de la merger.
- Variables d'environnement (URL Supabase, clé anonyme) gérées dans le dashboard d'hébergement, jamais commitées en clair.

### Audio (recommandation affinée)

- **Important changement par rapport à la première version** : la voix native `SpeechSynthesis` en néerlandais (surtout `nl-BE`) est inconsistante selon les navigateurs/appareils (iOS Safari vs Chrome Android par exemple) — qualité et disponibilité variables.
- **Recommandation** : lors de l'import de contenu (§10), générer une fois des fichiers audio de référence via une API de synthèse vocale de qualité (à choisir), les stocker dans Supabase Storage, et les rejouer tels quels dans l'app. Ça garantit une prononciation homogène et fiable sur tous les appareils.
- `SpeechRecognition` (reconnaissance) reste utilisable en bonus pour un feedback indicatif de prononciation côté élève, mais jamais comme seul juge (cf. §13).

### TypeScript strict

- `strict: true`, `noImplicitAny` activés dès le premier commit.
- Types de la base générés automatiquement depuis le schéma Supabase (`supabase gen types typescript`), pour ne jamais désynchroniser types et schéma réel.

### Tests (Vitest)

- Tests unitaires prioritaires sur les fonctions pures critiques : algorithme SRS, calcul XP/streak, conversion pièces→minutes.
- **React Testing Library** en complément, sur le parcours critique uniquement (déroulé d'une session) — pas de couverture exhaustive de l'UI, ce serait disproportionné pour ce projet.

### Outillage complémentaire

- **ESLint + Prettier** : cohérence du code dès le début, réglages stricts mais standards (pas de config maison compliquée).
- **GitHub Actions** (optionnel mais recommandé) : job simple de lint + tests à chaque push, avant que Vercel/Netlify ne déploie — filet de sécurité minimal pour éviter de casser `main` par erreur.
- Gestionnaire de paquets : **npm** suffit largement pour un projet solo de cette taille, pas besoin de pnpm/yarn sauf préférence personnelle.
