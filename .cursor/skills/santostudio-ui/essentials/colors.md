# Color System — Santos Studio

Color guidelines that create distinctive, memorable interfaces and avoid AI clichés.

## Philosophy

- **Bold, saturated colors** over soft pastels
- **Distinctive choices** that avoid the AI color palette
- **Tinted neutrals** — pure gray is dead, add a hint of your brand hue
- **OKLCH color space** for perceptually uniform palettes
- **Semantic tokens** — never raw hex in components

---

## Forbidden Colors (Primary Use)

### ❌ Purple as Primary

Every AI tool uses purple gradients. It's the "AI color" — generic and forgettable.

**Exception:** Only if part of the client's existing brand identity.

### ❌ Red as Primary

Red signals danger, errors, and destructive actions. Using it as primary confuses the semantic meaning.

**Allowed:** Error messages, destructive buttons, alert states, negative data.

### ❌ The "AI Color Palette"

These combinations scream "AI-generated":
- Cyan-on-dark backgrounds
- Purple-to-blue gradients
- Neon accents on dark mode
- Gradient text on metrics or headings

---

## Modern Color System: OKLCH

**Stop using HSL.** Use OKLCH — it's perceptually uniform. Equal steps in lightness actually LOOK equal (unlike HSL where 50% yellow looks bright while 50% blue looks dark).

```css
/* OKLCH: lightness (0-100%), chroma (0-0.4+), hue (0-360) */
--color-primary: oklch(60% 0.15 250);      /* Blue */
--color-primary-light: oklch(85% 0.08 250); /* Same hue, lighter */
--color-primary-dark: oklch(35% 0.12 250);  /* Same hue, darker */
```

**Key insight:** As you move toward white or black, REDUCE chroma. High chroma at extreme lightness looks garish.

### Building a Palette with OKLCH

```css
:root {
  /* Primary — pick hue, then vary lightness + chroma */
  --primary-50:  oklch(95% 0.03 250);
  --primary-100: oklch(90% 0.06 250);
  --primary-200: oklch(80% 0.09 250);
  --primary-300: oklch(70% 0.12 250);
  --primary-400: oklch(60% 0.14 250);
  --primary-500: oklch(55% 0.15 250);  /* Base */
  --primary-600: oklch(48% 0.14 250);
  --primary-700: oklch(40% 0.12 250);
  --primary-800: oklch(32% 0.10 250);
  --primary-900: oklch(25% 0.08 250);
}
```

Modern CSS functions: `color-mix()`, `light-dark()` are also powerful tools for maintainable palettes.

---

## Tinted Neutrals (CRITICAL)

**Pure gray doesn't exist in nature.** Add a subtle hint of your brand hue to ALL neutrals:

```css
/* ❌ Dead grays — no personality */
--gray-100: oklch(95% 0 0);
--gray-900: oklch(15% 0 0);

/* ✅ Warm-tinted (brand warmth) */
--gray-100: oklch(95% 0.01 60);
--gray-900: oklch(15% 0.01 60);

/* ✅ Cool-tinted (tech, professional) */
--gray-100: oklch(95% 0.01 250);
--gray-900: oklch(15% 0.01 250);
```

The chroma is tiny (0.01) but perceptible. It creates subconscious cohesion between brand color and UI.

**Also applies to dark mode:** Never use pure black `#000000`. Use a tinted near-black instead.

---

## Gradient Rules

### ✅ Mono-palette Gradients ONLY

```css
/* ✅ Same color family */
background: linear-gradient(to right, oklch(55% 0.15 250), oklch(35% 0.12 250));
/* Or in hex: blue-500 → blue-800 */
```

### ❌ Never Multi-Color Gradients

```css
/* ❌ Two different colors */
background: linear-gradient(to right, #3b82f6, #a855f7); /* blue → purple */
background: linear-gradient(to right, #ec4899, #f97316); /* pink → orange */
```

**Your preferred color combos (pink+orange, blue+green) should be used SEPARATELY in the UI, not blended as gradients.**

---

## Preferred Color Combinations

### ✅ Pink + Orange
**Vibe:** Warm, energetic, friendly
**For:** Consumer apps, creative tools, social, lifestyle

### ✅ Pink + Red
**Vibe:** Bold, passionate, attention-grabbing
**For:** Fashion, entertainment, high-energy products

### ✅ Blue + Green
**Vibe:** Fresh, tech-forward, trustworthy
**For:** Fintech, health/wellness, productivity

### ✅ Monochrome (Near-Black + Near-White)
**Vibe:** Elegant, sophisticated, timeless
**For:** Luxury brands, minimalist products, professional services
**Key:** Use tinted near-black and near-white, not pure #000/#fff.

---

## Color Roles & Semantic Tokens

**Always use semantic tokens in components — never raw hex values.**

```css
:root {
  /* Semantic tokens (what they mean) */
  --color-primary: var(--blue-500);
  --color-primary-hover: var(--blue-600);
  --color-secondary: var(--green-500);
  --color-error: var(--red-500);
  --color-success: var(--green-500);
  --color-warning: var(--orange-500);

  /* Surface tokens */
  --color-bg: var(--gray-50);
  --color-surface: var(--white);
  --color-text-primary: var(--gray-900);
  --color-text-secondary: var(--gray-600);
  --color-border: var(--gray-200);
}
```

Components reference the semantic layer. When you switch themes or brands, only redefine the semantic tokens — primitives stay the same.

---

## The 60-30-10 Rule

This is about **visual weight**, not pixel count:

- **60%**: Neutral backgrounds, whitespace, base surfaces
- **30%**: Secondary colors — text, borders, inactive states
- **10%**: Accent — CTAs, highlights, focus states

The common mistake: using the accent color everywhere because it's "the brand color." Accent colors work BECAUSE they're rare. Overuse kills their power.

---

## Dangerous Color Combinations

These commonly fail contrast or cause readability issues:

- **Gray text on colored backgrounds** — gray looks washed out and dead on color. Use a darker shade of the background color, or use transparency of the text color instead.
- Light gray text on white (the #1 accessibility fail)
- Red text on green (8% of men can't distinguish)
- Blue text on red (vibrates visually)
- Yellow text on white (almost always fails)

---

## Alpha Transparency: A Design Smell

Heavy use of `rgba()` / `hsla()` usually means an incomplete palette:
- Alpha creates unpredictable contrast depending on what's behind it
- Performance overhead with layered transparency
- Inconsistent appearance across different backgrounds

**Better:** Define explicit colors for each context. Exception: focus rings, overlay backdrops, and glassmorphism where see-through is the point.

---

## Dark Mode

### Dark Mode Is NOT Inverted Light Mode

| Light Mode | Dark Mode |
|------------|-----------|
| Shadows for depth | Lighter surfaces for depth (no shadows) |
| Dark text on light | Light text on dark (reduce font weight slightly) |
| Vibrant accents | Desaturate accents slightly |
| White backgrounds | Tinted near-black (never pure #000) |

```css
:root[data-theme="dark"] {
  --color-surface-1: oklch(15% 0.01 250);
  --color-surface-2: oklch(20% 0.01 250); /* "Higher" = lighter */
  --color-surface-3: oklch(25% 0.01 250);
}
```

### Accent Colors in Dark Mode

Accent colors need to be **lighter and slightly more saturated** in dark mode — dark backgrounds absorb color.

```css
/* Light mode */
--color-primary: oklch(55% 0.15 250);
/* Dark mode — lighter, still saturated */
--color-primary: oklch(65% 0.16 250);
```

### Text on Dark

- Primary text: near-white (gray-50)
- Secondary text: gray-400 (NOT gray-500+ which is too dim)
- Increase line-height by 0.05-0.1 for light text on dark backgrounds

---

## Glassmorphism Colors

**On colored backgrounds:**
```css
background: rgba(255, 255, 255, 0.1);
```

**On dark backgrounds:**
```css
background: rgba(255, 255, 255, 0.05);
```

**Santos Studio signature gradient border:**
```css
border-image: linear-gradient(
  to bottom,
  rgba(255, 255, 255, 0.2),  /* 20% top */
  rgba(255, 255, 255, 0.1)   /* 10% bottom */
) 1;
```

---

## Accessibility

### Contrast Ratios (WCAG AA)

| Content | Minimum Ratio |
|---------|---------------|
| Normal text (<18px) | 4.5:1 |
| Large text (≥18px bold or ≥24px) | 3:1 |
| UI elements (buttons, borders, icons) | 3:1 |
| Placeholder text | 4.5:1 (often fails!) |

### Don't Rely on Color Alone

Always add a second signal — icon, text, pattern:

```jsx
// ✅ Icon + color
<div className="flex items-center gap-2 text-green-600">
  <CheckIcon /> <span>Success</span>
</div>

// ❌ Color only
<div className="text-green-600">Success</div>
```

### Tools

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Browser DevTools → Rendering → Emulate vision deficiencies
- Test with 8% of male users who are colorblind
