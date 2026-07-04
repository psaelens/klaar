# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M0 (terminée côté code, déploiement en cours)

## Dernière action terminée :

M0 complet et vérifié en local : squelette Vite 8 + React 19 + TS strict + Tailwind 4, flashcards vocab NL→FR avec SRS type SM-2 (10 tests unitaires verts), 64 mots de départ en JSON, stockage localStorage, mode sombre, mobile-first. Flux complet vérifié au navigateur via Playwright (session, requeue des cartes ratées, bilan, persistance, thème).

## Prochaine action à faire :

Déployer M0 : créer le repo GitHub privé `klaar` (gh CLI authentifié en tant que psaelens), pousser `main`, puis brancher Vercel dessus (si le CLI Vercel n'est pas authentifié, demander à Pierre de faire le lien Vercel↔GitHub une fois — voir « Décisions en attente »). Ensuite : démarrer M1 (Supabase : projet, migrations CLI avec RLS dès le premier commit, sync SRS, streak, XP, écran d'import de contenu — PRD §11).

## Décisions en attente de validation par Pierre :

- Faire vérifier l'échantillon des 64 mots de vocabulaire de départ (`src/data/vocab.json`) par un néerlandophone ou via l'import validé (PRD §13) — générés par Claude, non validés par un tiers.
- Si le déploiement Vercel ne peut pas être fait depuis cette machine : créer un compte Vercel (gratuit) et importer le repo GitHub `klaar` (Framework preset : Vite). Une fois fait, chaque push sur `main` déploiera automatiquement.

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session (dont « du 1er coup ») repartent de zéro — l'état SRS par carte est lui bien persisté après chaque réponse. Cosmétique, assumé pour M0 (noté dans DECISIONS.md).
- Le PRD a été reformaté une fois par Prettier (tables réalignées, contenu inchangé) ; `docs/PRD.md` est désormais dans `.prettierignore`.
