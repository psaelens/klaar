# STATUS — état d'avancement Klaar!

## Étape roadmap en cours : M1 TERMINÉ et déployé → prochaine étape M2

## Dernière action terminée :

M1 sous-étape 5 : projet Supabase hébergé **klaar** créé (ref `rlpwxnekrgumefkxtuax`, org « SPi Consulting », région eu-west-3, choisie par Pierre), repo lié, migration poussée (`supabase db push`), config auth poussée (confirmation d'email désactivée ; `[storage.vector]` désactivé dans config.toml — plan Pro requis sinon), 64 mots seedés, `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` ajoutées à Vercel (production), redéployé et **vérifié E2E en prod** : wizard foyer, session, write-through (session + 8 états SRS retrouvés sur le serveur), comptes de test supprimés. Le mot de passe DB est dans `.env.local` (gitignoré) sous `SUPABASE_DB_PASSWORD` ; les `VITE_*` de `.env.local` pointent le stack local Docker pour le dev, la prod utilise les env Vercel.

## Prochaine action à faire :

1) **Pierre** : faire l'onboarding réel sur l'appareil de l'élève — https://klaar-nine.vercel.app → ⚙️ → « Première fois : créer le foyer » (email parent réel + mot de passe, prénom + code élève ; noter l'email élève suggéré pour ses autres appareils). 2) **Dev** : démarrer M2 (PRD §11) — module grammaire (drills) : modèle de contenu `grammar` (déjà prévu dans le schéma), écran de drill (texte à trou / choix), sélection SRS commune, puis dashboard parent v1 (calendrier jours travaillés, minutes/jour, taux de réussite — lecture seule via les policies parent déjà en place et testées).

## Décisions en attente de validation par Pierre :

- Faire vérifier les 64 mots de vocabulaire de départ (`src/data/vocab.json`) par un néerlandophone (PRD §13) — générés par Claude, non validés par un tiers.
- Installer l'app GitHub de Vercel (https://vercel.link/git) pour l'auto-déploiement à chaque push. En attendant, déploiement manuel via `npx vercel deploy --prod --yes` (CLI authentifié, projet `klaar`, prod : https://klaar-nine.vercel.app).
- Le repo GitHub `psaelens/klaar` est **public** — confirmer que c'est voulu pour une app familiale.

## Points d'attention / bugs connus non résolus :

- Si l'élève quitte/recharge en pleine session, la file est recomposée et les compteurs de session (dont « du 1er coup ») repartent de zéro — l'état SRS par carte est lui bien persisté après chaque réponse. Cosmétique, assumé pour M0 (noté dans DECISIONS.md).
- Le PRD a été reformaté une fois par Prettier (tables réalignées, contenu inchangé) ; `docs/PRD.md` est désormais dans `.prettierignore`.
- Recette de vérification runtime documentée dans `.claude/skills/verify/SKILL.md` (preview + Playwright).
