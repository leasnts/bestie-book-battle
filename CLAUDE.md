# Project Instructions

## Règles non négociables

- **Direction artistique : cosy fait main, mais pas trop.** Papier grené, aquarelle, et la maille d'un crochet ou d'un tricot comme matières de l'app, posées dans une structure iOS 26 nette et moderne. La chaleur vient des matières, jamais de la mièvrerie : si un écran évoque une boutique de loisirs créatifs, un scrapbook ou une carte de vœux, c'est trop. S'applique à tout écran, tout composant, toute illustration. Détails dans `DESIGN.md` › Direction artistique.
- **Jamais d'aplat de couleur : toujours un dégradé.** Toute surface remplie (bouton, pastille, disque, capsule, barre de progression…) va d'une teinte un peu plus claire en haut à la même teinte un peu plus foncée en bas. Marron : noyer clair `#5a4536` → noyer profond `#1e140e`. Texte, icônes, filets et bordures fines restent unis. Détails dans `DESIGN.md` › Dégradés, jamais d'aplat.
- **Icônes : Lucide uniquement** (`lucide-react-native`, https://lucide.dev/icons/). Jamais d'Ionicons, de SF Symbols ni d'autre banque, même pour un seul endroit. Détails dans `DESIGN.md` › Icônes.

## Skills

Ces skills contiennent des guidelines et best practices à consulter selon le contexte du travail.

Deux emplacements :
- `.claude/skills/` → skills propres à ce projet
- `~/.claude/skills/` → skills globaux, partagés entre tous les projets

### UI & Design (globaux)
- **Quand tu crées ou modifies des composants UI** (boutons, cards, inputs, modals, couleurs, spacing, effets) → consulte `~/.claude/skills/santostudio-ui/SKILL.md` et les fichiers dans `essentials/` et `components/`
- **Quand tu travailles sur l'UX** (flows, navigation, accessibilité, responsive, formulaires, feedback, microcopy) → consulte `~/.claude/skills/santostudio-ux/SKILL.md` et les fichiers dans `essentials/` et `patterns/`

### Code Quality
- **Quand tu écris du React** (composants, hooks, state, rendu, performance, bundle) → consulte `.claude/skills/react-best-practices/SKILL.md` et les rules dans `rules/`
- **Quand tu écris du React Native / Expo** (listes, animations, navigation, UI native, state) → consulte `.claude/skills/react-native-skills/SKILL.md` et les rules dans `rules/`
- **Quand tu travailles avec Remotion** (vidéo, animations, compositions, captions) → consulte `.claude/skills/remotion-best-practices/SKILL.md` et les rules dans `rules/`
- **Quand tu écris du SQL / Supabase / Postgres** (queries, indexes, schema, RLS, connections) → consulte `.claude/skills/supabase-postgres-best-practices/SKILL.md` et les references dans `references/`

### Figma Integration
- **Quand tu connectes des composants Figma au code** → consulte `.claude/skills/code-connect-components/SKILL.md`
- **Quand tu crées des rules design system pour un agent** → consulte `.claude/skills/create-design-system-rules/SKILL.md`

### Workflow & Tools
- **Quand tu fais des opérations git** (commit, branch, PR, worktree, tag) → consulte `.claude/skills/git/SKILL.md` et le router pour charger la bonne reference
- **Quand tu analyses quelque chose** (code, idée, décision, fichier) → consulte `.claude/skills/analyze/SKILL.md`
- **Quand tu planifies, ship, review, ou gères le workflow** → consulte `.claude/skills/workflow/SKILL.md` et les actions dans `references/actions/`
