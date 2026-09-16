# Roadmap Bestie Book Battle

## L'app : tout est dans le GitHub Project

La roadmap de l'app vit **uniquement** dans le project **[BBB Roadmap](https://github.com/users/leasnts/projects/1)**. C'est la seule source de vérité : statuts, priorités (labels `P0` à `P3`), jalons et issues détaillées.

Points d'entrée :

- **Jalon [V1 · Accueil club + carnet](https://github.com/leasnts/bestie-book-battle/milestones)**, dans cet ordre :
  1. [#30 Accueil en trois cadres](https://github.com/leasnts/bestie-book-battle/issues/30) (epic)
  2. [#12 Carnet partagé](https://github.com/leasnts/bestie-book-battle/issues/12) (epic)
- **Jalon V2 · Conversation** : commentaires sur les notes, citation par photo, caps planifiés d'avance.

L'ancienne liste P0 → P3 de ce fichier a été retirée le 15/09/2026 : elle n'était plus à jour. Elle reste consultable dans l'historique git de ce fichier.

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
