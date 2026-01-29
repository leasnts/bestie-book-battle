# Color Philosophy - santostudio ui

Color guidelines that avoid AI tool clichés and create distinctive interfaces.

## Philosophy

Santos Studio color choices prioritize **boldness and differentiation**:
- **No purple as primary** (overused AI tool cliché)
- **No red as primary** (reserved for errors and destructive actions)
- **Prefer saturated, vibrant colors** over soft pastels
- **Use color to create personality**, not just decoration

**Core belief:** Color is a differentiator. Safe color choices lead to forgettable products.

---

## Forbidden Colors (Primary Use)

### ❌ Purple

**Why:** Every AI tool uses purple gradients. It's the "AI color" and looks generic.

**Examples of overuse:**
- Purple gradients on white backgrounds
- Soft lavender accent colors
- Purple-blue "tech" palettes

**Exception:** Only acceptable if it's part of the client's existing brand identity.

### ❌ Red

**Why:** Red signals danger, errors, and destructive actions in UI conventions.

**Allowed uses for red:**
- Error messages
- Destructive buttons ("Delete", "Remove")
- Alert states
- Negative data (losses, decreases)

**Never use red for:**
- Primary buttons
- Brand color
- Positive actions
- Navigation elements

---

## Gradient Rules

### ✅ Acceptable Gradients

**ONLY mono-palette gradients** (same color, different shades):

```css
/* ✅ GOOD: Same color family */
background: linear-gradient(to right, #3b82f6, #1e40af); /* blue-500 to blue-800 */
background: linear-gradient(to bottom, #a855f7, #6b21a8); /* purple-500 to purple-800 */
background: linear-gradient(135deg, #10b981, #047857); /* green-500 to green-700 */
```

### ❌ Forbidden Gradients

**NEVER mix different colors in gradients:**

```css
/* ❌ BAD: Two different colors */
background: linear-gradient(to right, #3b82f6, #a855f7); /* blue to purple */
background: linear-gradient(to right, #ec4899, #f97316); /* pink to orange */
background: linear-gradient(to right, #3b82f6, #10b981); /* blue to green */
```

**Why:** Looks like every generic AI tool. Lacks sophistication.

**Exception:** Your preferred color combos (pink+orange, pink+red, blue+green) should be used **separately** in the UI, NOT blended in gradients.

**Example of correct usage:**
- Primary button: Pink (#ec4899)
- Secondary elements: Orange (#f97316)
- They coexist in the interface but DON'T gradient together

## Preferred Color Combinations

### ✅ Pink + Orange

**Vibe:** Warm, energetic, friendly

**Use cases:**
- Consumer apps
- Creative tools
- Social platforms
- Lifestyle products

**Example palette:**
```
Primary:   Pink (#EC4899 or similar)
Secondary: Orange (#F97316)
Accent:    Coral (#FB7185)
```

### ✅ Pink + Red

**Vibe:** Bold, passionate, attention-grabbing

**Use cases:**
- Fashion/beauty
- Entertainment
- Bold brands
- High-energy products

**Note:** Red here is part of palette, not the sole primary.

**Example palette:**
```
Primary:   Hot Pink (#FF1493)
Secondary: Red (#EF4444)
Accent:    Deep Pink (#DB2777)
```

### ✅ Blue + Green

**Vibe:** Fresh, tech-forward, trustworthy

**Use cases:**
- Fintech
- Health/wellness
- Productivity tools
- Environmental products

**Example palette:**
```
Primary:   Cyan Blue (#0EA5E9)
Secondary: Emerald Green (#10B981)
Accent:    Teal (#14B8A6)
```

### ✅ Monochrome (Black + White)

**Vibe:** Elegant, sophisticated, timeless

**Use cases:**
- Luxury brands
- Minimalist products
- Professional services
- High-end e-commerce

**Example palette:**
```
Primary:   Pure Black (#000000)
Secondary: White (#FFFFFF)
Grays:     #1F1F1F, #3F3F3F, #7F7F7F, #BFBFBF, #F5F5F5
```

**Key:** High contrast, bold typography, excellent spacing.

---

## Color Scale System

Use Tailwind-inspired scale (25 to 950) for any color:

### Scale Structure

| Level | Lightness | Use Case |
|-------|-----------|----------|
| **25** | Very light tint | Subtle backgrounds |
| **50** | Light tint | Hover states (light mode) |
| **100** | Lighter | Backgrounds, light accents |
| **200** | Light | Borders, dividers |
| **300** | Medium-light | Disabled states |
| **400** | Medium | Placeholder text |
| **500** | **Base color** | **Primary use** |
| **600** | Medium-dark | Hover states (base) |
| **700** | Dark | Active states |
| **800** | Darker | Text on light backgrounds |
| **900** | Very dark | High contrast text |
| **950** | Almost black | Maximum contrast |

**Example (Blue palette):**
```
blue-50:  #eff6ff
blue-100: #dbeafe
blue-200: #bfdbfe
blue-300: #93c5fd
blue-400: #60a5fa
blue-500: #3b82f6  ← Base color
blue-600: #2563eb
blue-700: #1d4ed8
blue-800: #1e40af
blue-900: #1e3a8a
blue-950: #172554
```

---

## Color Roles

### Primary Color

**Purpose:** Main brand color, most important actions

**Usage:**
- Primary buttons
- Links
- Active states
- Key UI elements

**Must NOT be:** Purple or Red

**Should be:** Distinctive, saturated, memorable

### Secondary Color

**Purpose:** Supporting color, alternative actions

**Usage:**
- Secondary buttons (if not using gray)
- Accent elements
- Icons
- Badges

**Works well:** Complementary or analogous to primary

### Gray Palette

**Purpose:** Neutral UI structure

**Required shades:**
```
gray-50:  Lightest backgrounds
gray-100: Light backgrounds
gray-200: Borders (light mode)
gray-300: Dividers
gray-400: Placeholder text
gray-500: Mid-tone (rarely used)
gray-600: Secondary text
gray-700: Borders (dark mode)
gray-800: Dark backgrounds
gray-900: Text (light mode), backgrounds (dark mode)
```

**Santos Studio uses:**
- Pure blacks (#000) and whites (#FFF) for maximum contrast
- Minimal use of mid-tone grays
- Sharp transitions, not gradual

---

## Semantic Colors

### Success (Green)

**Use for:**
- Success messages
- Positive data (gains, increases)
- Confirmations
- Completed states

**Suggested:**
```
green-500: #10b981 (Emerald)
green-600: #059669 (darker for text)
```

### Error/Danger (Red)

**Use for:**
- Error messages
- Destructive actions ("Delete")
- Validation errors
- Negative data (losses, decreases)

**Suggested:**
```
red-500: #ef4444
red-600: #dc2626 (darker for text)
```

### Warning (Orange/Yellow)

**Use for:**
- Warnings
- Caution states
- Pending actions
- Info alerts

**Suggested:**
```
orange-500: #f97316
yellow-500: #eab308
```

### Info (Blue)

**Use for:**
- Informational messages
- Tips
- Neutral alerts

**Suggested:**
```
blue-500: #3b82f6
cyan-500: #06b6d4
```

---

## Dark Mode Considerations

### Background Colors

**Light mode:**
```
Page background: White (#FFFFFF) or very light gray (#F9FAFB)
Card background: White (#FFFFFF)
```

**Dark mode:**
```
Page background: Pure black (#000000) or deep navy (#0A1E3B)
Card background: Gray-800 (#1F2937) or Gray-900 (#111827)
```

**Santos Studio prefers:**
- Pure black (#000) for maximum contrast
- Or colored dark backgrounds (navy, deep blue) for personality

### Text Colors

**Light mode:**
```
Primary text:   Gray-900 (#111827)
Secondary text: Gray-600 (#4B5563)
Disabled text:  Gray-400 (#9CA3AF)
```

**Dark mode:**
```
Primary text:   White (#FFFFFF)
Secondary text: Gray-400 (#9CA3AF) — NOT Gray-500+ (too dim)
Disabled text:  Gray-600 (#4B5563)
```

**Key:** In dark mode, never use gray-500 or darker for text (too low contrast).

### Accent Colors

**Rule:** Accent colors should be **more saturated** in dark mode.

**Why:** Dark backgrounds absorb color, so accents need extra vibrance to stand out.

**Example:**
```
Light mode primary: blue-500 (#3b82f6)
Dark mode primary:  blue-400 (#60a5fa) — lighter, more saturated
```

---

## Glassmorphism Colors

For glassmorphism cards, use semi-transparent backgrounds:

**On light backgrounds:**
```css
background: rgba(255, 255, 255, 0.1);
```

**On dark backgrounds:**
```css
background: rgba(0, 0, 0, 0.3);
/* OR */
background: rgba(255, 255, 255, 0.05);
```

**Border (gradient):**
```css
border-image: linear-gradient(
  to bottom,
  rgba(255, 255, 255, 0.2),
  rgba(255, 255, 255, 0.1)
) 1;
```

This creates Santos Studio's signature gradient border (20% → 10% opacity).

---

## Best Practices

### Do's ✅
- Use **saturated, vibrant colors** (not washed-out pastels)
- Choose **distinctive primary colors** (avoid purple)
- Use **pure blacks and whites** for maximum contrast (especially dark mode)
- Use **semantic colors correctly** (green = success, red = error)
- Test colors in both light and dark mode
- Ensure **WCAG AA contrast** (4.5:1 for text, 3:1 for UI elements)

### Don'ts ❌
- Never purple as primary (AI cliché)
- Never red as primary (error color)
- Don't use soft pastels (looks generic)
- Don't use mid-tone grays excessively
- Don't forget dark mode color adjustments
- Don't use colors without checking contrast ratios

---

## Color Accessibility

### Contrast Ratios (WCAG AA)

**Text:**
- Normal text (< 18px): **4.5:1** minimum
- Large text (≥ 18px bold or ≥ 24px): **3:1** minimum

**UI Elements:**
- Buttons, borders, icons: **3:1** minimum

**Tools to check:**
- WebAIM Contrast Checker
- Adobe Color Accessibility Tools
- Browser DevTools contrast checker

### Color Blindness

**Don't rely on color alone** to convey information:
- ✅ Use icons + color for states
- ✅ Use labels + color for data
- ✅ Use patterns + color for charts

**Example:**
```jsx
{/* Good: Icon + color */}
<div className="flex items-center gap-2 text-green-600">
  <CheckIcon />
  <span>Success</span>
</div>

{/* Bad: Color only */}
<div className="text-green-600">
  <span>Success</span>
</div>
```

---

## Implementation Examples

### Setting Up Color System (CSS Variables)

```css
:root {
  /* Primary */
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  
  /* Secondary */
  --color-secondary-500: #10b981;
  --color-secondary-600: #059669;
  
  /* Grays */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  
  /* Semantic */
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f97316;
  --color-info: #3b82f6;
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary-500: #60a5fa; /* Lighter in dark mode */
    --color-secondary-500: #34d399;
  }
}
```

### Using Colors in Components

```jsx
<button className="
  bg-blue-500 hover:bg-blue-600 active:bg-blue-700
  text-white
  dark:bg-blue-400 dark:hover:bg-blue-500
">
  Primary Button
</button>

<p className="
  text-gray-900 dark:text-white
">
  Primary text
</p>

<p className="
  text-gray-600 dark:text-gray-400
">
  Secondary text
</p>
```

---

## Inspiration from References

**Opal:** Cyan + Coral + Gold, pure black backgrounds, high contrast

**Revolut:** Blue + Purple gradients, colored backgrounds, glassmorphism

**Airbnb:** Pink primary (#FF385C), professional gray palette

**Shopify:** Bold magenta, unexpected color pops, high saturation

**Santos Studio combines:**
- Opal's high contrast and bold accents
- Revolut's colored backgrounds and glassmorphism
- Airbnb's professionalism
- Shopify's boldness

**Result:** Distinctive, modern, memorable.
