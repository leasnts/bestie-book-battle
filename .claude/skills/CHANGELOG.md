# CHANGELOG — Ce qui a changé entre l'ancienne et la nouvelle version

## santostudio-ui — Changements

### AJOUTÉ (nouveau contenu absorbé des skills tiers)

| Ajout | Source | Pourquoi |
|-------|--------|----------|
| **Context Gathering Protocol** | Impeccable | Sans contexte (audience, brand), l'output est toujours générique |
| **OKLCH color space** | Impeccable | Palettes perceptuellement uniformes — meilleur que HSL |
| **Tinted neutrals** | Impeccable | Jamais de gris pur — ajouter 0.01 chroma de la couleur brand |
| **Anti-patterns "AI Slop Test"** | Impeccable | Checklist exhaustive des clichés AI (cards-in-cards, gradient text, dark+glow...) |
| **Easing curves spécifiques** | Impeccable | `ease-out-quart/quint/expo` avec cubic-bezier exact au lieu de juste "ease" |
| **Reduced motion** | Impeccable | `prefers-reduced-motion` comme règle NON-NÉGOCIABLE |
| **"Only animate transform+opacity"** | Impeccable | Tout le reste cause du layout recalculation |
| **Exit < entrance duration** | Impeccable | Exit = 75% de la durée d'entrée |
| **Section Typography** | Impeccable + Vercel | Était absent du SKILL.md — maintenant avec fluid type, font loading, hierarchy ratios |
| **Font alternatives** | Impeccable | Liste de remplacements pour Inter/Roboto (Plus Jakarta Sans, Outfit, DM Sans...) |
| **"Don't wrap everything in cards"** | Impeccable | + "Don't nest cards in cards" |
| **Semantic color tokens** | OP Agent | `--color-primary` au lieu de hex brut dans les composants |
| **Fluid spacing** | Impeccable | `clamp()` pour le web, `gap` au lieu de margins |
| **Focus-visible** | Impeccable | Ajouté aux component motion patterns (au lieu de juste `focus:ring`) |
| **Disabled + Loading states** | Impeccable | Ajoutés au quick reference des states |

### MODIFIÉ (contenu existant amélioré)

| Avant | Après | Pourquoi |
|-------|-------|----------|
| "Default: Inter" | "Avoid invisible defaults (Inter, Roboto)" + alternatives | Inter est générique — Impeccable a raison, Léa devrait proposer mieux |
| `hover:scale-102, active:scale-98` avec "ease" implicite | Cubic-bezier explicite `ease-out-quart` | Plus pro, plus naturel |
| 3 motion states (hover, active, focus) | 5+ states visibles dans les patterns | Disabled et loading étaient manquants |
| "Jamais en dessous de 6px" seul | + "Jamais les mêmes espacements partout" | Le rythme visuel était absent |
| Colors: juste les combos autorisés/interdits | + OKLCH, tinted neutrals, "gray on color" interdit | Beaucoup plus complet |
| Glassmorphism recipe | + "Use purposefully — glassmorphism everywhere is AI slop" | Mise en garde nécessaire |

### SUPPRIMÉ

| Supprimé | Pourquoi |
|----------|----------|
| Mention "Souvent Poppins + Inter" | Poppins est devenu overused aussi, et Inter est maintenant dans les "à éviter" |

### CONSERVÉ TEL QUEL
- ✅ Spacing scale 6-32px
- ✅ Radius 12-20px avec règle "plus grand = plus de radius"
- ✅ Color combos (pink+orange, blue+green, monochrome)
- ✅ Color interdits (no purple primary, no red primary)
- ✅ Glassmorphism recipe Santos Studio (border gradient 20%→10%)
- ✅ Glow effects et skeuomorphism contextuel
- ✅ Component defaults table
- ✅ Inspiration sources (Opal, Revolut, Airbnb, Shopify)
- ✅ Philosophy "Professional + Bold"

---

## santostudio-ux — Changements

### AJOUTÉ (nouveau contenu absorbé)

| Ajout | Source | Pourquoi |
|-------|--------|----------|
| **8 Interactive States** | Impeccable | Avant: 3 (hover, active, focus). Maintenant: + disabled, loading, error, success, default |
| **Focus-visible vs focus** | Impeccable | Les users souris ne devraient PAS voir le focus ring |
| **Pointer/hover media queries** | Impeccable | Détecter le type d'input, pas juste la taille d'écran |
| **Safe areas env()** | Impeccable | Gestion du notch/Dynamic Island/home indicator |
| **Container queries** | Impeccable | Responsive au niveau du composant, pas juste du viewport |
| **Button label formula** | Impeccable UX Writing | "Verb + Object" au lieu de "OK/Submit/Yes" |
| **Error message formula** | Impeccable UX Writing | "What + Why + Fix" avec templates par situation |
| **Empty states as opportunities** | Impeccable UX Writing | Acknowledge + explain value + provide action |
| **Undo > Confirm** | Impeccable Interaction | Les dialogs de confirmation sont un design failure |
| **Optimistic UI** | Impeccable Interaction | Update immédiat, sync en background, rollback si erreur |
| **Skeleton > Spinner** | Impeccable Interaction | Les skeletons preview la forme du contenu |
| **Terminology consistency table** | Impeccable UX Writing | Delete/Remove/Trash → pick one |
| **Touch target expansion technique** | Impeccable Spatial | `::before` avec `inset: -10px` pour touch area invisible |
| **Placeholder ≠ Label** | Impeccable Interaction | Les placeholders disparaissent — toujours un `<label>` visible |
| **Progressive disclosure** | Impeccable Interaction | Start simple, reveal via interaction |
| **Viewport-fit cover** | Impeccable Responsive | Meta tag pour safe areas |

### MODIFIÉ (contenu existant amélioré)

| Avant | Après | Pourquoi |
|-------|-------|----------|
| "Focus states on ALL elements" | "Focus-visible states" + CSS code example | Plus précis, meilleur pour les users souris |
| "Touch targets 44px min" | 44px iOS / 48px Android + expansion technique | Plus actionable avec le `::before` trick |
| "Immediate acknowledgment <100ms" | Speed hierarchy complet (100ms / 1s / 10s+) | Gradation plus nuancée |
| "Contextual errors" juste mentionné | + `aria-describedby` + placement below field | Plus technique et actionable |
| "Show errors WHERE they happened" | + Error message templates par situation | Des formules concrètes au lieu de juste un principe |
| Accessibility: contrast ratios | + "placeholder text needs 4.5:1 too" + "gray on color" warning | Pièges courants ajoutés |
| Responsive: breakpoints listing | + container queries + input detection + safe areas | Beaucoup plus moderne |

### CONSERVÉ TEL QUEL
- ✅ Mobile-first methodology
- ✅ 5-Second Rule
- ✅ Drunk User Test
- ✅ Error-First Design
- ✅ F-pattern / Z-pattern
- ✅ Heading hierarchy (h1→h2→h3)
- ✅ 5±2 nav items rule
- ✅ Thumb zones bottom 1/3
- ✅ Platform-specific guidance (web vs native)
- ✅ "No lorem ipsum" rule
- ✅ Onboarding = first impression philosophy

---

## Décision clé : Inter

**Avant :** "Default: Inter, souvent Poppins + Inter"
**Après :** "Avoid invisible defaults (Inter, Roboto...)" + alternatives proposées

**Pourquoi ce changement :** Impeccable, le skill d'Anthropic eux-mêmes (`frontend-design`), et shadcn/ui v4 sont tous d'accord — Inter est devenu le "Arial de 2025". C'est un choix safe mais forgettable. Pour un produit qui promet "bold, distinctive design", recommander Inter comme default est contradictoire.

**Proposition :** Léa garde la liberté de choisir Inter pour des projets clients qui le demandent, mais le skill ne le recommande plus par défaut. Les alternatives sont listées (Plus Jakarta Sans, Outfit, DM Sans, Instrument Sans).

**Si tu veux garder Inter comme default :** dis-le moi et je reviens en arrière sur ce point.
