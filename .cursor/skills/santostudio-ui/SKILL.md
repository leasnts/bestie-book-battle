---
name: santostudio-ui
description: "Create modern UI with santostudio philosophy - bold aesthetics, 12-20px radius, 6-32px spacing, motion states, and creative colors that avoid AI clichés"
---

# Santostudio

Professional design system by santostudio for bold, modern interfaces that stand out from generic AI-generated designs.

## Philosophy

**"Professional + Bold"** — Modern & clean, but NEVER generic.

Core beliefs:
- **Dare to be different** — Safe choices lead to forgettable products
- **First impressions = seduction** — Onboarding screens should be beautiful, not minimal
- **Context-driven effects** — Use glassmorphism, glow, skeuomorphism when they add value
- **No AI tool clichés** — Avoid purple gradients, soft pastels, predictable layouts
- **Components must feel ALIVE** — Every interactive element needs hover, active, focus states

## When to Use This Skill

Trigger when the user:
- Creates buttons, cards, inputs, forms, modals, or any UI component
- Wants "modern", "professional", "clean", or "bold" design
- Needs help with spacing, padding, colors, or styling
- Wants to avoid generic or AI-generated aesthetics
- Mentions Santos Studio, Lili Code, or Léa Santos design standards

## Structure

This skill is organized in two parts:

### 📐 Essentials (Universal Design Knowledge)
Core design philosophy that applies to ALL projects:
- `essentials/spacing.md` — 6-32px scale, usage guidelines
- `essentials/colors.md` — Color philosophy, forbidden colors, combos
- `essentials/effects.md` — Glassmorphism, glow, skeuomorphism
- `essentials/motion.md` — Hover states, transitions, micro-interactions

### 🧩 Components (Ready-to-Use Recipes)
Specific component implementations:
- `components/buttons.md` — 4-type button system
- `components/cards.md` — Standard & glassmorphism cards
- `components/inputs.md` — Form inputs, selects, toggles
- `components/modals.md` — Desktop modals & mobile bottom sheets

## Quick Reference

```
SPACING:    6, 8, 12, 16, 20, 24, 32 (40, 48, 64 for heroes)
RADIUS:     12-16px (buttons), 16-20px (cards/inputs)
TYPOGRAPHY: 12, 14, 16, 24px | Inter default
COLORS:     ❌ No purple/red primary | ✅ Pink+orange, blue+green, monochrome
EFFECTS:    Glassmorphism (premium), Glow (tech), Skeuomorphism (contextual)
MOTION:     ALWAYS hover+active+focus states, 150-300ms transitions
```

## Critical Rules

### Colors
- ❌ **NEVER purple as primary** (AI cliché — "ça m'a saoulé, plus jamais!")
- ❌ **NEVER red as primary** (errors/destructive only)
- ❌ **NEVER multi-color gradients** (blue→purple, pink→orange)
- ✅ **ONLY mono-palette gradients** (blue-500→blue-800)
- ✅ **Bold combos used separately**: pink+orange, pink+red, blue+green

### Motion (CRITICAL)
**ALL interactive elements MUST have:**
- ✅ Hover state (scale, shadow, or background change)
- ✅ Active state (pressed effect)
- ✅ Focus state (accessibility)
- ✅ Smooth transitions (150-300ms)

**Static UIs are DEAD UIs.**

### Spacing
- Never below 6px
- Never arbitrary values (13px, 17px, 22px)
- Use the scale: 6, 8, 12, 16, 20, 24, 32px

### Radius
- Minimum: 12px (8px is too sharp)
- Buttons: 12-16px
- Cards/Inputs: 16-20px

## Signature Effects

### Glassmorphism (Santos Studio Style)
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(20px);
border: 1px solid;
border-image: linear-gradient(
  to bottom,
  rgba(255, 255, 255, 0.2),  /* 20% at top */
  rgba(255, 255, 255, 0.1)   /* 10% at bottom */
) 1;
```

**Rules on colored backgrounds:** Icons/text/buttons = WHITE
**Rules on dark backgrounds:** Icons = light accent color, buttons = colored

### Button Motion
```jsx
className="
  transition-all duration-150
  hover:scale-102 hover:shadow-lg
  active:scale-98
  focus:ring-3 focus:ring-blue-100
"
```

### Card Motion
```jsx
className="
  transition-all duration-200
  hover:-translate-y-1 hover:shadow-xl
  cursor-pointer
"
```

## Inspiration Sources

This skill draws from:
- **Opal** — Glassmorphism mastery, colored glows, dark mode excellence
- **Revolut** — Premium glassmorphism, 3D elements, data viz
- **Airbnb** — Professional spacing, clear hierarchy, polished interactions
- **Shopify Editions** — Bold creativity, unexpected layouts, saturated colors

**Santos Studio combines the best of all these, with its own distinctive personality.**

---

For detailed implementation, consult the specific files in `essentials/` and `components/` folders.
