---
name: santostudio-design-system
description: "Generate custom design systems: tokens (colors, spacing, typography, radius, shadows), component architecture, and exports (CSS, Tailwind, JSON). Use for creating client-specific UI foundations."
---

# Santos Studio Design System Generator

Create complete, production-ready design systems tailored to a client's brand, product, and team needs.

**This skill GENERATES design systems. It does NOT apply a pre-existing style.**

## When to Use This Skill

Trigger when the user:
- Wants to create a design system from scratch
- Needs to define design tokens for a project
- Asks for brand-aligned UI foundations
- Wants to document component architecture
- Needs exportable tokens (CSS, Tailwind, JSON, Figma)
- Mentions "design system", "tokens", "foundations", "UI guidelines"

**NOT for:** Applying an existing style (use `santostudio-ui` for that)

---

## Process Overview

```
┌─────────────────────────────────────────────────────────────┐
│  1. DISCOVERY                                               │
│     Collect brand inputs, constraints, team context         │
├─────────────────────────────────────────────────────────────┤
│  2. FOUNDATIONS                                             │
│     Define tokens: colors, spacing, typography, radius      │
├─────────────────────────────────────────────────────────────┤
│  3. COMPONENTS                                              │
│     Architecture: atoms → molecules → organisms             │
├─────────────────────────────────────────────────────────────┤
│  4. DOCUMENTATION                                           │
│     Guidelines, do/don't, usage examples                    │
├─────────────────────────────────────────────────────────────┤
│  5. EXPORT                                                  │
│     CSS variables, Tailwind config, JSON, Figma tokens      │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. DISCOVERY

**Goal:** Understand the client's brand, product, and constraints before defining anything.

### Questions to Ask

**Brand & Identity:**
- Do you have existing brand colors? Logo? Visual identity?
- What's the personality? (Professional, playful, bold, minimal, premium...)
- Who are your competitors? What do you want to feel different from?

**Product & Users:**
- What type of product? (SaaS, e-commerce, mobile app, dashboard...)
- Who are the users? (B2B, B2C, internal tools, developers...)
- What's the primary action users take?

**Technical Constraints:**
- Tech stack? (React, Vue, vanilla, Tailwind, CSS-in-JS...)
- Existing codebase to integrate with?
- Accessibility requirements? (WCAG AA, AAA?)
- Dark mode needed?

**Team & Scale:**
- How many designers/developers will use this?
- Do they need Figma tokens? Code tokens? Both?
- What level of documentation do they need?

### Discovery Output

After discovery, summarize:

```markdown
## Client Profile

**Brand:** [Brand name]
**Personality:** [3-5 adjectives]
**Product type:** [SaaS / E-commerce / App / Dashboard / etc.]
**Users:** [Target audience]
**Tech stack:** [React + Tailwind / Vue / etc.]
**Constraints:** [Accessibility level, dark mode, etc.]
**Differentiation:** [What should feel unique]
```

---

## 2. FOUNDATIONS (Tokens)

**Goal:** Define the core design tokens that will power the entire system.

### Token Categories

#### 2.1 Colors

**Structure:**
```
colors/
├── brand/
│   ├── primary    → Main brand color (buttons, links, key actions)
│   ├── secondary  → Supporting color (accents, badges)
│   └── accent     → Optional third color (highlights)
├── semantic/
│   ├── success    → Green (confirmations, positive)
│   ├── warning    → Orange/Yellow (caution, pending)
│   ├── error      → Red (errors, destructive)
│   └── info       → Blue (informational)
├── neutral/
│   ├── gray-50 to gray-950  → Full gray scale
│   ├── white
│   └── black
└── surface/
    ├── background → Page backgrounds
    ├── card       → Card/container backgrounds
    ├── elevated   → Modals, dropdowns
    └── overlay    → Backdrop overlays
```

**Scale system (for each color):**
- 50, 100, 200, 300, 400, 500 (base), 600, 700, 800, 900, 950

**Rules to follow:**
- Primary color must have sufficient contrast (WCAG AA minimum)
- Semantic colors are universal (don't change success from green)
- Dark mode: lighter shades for accents (500 → 400)

#### 2.2 Spacing

**Define a scale based on client needs:**

| Token | Suggested | Use Case |
|-------|-----------|----------|
| `spacing-1` | 4px | Micro gaps, icon padding |
| `spacing-2` | 8px | Tight gaps, icon + text |
| `spacing-3` | 12px | Small gaps, list items |
| `spacing-4` | 16px | Standard gaps, card padding |
| `spacing-5` | 20px | Medium gaps |
| `spacing-6` | 24px | Section gaps |
| `spacing-8` | 32px | Large gaps |
| `spacing-10` | 40px | XL gaps |
| `spacing-12` | 48px | Hero spacing |
| `spacing-16` | 64px | Page sections |

**Common scales:**
- 4px base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- 8px base: 8, 16, 24, 32, 40, 48, 64, 80, 96

**Rule:** Pick ONE scale and stick to it. Never mix.

#### 2.3 Typography

**Structure:**
```
typography/
├── font-family/
│   ├── display   → Headlines, hero text
│   ├── body      → Paragraphs, UI text
│   └── mono      → Code, technical
├── font-size/
│   ├── xs        → 12px (small labels)
│   ├── sm        → 14px (secondary text)
│   ├── base      → 16px (body text)
│   ├── lg        → 18px (large body)
│   ├── xl        → 20px (small titles)
│   ├── 2xl       → 24px (titles)
│   ├── 3xl       → 30px (large titles)
│   ├── 4xl       → 36px (hero titles)
│   └── 5xl+      → 48px+ (display)
├── font-weight/
│   ├── normal    → 400
│   ├── medium    → 500
│   ├── semibold  → 600
│   └── bold      → 700
└── line-height/
    ├── tight     → 1.2 (headlines)
    ├── normal    → 1.5 (body)
    └── relaxed   → 1.75 (long text)
```

**Font pairing guidelines:**
- Display + Body: Contrast in style (geometric + humanist)
- Keep to 2 fonts max (3 if mono needed)
- Ensure web font availability

#### 2.4 Border Radius

**Scale:**
```
radius/
├── none     → 0px
├── sm       → 4px (subtle rounding)
├── md       → 8px (standard)
├── lg       → 12px (pronounced)
├── xl       → 16px (large components)
├── 2xl      → 20px (cards, modals)
├── 3xl      → 24px (feature cards)
└── full     → 9999px (pills, avatars)
```

**Guidelines:**
- Larger components = larger radius
- Consistency: if buttons are 12px, inputs should be 12px too
- Brand personality: sharp (0-4px) = professional, rounded (16px+) = friendly

#### 2.5 Shadows

**Scale:**
```
shadow/
├── none     → none
├── sm       → Subtle lift (cards)
├── md       → Standard elevation (dropdowns)
├── lg       → Pronounced (modals)
├── xl       → Dramatic (overlays)
└── inner    → Inset shadow (inputs, wells)
```

**Example values:**
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

#### 2.6 Motion

**Durations:**
```
duration/
├── instant  → 0ms (no transition)
├── fast     → 100ms (micro-interactions)
├── normal   → 200ms (standard)
├── slow     → 300ms (modals, large)
└── slower   → 500ms (page transitions)
```

**Easings:**
```
easing/
├── ease-out    → Entrances, hover
├── ease-in     → Exits, closing
├── ease-in-out → Toggles, transforms
└── spring      → Playful (if brand fits)
```

---

## 3. COMPONENTS

**Goal:** Define component architecture and patterns.

### Atomic Design Structure

```
components/
├── atoms/          → Smallest units
│   ├── button
│   ├── input
│   ├── badge
│   ├── avatar
│   └── icon
├── molecules/      → Combinations of atoms
│   ├── form-field  → label + input + error
│   ├── card        → image + content + actions
│   ├── nav-item    → icon + label
│   └── search-bar  → input + button
├── organisms/      → Complex components
│   ├── header
│   ├── sidebar
│   ├── modal
│   └── data-table
└── templates/      → Page layouts
    ├── dashboard-layout
    ├── auth-layout
    └── settings-layout
```

### Component Specification Template

For each component, document:

```markdown
## [Component Name]

### Purpose
[What problem does this solve?]

### Variants
- Primary / Secondary / Ghost / Destructive
- Small / Medium / Large

### States
- Default
- Hover
- Active/Pressed
- Focus
- Disabled
- Loading

### Anatomy
[Diagram or description of parts]

### Props/API
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | string | 'primary' | Visual style |
| size | string | 'md' | Size variant |
| disabled | boolean | false | Disabled state |

### Usage Guidelines
✅ Do: [Good usage]
❌ Don't: [Bad usage]

### Code Example
[Implementation snippet]
```

---

## 4. DOCUMENTATION

**Goal:** Make the system usable by the team.

### Documentation Structure

```
docs/
├── getting-started.md    → Quick setup guide
├── foundations/
│   ├── colors.md
│   ├── typography.md
│   ├── spacing.md
│   └── motion.md
├── components/
│   ├── button.md
│   ├── input.md
│   └── [etc.]
├── patterns/
│   ├── forms.md
│   ├── navigation.md
│   └── data-display.md
└── resources/
    ├── figma-link.md
    ├── code-repo.md
    └── changelog.md
```

### Do/Don't Guidelines

For each token category, include:

```markdown
### Colors - Do/Don't

✅ **Do:**
- Use primary color for main CTAs
- Use semantic colors consistently (green = success)
- Ensure 4.5:1 contrast for text

❌ **Don't:**
- Use red for non-destructive actions
- Mix brand colors in gradients
- Use low-contrast text colors
```

---

## 5. EXPORT

**Goal:** Deliver tokens in formats the team can use.

### CSS Variables

```css
:root {
  /* Colors */
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  
  /* Spacing */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-4: 16px;
  
  /* Typography */
  --font-display: 'Cabinet Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-size-base: 16px;
  
  /* Radius */
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary-500: #60a5fa;
  }
}
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        // ...
      },
      // ...
    },
    spacing: {
      1: '4px',
      2: '8px',
      4: '16px',
      // ...
    },
    borderRadius: {
      md: '8px',
      lg: '12px',
      // ...
    },
    fontFamily: {
      display: ['Cabinet Grotesk', 'sans-serif'],
      body: ['Inter', 'sans-serif'],
    },
  },
}
```

### JSON (for Figma / Style Dictionary)

```json
{
  "color": {
    "primary": {
      "500": { "value": "#3b82f6", "type": "color" },
      "600": { "value": "#2563eb", "type": "color" }
    }
  },
  "spacing": {
    "1": { "value": "4px", "type": "spacing" },
    "2": { "value": "8px", "type": "spacing" }
  },
  "borderRadius": {
    "md": { "value": "8px", "type": "borderRadius" }
  }
}
```

---

## Deliverables Checklist

A complete design system delivery includes:

### Tokens
- [ ] Color palette (brand, semantic, neutral, surface)
- [ ] Spacing scale
- [ ] Typography scale (fonts, sizes, weights, line-heights)
- [ ] Border radius scale
- [ ] Shadow scale
- [ ] Motion tokens (durations, easings)

### Components
- [ ] Component inventory (what's included)
- [ ] Specifications for each component
- [ ] States documented (hover, focus, disabled, etc.)
- [ ] Variants documented (sizes, styles)

### Documentation
- [ ] Getting started guide
- [ ] Token usage guidelines
- [ ] Component usage guidelines
- [ ] Do/Don't examples

### Exports
- [ ] CSS variables file
- [ ] Tailwind config (if applicable)
- [ ] JSON tokens (for Figma/Style Dictionary)
- [ ] Dark mode variants

---

## Quick Start Command

When a user says "create a design system for [project]":

1. **Ask discovery questions** (brand, product, tech stack)
2. **Summarize** the client profile
3. **Generate foundations** (tokens for all categories)
4. **Define component architecture** (atoms → organisms)
5. **Create documentation** (usage guidelines)
6. **Export** in requested formats

---

## Related Files

- `process/discovery.md` → Detailed discovery framework
- `process/tokens.md` → Token definition deep-dive
- `process/components.md` → Component architecture patterns
- `process/documentation.md` → Documentation templates
- `templates/` → Export templates (CSS, Tailwind, JSON)
- `examples/sample-output.md` → Complete example delivery
