# Roadmap Bestie Book Battle

---

## P0 — Bugs & Bloquants

- [ ] **Bug déconnexion au retour sur l'app**
  Dès que tu quittes l'app et que tu reviens, ça te déconnecte et tu dois te reconnecter. Des fixes récents ont été poussés (`fix(auth)`, `fix(loading): protect cache from stale token`) mais faut vérifier si le bug persiste encore sur la dernière build. Si oui → investiguer `authStore.ts` et le listener `onAuthStateChange`.

- [ ] **Problème des pages**
  Le système de suivi des pages a des incohérences — quand on met à jour ses pages ça bug dans certains cas. Lié aussi au fait que les participants peuvent avoir des éditions différentes (pas le même nombre de pages total). Si on détecte des nombres de pages différents entre participants, il faudrait basculer sur un pourcentage pour le classement plutôt qu'un nombre de pages brut. La logique pourcentage existe déjà dans `database.ts` mais faut vérifier qu'elle marche correctement.

- [ ] **Problème de cache**
  Des données restent stale / ne se rafraîchissent pas correctement. `projectStore.ts` utilise persist + AsyncStorage avec un système de protection (si l'API retourne 0 résultats le cache est conservé). Malgré les fixes récents, des cas limites subsistent. Besoin de persister certaines infos qui ne sont pas encore persistées.

- [ ] **Placeholder année qui disparaît**
  Quand tu crées un BBB et que tu cliques sur le champ année, le placeholder disparaît et t'as tout blanc — tu sais plus ce que tu dois écrire. Fichier : `onboarding/create.tsx`.

---

## P1 — Core V1

- [ ] **Pile à lire (PAL) individuelle**
  Chaque user a sa propre liste de livres "à lire". C'est la base pour plus tard pouvoir faire une roulette random, des book clubs, etc. Nécessite une nouvelle table Supabase, un nouveau store Zustand, et un nouvel écran dédié.

- [ ] **@username**
  Avoir un identifiant unique type @lea pour chaque user. Aujourd'hui y'a juste le prénom via Apple Sign In. Nécessite : migration DB pour ajouter un champ `username` unique, validation (pas de doublons, format), et un écran de setup dans le profil ou l'onboarding.

- [ ] **Recherche de personnes pour ajouter à un challenge**
  Aujourd'hui pour ajouter quelqu'un tu dois partager un code d'invitation 6 caractères (`project/invite.tsx`). L'idée c'est de pouvoir chercher des gens par @username et les ajouter directement. Requiert le @username comme prérequis.

- [ ] **Date picker natif scroll pour la deadline**
  Au lieu du date picker actuel, utiliser un scroll natif iOS (style roulette). `onboarding/deadline.tsx` utilise déjà `@react-native-community/datetimepicker` — vérifier que le mode `spinner` natif est bien activé, sinon switcher.

- [ ] **Gérer les éditions différentes (pages vs pourcentage)**
  Si les participants ont pas le même format / la même édition du livre, le nombre de pages total diffère. Solution : dès qu'on détecte des nombres de pages différents, on affiche un pourcentage de progression pour le classement au lieu du nombre de pages brut. La logique existe partiellement dans `database.ts`, faut la solidifier et l'expliquer clairement dans l'UI.

- [ ] **Modifier la deadline dans "modifier le livre"**
  Quand tu modifies un livre, tu peux pas changer la deadline. Les composants `EditBookSheet` et `DeadlineEditSheet` existent déjà côté front — vérifier que le lien avec le backend est complet et que la modification se sauvegarde.

---

## P2 — Nice to have

- [ ] **Heatmap de lecture sur le profil**
  Dans la page profil, afficher les dots de l'année avec chaque jour de lecture en noir — comme le calendrier de contributions GitHub. Les données sont disponibles via `progress_history` (chaque mise à jour de page est datée). Le composant heatmap est entièrement à créer.

- [ ] **Bookmarking de pages — corner, emoji, note, note vocale**
  Pouvoir "corner" une page spécifique (ex: page 568), ajouter un emoji si t'as chialé, écrire une note texte ou une note vocale. Et avoir un menu rapide pour retrouver toutes tes notes/pages cornées. Gros ajout : nouveau modèle de données (table `page_annotations` avec page, type, contenu), nouveau UI overlay sur l'écran de progression.

- [ ] **Chat de groupe + mode no spoil**
  Avoir un chat pour parler avec son groupe de lecture. Feature clé : le mode "no spoil" — ceux qui sont derrière toi dans la lecture ne peuvent pas voir tes messages (ou ils sont blurrés). Gros chantier : Supabase Realtime pour le messaging, nouveau store, nouveaux écrans, logique de filtrage basée sur la progression de chaque participant.

- [ ] **Roulette random parmi les livres à lire**
  Une roulette animée qui choisit aléatoirement le prochain livre parmi ta pile à lire. Feature fun et engageante. Dépend de la PAL (P1). Animation avec `react-native-reanimated`.

- [ ] **Mascotte : yeux dans nuage**
  Le design de la mascotte BBB — des yeux (blancs, contour bleu répliqué) dans un nuage, sur fond noir. `PopEyes.tsx` existe déjà avec les yeux (variants together/left/right). L'idée c'est d'ajouter l'élément nuage autour. C'est principalement une tâche design/illustration.

---

## P3 — Vision future

- [ ] **Système de book clubs (multi-clubs, PAL par club)**
  Un user peut être dans plusieurs book clubs. Chaque club a sa propre PAL commune. L'architecture actuelle est basée sur des "challenges" individuels — il faudrait refondre vers un modèle `book_clubs` > `challenges` où un club contient plusieurs lectures. Dépend de la PAL individuelle (P1).

- [ ] **Gamification : système de maillots (inspiré du vélo)**
  Comme au Tour de France :
  - Maillot jaune : celle qui finit le livre en premier
  - Maillot vert : la plus régulière (lit tous les jours)
  - Maillot bleu : celle qui a lu le plus la nuit
  `StreakBadge.tsx` et `Crown.tsx` existent comme base de gamification. Pour le maillot bleu il faut un tracking horaire (champ `read_at` timestamp dans `progress_history`).

- [ ] **Icône d'app dynamique pour le leader**
  Si t'as la couronne (tu es en tête du classement), ton icône d'app sur l'écran d'accueil change pour un design plus stylé. Motivation pour pas perdre le truc cool. Faisable sur iOS via `CFBundleAlternateIcons` mais nécessite un plugin Expo natif + logique de mise à jour côté backend.

---

## Skills / MCP (Santos Studio)

### Déjà fait
- ~~UX writing~~ → `santostudio-ux/essentials/ux-writing.md`
- ~~Accessibilité~~ → `santostudio-ux/essentials/accessibility.md`
- ~~Responsive~~ → `santostudio-ux/essentials/responsive.md`
- ~~Centraliser les .md UX/UI~~ → partiellement fait, les fichiers existent dans `essentials/`

### À faire — Structure

- [ ] **Design system dédié**
  Créer un vrai skill `santostudio-design-system` avec les tokens (couleurs, typo, spacing), les patterns de composants, et les conventions. Aujourd'hui `create-design-system-rules` est un skill Figma MCP générique, pas un design system propre à Santos Studio.

- [ ] **Séparer common knowledge VS company knowledge / style guide**
  Restructurer les skills en 2 niveaux : (1) les fondamentaux universels que tout dev/designer devrait suivre (UX writing, accessibilité, responsive…) et (2) les guides spécifiques par client/projet (le "taste" du client, ses tokens, ses conventions). C'est le coeur du pitch commercial — le common knowledge c'est le socle gratuit, le company knowledge c'est la valeur ajoutée payante.

### À faire — Packaging & Distribution

- [ ] **Package npm installable**
  Packager les skills comme un module npm pour que n'importe qui puisse faire `npm install` et avoir les skills dans son projet. Nécessite : `package.json`, structure de fichiers exportable, README, publication sur npm.

- [ ] **MCP server pour les skills**
  Rendre les skills utilisables comme un serveur MCP que n'importe quel dev peut brancher sur Claude Code, Cursor, etc. Style "Claude Code mais avec mon taste". C'est le mode de distribution pro.

- [ ] **Sub-agents spécialisés**
  Avoir des sub-agents dédiés : un agent UX, un agent UI, un agent design system qui collaborent ensemble. Chacun a son expertise et ses skills chargées.

### À faire — Démo & Commercial

- [ ] **Loom 3 états**
  Faire une vidéo démo avec 3 scénarios : (1) un dev code sans rien, (2) un dev code avec juste un screen Figma, (3) un dev code avec les skills activées. Objectif : prouver visuellement que ça fonctionne et que le dev "ne peut pas mentir" — le résultat parle de lui-même.

- [ ] **Test comparatif 3 versions**
  Documenter le résultat concret du code généré dans chacun des 3 scénarios du Loom. Captures, diff, qualité du output.

- [ ] **Skill sur un client concret**
  Créer un exemple réel de skill spécifique client (company knowledge) pour montrer la différence entre le socle commun et la personnalisation. C'est la preuve du concept "common vs company".

- [ ] **Outreach**
  Envoyer la vidéo Loom + les résultats du test à des prospects et demander si ça les intéresse. Premier cycle de validation marché.

---

## Vision & Positionnement

> Notes de réflexion stratégique — la direction, pas des tâches.

- **"AI full, tu développes avec mon taste"** — Le positionnement : une designeuse dont le goût et les standards sont encodés dans des skills AI. Le client achète pas juste du design, il achète un système qui reproduit la qualité de façon constante.

- **"Le front-end engineering c'est résolu, le design et le back non"** — L'IA sait générer du code front-end correct. Mais le design (les décisions, la hiérarchie, l'UX) et le back-end restent les vrais différenciateurs humains. C'est là que Santos Studio apporte de la valeur.

- **"Je design et j'aide à shipper plus vite"** — Proposition de valeur : accélération du time-to-ship en combinant design + engineering via les skills. Tu designs ET tu fais gagner du temps de dev.

- **"En un prompt t'as mon design Figma"** — Le pitch quantifié : les skills transforment un prompt en implémentation fidèle au design, en éliminant les allers-retours Figma-to-code. Le dev n'a qu'à prompter.
