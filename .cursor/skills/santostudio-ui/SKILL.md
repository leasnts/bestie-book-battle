---
name: santostudio-ui
description: "Santos Studio design system: bold modern UI with 6-32px spacing, 12-20px radius, glassmorphism, motion states, OKLCH colors, fluid typography. Use when creating interfaces, components, layouts, or styling any frontend. Avoids AI clichés."
---

# Santos Studio UI — Design System

Production-grade design system by Léa Santos for bold, modern interfaces that stand out from generic AI-generated work.

## Principles

1. **Dare to be different** — Safe choices lead to forgettable products. Every design decision should be intentional, not default.
2. **Components must feel ALIVE** — Static UIs are dead UIs. Every interactive element needs hover, active, focus, disabled, loading states.
3. **Context-driven effects** — Glassmorphism, glow, skeuomorphism are tools, not decoration. Use them when they add meaning.
4. **No AI slop** — If someone would say "AI made this" immediately, you've failed. No purple gradients, no generic patterns.

## When to Use This Skill

Trigger when the user:
- Creates buttons, cards, inputs, forms, modals, or any UI component
- Wants "modern", "professional", "clean", or "bold" design
- Needs help with spacing, padding, colors, typography, or styling
- Wants to avoid generic or AI-generated aesthetics
- Mentions Santos Studio, Santos Studio, or Léa Santos design standards

**For UX patterns** (accessibility, responsive, user flows, forms, feedback): see `santostudio-ux`

## Context Gathering

Design without context produces generic output. Before any design work, confirm:
- **Target audience**: Who uses this and in what context?
- **Brand personality**: How should this feel? (Premium? Playful? Serious?)
- **Technical constraints**: Framework, platform, performance budget?

If context is missing, ask before designing. Don't guess — code tells you what was built, not who it's for.

## Structure

### Essentials (Foundations)
- `essentials/colors.md` — OKLCH palettes, tinted neutrals, forbidden colors, combos
- `essentials/spacing.md` — 6-32px scale, fluid spacing, container patterns
- `essentials/typography.md` — Font pairing, fluid type, hierarchy, OpenType features
- `essentials/effects.md` — Glassmorphism, glow, skeuomorphism recipes
- `essentials/motion.md` — Easing curves, timing, reduced motion, interaction states

### Components (Ready-to-Use Recipes)
- `components/buttons.md` — 4-type button system with all states
- `components/cards.md` — Standard & glassmorphism cards
- `components/inputs.md` — Form inputs, selects, toggles
- `components/modals.md` — Desktop modals & mobile bottom sheets

## Quick Reference

```
SPACING:     6, 8, 12, 16, 20, 24, 32 (40, 48, 64 for heroes)
RADIUS:      12-16px (buttons), 16-20px (cards/inputs), 9999px (pills)
TYPOGRAPHY:  12, 14, 16, 24px | Distinctive display + refined body font
COLORS:      ❌ No purple/red primary | ✅ Pink+orange, blue+green, monochrome
             ❌ No pure gray/black | ✅ Tint neutrals toward brand hue
EFFECTS:     Glassmorphism (premium), Glow (tech), Skeuomorphism (contextual)
MOTION:      ALL interactive elements need states | 150-300ms | ease-out-quart
ANTI-SLOP:   No purple gradients, no cards-in-cards, no generic dark+glow
```

## Critical Rules

### Colors

**NEVER:**
- ❌ Purple as primary color (AI cliché — every AI tool uses purple)
- ❌ Red as primary color (reserved for errors/destructive only)
- ❌ Multi-color gradients (blue→purple, pink→orange as gradients)
- ❌ Pure gray `#808080` or pure black `#000` for backgrounds/text — they look dead
- ❌ Gray text on colored backgrounds — it looks washed out
- ❌ Cyan-on-dark, purple-to-blue gradients, neon accents on dark (the AI color palette)

**ALWAYS:**
- ✅ Mono-palette gradients only (blue-500→blue-800)
- ✅ Bold combos used separately (not as gradients): pink+orange, pink+red, blue+green, monochrome
- ✅ Tint your neutrals — add 0.01 chroma of your brand hue for subconscious cohesion
- ✅ Use semantic color tokens (`--color-primary`, `--color-error`), never raw hex in components

```css
/* ❌ WRONG — Dead neutrals */
--gray-100: #f5f5f5;
--gray-900: #1a1a1a;

/* ✅ CORRECT — Tinted neutrals (hint of brand warmth) */
--gray-100: oklch(95% 0.01 60);
--gray-900: oklch(15% 0.01 60);
```

**Modern approach:** Prefer OKLCH color space for perceptually uniform palettes. Equal steps in lightness actually look equal, unlike HSL.

```css
/* OKLCH: lightness (0-100%), chroma (0-0.4+), hue (0-360) */
--color-primary: oklch(60% 0.15 250);
--color-primary-light: oklch(85% 0.08 250); /* Reduce chroma as you lighten */
--color-primary-dark: oklch(35% 0.12 250);
```

### Spacing

**Scale:** `6, 8, 12, 16, 20, 24, 32px` (extensions: 40, 48, 64 for heroes)

| Value | Usage |
|-------|-------|
| 6px | Icon + text gap, badge padding |
| 8px | Title + icon, small horizontal gaps |
| 12px | Horizontal blocks, card grids gap |
| 16px | Card padding, list items |
| 20px | Large card padding, input horizontal |
| 24px | Section gaps, header → content |
| 32px | Large separations, onboarding screens |

**NEVER:**
- ❌ Below 6px spacing
- ❌ Arbitrary values (13px, 17px, 22px — use the scale)
- ❌ Same spacing everywhere — vary spacing to create visual rhythm

**FOR WEB:** Use `clamp()` for fluid spacing that breathes on larger screens:
```css
--space-section: clamp(24px, 4vw, 48px);
```

**FOR LAYOUT:** Prefer `gap` over margins for sibling spacing (no margin collapse issues).

### Typography

**Font strategy:** Pair a distinctive display font with a refined body font. Avoid invisible defaults.

```
❌ AVOID: Inter, Roboto, Arial, Open Sans, system defaults (generic, forgettable)
✅ PREFER: Plus Jakarta Sans, Outfit, Instrument Sans, DM Sans
✅ FOR DISPLAY: Fraunces, Newsreader, or any font with personality
✅ FOR CLIENTS: Match their brand font, or propose something distinctive
```

**Scale:** 12, 14, 16, 24px (30px only for hero single-screen onboarding)

| Role | Size | Weight |
|------|------|--------|
| Small/labels | 12px | Regular or Medium |
| Body | 14px | Regular |
| Small titles | 16px | Medium or SemiBold |
| Large titles | 24px | Bold |
| Hero (rare) | 30px | Bold |

**Hierarchy rules:**
- Use fewer sizes with more contrast (3:1 ratio minimum between heading and body)
- Weight contrast matters: pair 700 with 400, not 500 with 400
- Line-height: 1.2 for headings, 1.5 for body, 1.625 for long-form
- Max line length: 65ch for body text

**FOR WEB — Fluid type for headings:**
```css
h1 { font-size: clamp(1.5rem, 1rem + 2vw, 2.5rem); }
```

**FOR WEB — Font loading:**
```css
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  font-display: swap; /* Show text immediately, swap when font loads */
}
```

### Radius

**Rule:** More important/larger = more radius.

| Element | Radius |
|---------|--------|
| Small buttons, badges | 12px |
| Large buttons | 16px |
| Cards, inputs, containers | 16-20px |
| Pills, tags | 9999px (full) |

- ❌ **NEVER below 12px** — 8px looks too sharp for modern design
- ❌ **NEVER same radius on everything** — differentiate element types

### Motion (CRITICAL)

**ALL interactive elements MUST have:**
- ✅ Hover state (scale, shadow, color change, or background shift)
- ✅ Active/pressed state (pressed-in effect)
- ✅ Focus-visible state (keyboard users — see `santostudio-ux` for details)
- ✅ Disabled state (reduced opacity, no pointer events)
- ✅ Loading state (for async actions)
- ✅ Smooth transitions

**Timing:**

| Duration | Use Case |
|----------|----------|
| 100-150ms | Instant feedback (button press, toggle, color change) |
| 200-300ms | State changes (menu open, hover effects, tooltip) |
| 300-500ms | Layout changes (accordion, modal, drawer) |
| 500-800ms | Entrance animations (page load, hero reveals) |

Exit animations are faster than entrances — use ~75% of enter duration.

**Easing — USE THESE, not CSS defaults:**

```css
/* ✅ CORRECT — Natural deceleration curves */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);    /* Smooth, refined (DEFAULT) */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);   /* Slightly snappier */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);     /* Confident, decisive */

/* ❌ WRONG — Dated, tacky */
/* bounce: cubic-bezier(0.34, 1.56, 0.64, 1); */
/* elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6); */
```

**Reduced motion — NON-NEGOTIABLE:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Only animate `transform` and `opacity`** — everything else triggers layout recalculation and kills performance.

### Component Motion Patterns

```jsx
// ✅ Button
className="
  transition-all duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]
  hover:scale-[1.02] hover:shadow-lg
  active:scale-[0.98]
  focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
  disabled:opacity-50 disabled:pointer-events-none
"

// ✅ Card
className="
  transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
  hover:-translate-y-1 hover:shadow-xl
  cursor-pointer
"

// ✅ Icon button
className="
  transition-all duration-150
  hover:scale-110 hover:bg-gray-100
  active:scale-95
"
```

## Signature Effects

### Glassmorphism (Santos Studio Recipe)

```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid;
  border-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.2),  /* 20% at top — SIGNATURE */
    rgba(255, 255, 255, 0.1)   /* 10% at bottom */
  ) 1;
  border-radius: 20px;
}
```

**Rules:**
- On colored backgrounds: icons/text/buttons = WHITE
- On dark backgrounds: icons = light accent color, buttons = colored
- Use purposefully — glassmorphism everywhere is AI slop
- This recipe is adaptable per project (client design systems may override)

### Glow Effects
- Colored shadows matching the element
- For tech products, premium UI, data viz
- Radial gradients for "light source" effect

### Skeuomorphism
- ONLY for physical/mechanical products (e.g., musical instruments, hardware)
- Inset effects, progress bars "creusées"
- Never by default — contextual only

## The AI Slop Test

Before shipping, check: **would someone immediately say "AI made this"?**

These are the fingerprints of AI-generated work (2024-2026):
- ❌ Purple-to-blue gradients on everything
- ❌ Dark mode with glowing cyan/neon accents
- ❌ Gradient text on metrics or headings
- ❌ Glassmorphism used decoratively (not purposefully)
- ❌ Cards nested inside cards
- ❌ Identical card grids (same-sized cards: icon + heading + text, repeated)
- ❌ Hero metric layout (big number, small label, gradient accent)
- ❌ Centered everything — left-aligned text with asymmetric layouts feels more designed
- ❌ Rounded rectangles with generic drop shadows
- ❌ Large icons with rounded corners above every heading
- ❌ Inter/Roboto/system fonts everywhere
- ❌ Bounce/elastic animations

A distinctive interface makes someone ask "how was this made?" not "which AI made this?"

## Component Defaults

| Element | Padding | Radius | Font | Motion |
|---------|---------|--------|------|--------|
| Button (large) | 16px H / 12px V | 16px | 14-16px medium | hover:scale-102, active:scale-98, 150ms |
| Button (small) | 12px H / 8px V | 12px | 12-14px medium | hover:scale-102, active:scale-98, 150ms |
| Card | 16-20px | 16-20px | — | hover:-translate-y-1, shadow↑, 200ms |
| Input | 20px H / 16px V | 16-20px | 14px regular | focus:ring, border color, 150ms |
| Badge/Pill | 8-12px H / 4-6px V | 9999px | 12px medium | — |
| Modal | 24-32px | 20px | — | fade+scale entrance, 300ms |
| Section gap | 24-32px | — | — | — |
| Icon button | 12px (44px total) | 12px | — | hover:scale-110, hover:bg-tint, 150ms |

## Design Workflow

1. **Gather context** — audience, brand personality, constraints
2. **Choose a direction** — bold but intentional aesthetic. Not "modern" — be specific: "premium minimal", "vibrant tech", "editorial clean"
3. **Set tokens first** — colors (OKLCH), spacing scale, type scale, radius scale
4. **Build components** — with ALL interaction states (hover, active, focus-visible, disabled, loading)
5. **Compose layouts** — with intentional spacing rhythm (tight groupings + generous separations)
6. **Add motion** — purposeful, with ease-out-quart, respecting reduced motion
7. **Run the AI Slop Test** — check every DON'T listed above
8. **Polish** — alignment, consistency, edge cases, touch targets

## Inspiration Sources

This system draws from:
- **Opal** — Glassmorphism mastery, colored glows, dark mode excellence
- **Revolut** — Premium glassmorphism, 3D elements, data viz
- **Airbnb** — Professional spacing, clear hierarchy, polished interactions
- **Shopify Editions** — Bold creativity, unexpected layouts, saturated colors

**Santos Studio combines the best of all these, with its own distinctive personality.**

---

For detailed implementation, consult the specific files in `essentials/` and `components/` folders.
For UX patterns (accessibility, responsive, forms, feedback), see `santostudio-ux`.
