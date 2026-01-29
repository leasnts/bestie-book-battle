# Tokens Definition Guide

How to define each token category for a client's design system.

---

## Token Naming Convention

Use consistent, semantic naming:

```
--[category]-[variant]-[scale]

Examples:
--color-primary-500
--spacing-4
--radius-lg
--shadow-md
--font-size-base
```

**Rules:**
- Lowercase, kebab-case
- Category first (color, spacing, radius...)
- Scale or variant last (500, lg, md...)
- No magic numbers in names (use semantic names)

---

## 1. Colors

### Structure

```
colors/
├── brand/
│   ├── primary-[50-950]
│   ├── secondary-[50-950]
│   └── accent-[50-950] (optional)
├── semantic/
│   ├── success-[50-950]
│   ├── warning-[50-950]
│   ├── error-[50-950]
│   └── info-[50-950]
├── neutral/
│   └── gray-[50-950]
└── surface/
    ├── background
    ├── foreground
    ├── card
    ├── border
    └── muted
```

### Color Scale (50-950)

| Scale | Usage | Light Mode | Dark Mode |
|-------|-------|------------|-----------|
| 50 | Subtle backgrounds | Very light | Very dark |
| 100 | Hover backgrounds | Light | Dark |
| 200 | Borders, dividers | Light | Dark |
| 300 | Disabled states | Medium-light | Medium-dark |
| 400 | Placeholder text | Medium | Medium |
| **500** | **Base color** | **Primary use** | **Primary use** |
| 600 | Hover states | Medium-dark | Medium-light |
| 700 | Active states | Dark | Light |
| 800 | Text on light | Very dark | Very light |
| 900 | High contrast | Near black | Near white |
| 950 | Maximum contrast | Darkest | Lightest |

### Generating a Scale

From a base color (500), generate the full scale:

**Method 1: HSL manipulation**
- Keep hue constant
- Adjust saturation: slightly less at extremes
- Adjust lightness: 95% (50) → 50% (500) → 10% (950)

**Method 2: Tools**
- [Tailwind CSS Color Generator](https://uicolors.app/create)
- [Coolors](https://coolors.co)
- [Leonardo](https://leonardocolor.io)

### Semantic Colors (Universal)

These should stay consistent across all systems:

| Semantic | Base Color | Usage |
|----------|------------|-------|
| Success | Green (#10b981) | Confirmations, positive states |
| Warning | Orange (#f97316) | Caution, pending states |
| Error | Red (#ef4444) | Errors, destructive actions |
| Info | Blue (#3b82f6) | Informational, neutral alerts |

**Rule:** Don't change semantic meanings. Green = good, Red = bad.

### Surface Colors

Define how backgrounds layer:

```css
/* Light mode */
--surface-background: #ffffff;      /* Page background */
--surface-foreground: #111827;      /* Text on background */
--surface-card: #ffffff;            /* Card background */
--surface-card-foreground: #111827; /* Text on card */
--surface-border: #e5e7eb;          /* Default borders */
--surface-muted: #f3f4f6;           /* Muted backgrounds */
--surface-muted-foreground: #6b7280;/* Text on muted */

/* Dark mode */
--surface-background: #030712;
--surface-foreground: #f9fafb;
--surface-card: #111827;
--surface-card-foreground: #f9fafb;
--surface-border: #1f2937;
--surface-muted: #1f2937;
--surface-muted-foreground: #9ca3af;
```

### Dark Mode Adjustments

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary accent | 500-600 | 400-500 (lighter) |
| Text primary | gray-900 | white |
| Text secondary | gray-600 | gray-400 |
| Backgrounds | white | gray-900/950 |
| Borders | gray-200 | gray-700/800 |

**Key:** Accents get lighter in dark mode to maintain visibility.

---

## 2. Spacing

### Common Scales

**4px base (tighter):**
```
1: 4px
2: 8px
3: 12px
4: 16px
5: 20px
6: 24px
8: 32px
10: 40px
12: 48px
16: 64px
20: 80px
24: 96px
```

**8px base (roomier):**
```
1: 8px
2: 16px
3: 24px
4: 32px
5: 40px
6: 48px
8: 64px
10: 80px
12: 96px
```

### Choosing a Scale

| Product Type | Recommended | Why |
|--------------|-------------|-----|
| Dashboard, dense UI | 4px base | More granular control |
| Marketing, editorial | 8px base | More breathing room |
| Mobile app | 4px base | Precise touch targets |
| E-commerce | 4px base | Balance density + clarity |

### Usage Guidelines

| Context | Token | Example |
|---------|-------|---------|
| Icon + text gap | spacing-1/2 | 4-8px |
| List item gap | spacing-3/4 | 12-16px |
| Card padding | spacing-4/5 | 16-20px |
| Section gap | spacing-6/8 | 24-32px |
| Page sections | spacing-12/16 | 48-64px |

---

## 3. Typography

### Font Selection

**Display font (headlines):**
- Distinctive, characterful
- Used sparingly (h1, h2, hero)
- Examples: Cabinet Grotesk, Clash Display, General Sans

**Body font (UI text):**
- Highly readable
- Works at small sizes
- Examples: Inter, SF Pro, Geist, Satoshi

**Mono font (code):**
- Fixed-width
- Examples: JetBrains Mono, Fira Code, SF Mono

### Font Size Scale

**Recommended scale:**
```
xs:   12px  → Small labels, captions
sm:   14px  → Secondary text, metadata
base: 16px  → Body text, UI default
lg:   18px  → Large body, emphasis
xl:   20px  → Small headings
2xl:  24px  → Section headings
3xl:  30px  → Page headings
4xl:  36px  → Hero headings
5xl:  48px  → Display text
6xl:  60px  → Large display
```

### Font Weight

```
normal:   400  → Body text
medium:   500  → Subtle emphasis
semibold: 600  → Buttons, labels
bold:     700  → Headings, strong emphasis
```

**Rule:** Most UIs need only 400, 500, 600. Add 700 only if needed.

### Line Height

```
tight:   1.2  → Headings, display text
snug:    1.375 → Large text
normal:  1.5  → Body text (default)
relaxed: 1.625 → Long-form content
loose:   2.0  → Very open (rarely used)
```

### Letter Spacing

```
tighter: -0.05em → Large display text
tight:   -0.025em → Headings
normal:  0 → Body text
wide:    0.025em → Small caps, labels
wider:   0.05em → All-caps text
widest:  0.1em → Very spaced (rarely used)
```

---

## 4. Border Radius

### Scale

```
none: 0px      → Sharp corners
sm:   4px      → Subtle rounding
md:   8px      → Standard (inputs, buttons)
lg:   12px     → Pronounced (cards)
xl:   16px     → Large components
2xl:  20px     → Feature cards
3xl:  24px     → Hero elements
full: 9999px   → Pills, avatars, circles
```

### Guidelines by Component

| Component | Suggested Radius |
|-----------|------------------|
| Buttons | md-lg (8-12px) |
| Inputs | Same as buttons |
| Cards | lg-xl (12-16px) |
| Modals | xl-2xl (16-20px) |
| Badges/Pills | full (9999px) |
| Avatars | full (circle) |
| Tooltips | md (8px) |

### Brand Personality

| Style | Radius Range | Vibe |
|-------|--------------|------|
| Corporate, serious | 0-4px | Professional, sharp |
| Balanced, modern | 8-12px | Clean, approachable |
| Friendly, soft | 16-24px | Warm, inviting |
| Playful | 20px+ or full | Fun, casual |

**Rule:** Stay consistent. If buttons are 12px, inputs should be 12px.

---

## 5. Shadows

### Scale

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);
--shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-none: none;
```

### Usage

| Component | Shadow |
|-----------|--------|
| Cards (resting) | sm-md |
| Cards (hover) | lg-xl |
| Dropdowns | md-lg |
| Modals | xl-2xl |
| Buttons | none or xs |
| Inputs (focus) | ring, not shadow |

### Colored Shadows

For brand emphasis:

```css
--shadow-primary: 0 4px 14px rgba(59, 130, 246, 0.4);
--shadow-success: 0 4px 14px rgba(16, 185, 129, 0.4);
--shadow-error: 0 4px 14px rgba(239, 68, 68, 0.4);
```

### Dark Mode Shadows

Shadows are less visible on dark backgrounds. Options:

1. **Reduce opacity** — shadows become very subtle
2. **Use borders instead** — more visible separation
3. **Use lighter shadows** — `rgba(255,255,255,0.1)`
4. **Use elevation via background** — lighter bg = higher elevation

---

## 6. Motion

### Duration Scale

```
--duration-instant: 0ms
--duration-fast: 100ms
--duration-normal: 200ms
--duration-slow: 300ms
--duration-slower: 500ms
```

### Usage

| Interaction | Duration |
|-------------|----------|
| Button hover | fast (100ms) |
| Input focus | normal (200ms) |
| Card hover | normal (200ms) |
| Modal open | slow (300ms) |
| Page transition | slower (500ms) |

### Easing

```
--ease-default: cubic-bezier(0.4, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

| Easing | Usage |
|--------|-------|
| ease-out | Entrances, hover states |
| ease-in | Exits, closing |
| ease-in-out | Toggles, transforms |
| ease-bounce | Playful interactions (use sparingly) |

---

## Token Checklist

Before finalizing, verify:

### Colors
- [ ] Primary scale (50-950)
- [ ] Secondary scale (if needed)
- [ ] Gray/neutral scale
- [ ] Semantic colors (success, warning, error, info)
- [ ] Surface colors (background, card, border, muted)
- [ ] Dark mode variants
- [ ] Contrast ratios checked (WCAG AA minimum)

### Spacing
- [ ] Scale defined (4px or 8px base)
- [ ] Usage guidelines documented
- [ ] Consistent across components

### Typography
- [ ] Font families selected
- [ ] Size scale defined
- [ ] Weights defined
- [ ] Line heights defined
- [ ] Web fonts available/licensed

### Radius
- [ ] Scale defined
- [ ] Component mapping documented
- [ ] Consistent with brand personality

### Shadows
- [ ] Scale defined
- [ ] Dark mode considered
- [ ] Colored shadows (if brand uses)

### Motion
- [ ] Durations defined
- [ ] Easings defined
- [ ] Performance considered

---

## Next Step

Once tokens are defined → Move to **components.md** to define component architecture.
