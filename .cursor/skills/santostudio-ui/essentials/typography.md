# Typography — Santos Studio

Font selection, hierarchy, fluid sizing, and loading strategies for distinctive interfaces.

## Philosophy

Typography is the backbone of visual hierarchy. A distinctive font paired with proper sizing creates more personality than any color scheme or effect.

---

## Font Selection

### Avoid Invisible Defaults

These fonts are everywhere — using them makes your design forgettable:

```
❌ AVOID: Inter, Roboto, Arial, Open Sans, Lato, Montserrat, system defaults
```

These are fine for documentation or internal tools where personality isn't the goal. But for products that need to stand out, look elsewhere.

### Better Alternatives

| Instead of | Try |
|------------|-----|
| Inter | Plus Jakarta Sans, Instrument Sans, Outfit |
| Roboto | Onest, Figtree, Urbanist |
| Open Sans | Source Sans 3, Nunito Sans, DM Sans |
| Montserrat | Outfit, Sora, General Sans |

For editorial/premium feel: Fraunces, Newsreader, Lora.

### Pairing Strategy

**The non-obvious truth:** You often don't need a second font. One well-chosen font family in multiple weights creates cleaner hierarchy than two competing typefaces.

When pairing, contrast on multiple axes:
- Serif + Sans (structure contrast)
- Geometric + Humanist (personality contrast)
- Condensed display + Wide body (proportion contrast)

**Never pair fonts that are similar but not identical** (e.g., two geometric sans-serifs). They create visual tension without clear hierarchy.

### Client Projects

Match the client's brand font. If they don't have one, propose something distinctive — not Inter.

---

## Type Scale

### The Scale

Use fewer sizes with more contrast. 5-6 sizes cover most needs:

| Role | Size | Weight | Line-height |
|------|------|--------|-------------|
| Small / labels | 12px | Regular or Medium | 1.4 |
| Body | 14px | Regular | 1.5 |
| Body emphasis | 16px | Medium | 1.5 |
| Small titles | 16px | SemiBold | 1.3 |
| Large titles | 24px | Bold | 1.2 |
| Hero (rare) | 30px | Bold | 1.1 |

**Rule:** 30px is the maximum for in-app titles. Only go larger for onboarding single-screens or marketing pages.

### Hierarchy Contrast

The common mistake: too many sizes too close together (14px, 15px, 16px, 18px). This creates muddy hierarchy.

**Minimum 3:1 ratio** between heading and body text. A 24px heading vs 14px body = clear. A 18px heading vs 16px body = mud.

**Weight contrast matters:** Pair 700 with 400, not 500 with 400. The difference between medium and regular is barely visible.

---

## Fluid Typography (Web Only)

Use `clamp()` for headings on marketing/content pages:

```css
h1 { font-size: clamp(1.5rem, 1rem + 2vw, 2.5rem); }
h2 { font-size: clamp(1.25rem, 0.8rem + 1.5vw, 2rem); }
```

**Use fluid type for:** Headings and display text on marketing pages where text needs to breathe across viewport sizes.

**Use FIXED `rem` scales for:** App UIs, dashboards, data-dense interfaces. No major design system (Material, Polaris, Primer) uses fluid type in product UI — fixed scales give the spatial predictability that container layouts need. Body text should also be fixed.

---

## Line-Height

| Context | Line-height |
|---------|-------------|
| Headings, hero | 1.1 - 1.2 |
| Body text | 1.5 |
| Long-form content | 1.625 |
| Light text on dark backgrounds | Add +0.05 to +0.1 (lighter perceived weight needs more air) |

---

## Line Length

**Ideal:** 45-75 characters for body text. Use `ch` units:

```css
.content { max-width: 65ch; }
```

Line-height scales inversely with line length — narrow columns need tighter leading, wide columns need more.

---

## Font Loading (Web)

Prevent layout shift (FOUT/FOIT):

```css
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  font-display: swap; /* Show text immediately, swap when font loads */
}
```

### Fallback Metrics Matching

Minimize layout shift by matching fallback font metrics:

```css
@font-face {
  font-family: 'CustomFont-Fallback';
  src: local('Arial');
  size-adjust: 105%;
  ascent-override: 90%;
  descent-override: 20%;
}

body { font-family: 'CustomFont', 'CustomFont-Fallback', sans-serif; }
```

Tools like [Fontaine](https://github.com/unjs/fontaine) calculate these overrides automatically.

---

## OpenType Features

Polish details most developers miss:

```css
/* Tabular numbers for data alignment */
.data-table { font-variant-numeric: tabular-nums; }

/* Proper fractions */
.recipe-amount { font-variant-numeric: diagonal-fractions; }

/* Small caps for abbreviations */
abbr { font-variant-caps: all-small-caps; }

/* Disable ligatures in code */
code { font-variant-ligatures: none; }
```

Check what features your font supports at [Wakamai Fondue](https://wakamaifondue.com/).

---

## Casing Rules

- ✅ UPPERCASE for short labels only: TOTAL VIEWS, EMAIL, STATUS
- ✅ Sentence case everywhere else
- ❌ NEVER all-caps on sentences, titles, or paragraphs (reads as shouting)
- Add `letter-spacing: 0.05em` to uppercase text for readability

---

## Accessibility

- **Never disable zoom** (`user-scalable=no` breaks accessibility)
- **Use `rem`/`em` for font sizes** — respects user browser settings. Never `px` for body text.
- **Minimum 16px body text** — smaller strains eyes and fails WCAG on mobile
- **16px input font size** — prevents iOS auto-zoom on focus
- **Adequate touch targets** — text links need padding or line-height that creates 44px+ tap targets

---

## Tailwind Reference

```
text-xs:   12px
text-sm:   14px
text-base: 16px
text-lg:   18px (use sparingly)
text-xl:   20px (use sparingly)
text-2xl:  24px (titles)
text-3xl:  30px (hero only)
```

Weight classes: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700).
