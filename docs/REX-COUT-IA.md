# REX — Coût d'une implémentation par agent IA (Claude Code)

Estimation préparée pour un retour d'expérience auprès de collègues, sur la base
d'une fonctionnalité précise et représentative : **« état de connexion visible à
l'accueil + mode démo visiteur »** (9 juillet 2026), de la demande en une phrase
jusqu'à la vérification en production. Estimations établies par l'agent lui-même
(Claude Fable 5) à partir des compteurs de sa propre session ; prix API vérifiés
au 9 juillet 2026.

## Ce que la fonctionnalité a demandé

À partir d'un feedback d'une phrase : lecture du code existant, mise à jour du
PRD, écriture (storage, repo, écran d'accueil, ~150 lignes nettes), tests
unitaires + build + lint, script Playwright E2E neuf, adaptation de 6 scripts de
vérification existants, régressions, mise à jour de DECISIONS.md, commit, push,
vérification E2E en production. Soit **~25 allers-retours d'agent** (appels API)
en ~25 minutes, sans intervention humaine.

## Consommation en tokens (mesurée/estimée)

Le point clé pour comprendre la facturation : à **chaque** appel API, l'agent
relit toute sa conversation (ici ~400 000 tokens de contexte accumulés depuis le
début de la session de travail). Sans cache, ce serait ruineux ; avec le prompt
caching (TTL 5 min, maintenu chaud car le travail est continu), ~99 % de cette
relecture est facturée au tarif « cache read », soit 10× moins cher que l'input
plein tarif.

| Poste                                                                                | Volume estimé | Comment c'est mesuré                                                          |
| ------------------------------------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------- |
| Nouveaux tokens ajoutés à la conversation (code écrit, résultats d'outils, messages) | ~41 000       | Delta du compteur de contexte de la session (603,7k → 562,6k restants sur 1M) |
| Appels API (tours d'agent)                                                           | ~25           | Comptés dans la session                                                       |
| Tokens relus depuis le cache (~415k de contexte × 25 appels)                         | ~10 400 000   | Calcul                                                                        |
| Tokens écrits au cache (les ~41k nouveaux, écrits une fois)                          | ~41 000       | Calcul                                                                        |
| Tokens de sortie (texte + contenu des fichiers écrits)                               | ~20 000       | ~la moitié du delta                                                           |

## Équivalent en argent — paiement au token (prix API, juillet 2026)

Prix officiels par million de tokens (MTok) : cache read = 10 % du prix input,
cache write (5 min) = 125 % du prix input.

| Modèle                       | Input / Output | Lecture cache (10,4 M) | Écriture cache (41 k) | Sortie (20 k) | **Total fonctionnalité** |
| ---------------------------- | -------------- | ---------------------- | --------------------- | ------------- | ------------------------ |
| Claude Fable 5 (utilisé ici) | $10 / $50      | $10,40                 | $0,51                 | $1,00         | **≈ $12**                |
| Claude Opus 4.8              | $5 / $25       | $5,20                  | $0,26                 | $0,50         | **≈ $6**                 |
| Claude Sonnet 5              | $3 / $15       | $3,12                  | $0,15                 | $0,30         | **≈ $3,60**              |

Lecture : ~85-90 % du coût vient de la **relecture du contexte** (même cachée),
pas du code produit. Le coût croît donc avec la longueur de la session bien plus
qu'avec la taille de la fonctionnalité — une même fonctionnalité codée en début
de session (contexte court) aurait coûté 3 à 4 fois moins.

Pour l'échelle : la journée entière (modules rédaction M4 + oral M5 + examens
blancs M6 + calibrage sur les épreuves officielles + cette fonctionnalité, soit
4 modules livrés et vérifiés en production) représente ~150-180 appels sur un
contexte moyen de ~250k, soit grossièrement **$50-70 au tarif Fable 5** en
paiement au token.

## Équivalent en argent — abonnement flat

Tarifs abonnements au moment du REX (à revérifier sur claude.ai, ils évoluent) :
Claude Pro ≈ $20/mois, Claude Max 5x ≈ $100/mois, Claude Max 20x ≈ $200/mois.
Les abonnements donnent un quota d'usage glissant (pas un compteur de tokens
contractuel) — d'ailleurs cette session a atteint la limite du plan initial en
milieu de journée, d'où un upgrade.

| Scénario                    | Coût marginal de la fonctionnalité | Point de comparaison                                                                           |
| --------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Abonnement flat (Max)       | $0 (dans le quota)                 | La fonctionnalité « vaut » ~$12 d'API, soit ~12 % d'un mois de Max 5x                          |
| Paiement au token (Fable 5) | ≈ $12                              | Une journée comme celle-ci ≈ $50-70 ; ~3-4 journées équivalentes/mois et le Max 20x est amorti |

Conclusion pour le REX : à usage soutenu (plusieurs sessions de dev par
semaine), l'abonnement flat est nettement gagnant — l'équivalent API d'une seule
grosse journée couvre déjà la moitié d'un Max 20x. Le paiement au token n'a de
sens que pour un usage épisodique ou pour de l'outillage CI/automatisé où l'on
veut un coût par tâche.

## Mise en perspective (l'argument du REX)

La fonctionnalité livrée — écran visiteur, mode démo persistant, pastille de
profil, PRD à jour, E2E local + prod, régressions — représente une demi-journée
à une journée de dev humain. À ~$12 d'équivalent API (ou une fraction d'un
abonnement à $100-200/mois), le rapport est de l'ordre de **30-50× moins cher**
que le coût d'une journée de développement, à condition d'accepter le modèle de
travail : spécifier par le PRD, laisser l'agent vérifier lui-même (tests, E2E,
prod), et relire/valider ses décisions consignées (DECISIONS.md).

## Limites de l'estimation

- Les volumes « cache read » et le nombre d'appels sont estimés par l'agent
  depuis sa session (delta du compteur de contexte) — fiables à ±20 %, pas un
  relevé de facturation.
- L'hypothèse « cache toujours chaud » tient parce que le travail est continu ;
  une session entrecoupée de pauses > 5 min paierait des réécritures de cache.
- Les prix API sont ceux du 9 juillet 2026 (Sonnet 5 a un tarif de lancement
  $2/$10 jusqu'au 31/08/2026) ; les prix d'abonnement sont indicatifs.
- Le quota réel des abonnements Claude n'est pas exprimé en tokens et peut
  changer — la colonne « flat » compare des ordres de grandeur, pas des droits
  contractuels.
