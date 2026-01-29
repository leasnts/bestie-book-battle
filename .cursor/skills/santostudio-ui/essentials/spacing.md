# Spacing System - santostudio ui

Consistent spacing scale for professional, breathable interfaces.

## Philosophy

Santos Studio uses a **consistent spacing scale** to create:
- **Visual rhythm** across all components
- **Breathing room** that prevents cluttered interfaces
- **Predictable patterns** that speed up development

**Core principle:** Never use arbitrary values. Always use the scale.

---

## Spacing Scale

### Base System (Core)

Use these for 95% of cases:

| Token | Value | Use Case |
|-------|-------|----------|
| `spacing-1` | **6px** | Icon ↔ text, title ↔ subtitle, tight gaps |
| `spacing-2` | **8px** | Title ↔ icon, small horizontal gaps |
| `spacing-3` | **12px** | Horizontal blocks, card grid gaps |
| `spacing-4` | **16px** | Card padding, list items, standard spacing |
| `spacing-5` | **20px** | Large card padding, input padding (horizontal) |
| `spacing-6` | **24px** | Section separations, header ↔ content |
| `spacing-8` | **32px** | Large section gaps, onboarding spacing |

### Extended System (Large Layouts)

Use for hero sections, massive breathing space:

| Token | Value | Use Case |
|-------|-------|----------|
| `spacing-10` | **40px** | Hero section internal spacing |
| `spacing-12` | **48px** | Large hero gaps |
| `spacing-16` | **64px** | Massive section separations |

**Rule:** Never go below `spacing-1` (6px). Never use values outside this scale.

---

## Usage Guidelines by Context

### Icon + Text Pairings

**Within same element** (e.g., button icon + label):
```
spacing-1 (6px)
```

Example:
```jsx
<button className="flex items-center gap-1.5">
  <IconComponent />
  <span>Button Text</span>
</button>
```

### Title + Subtitle

**Hierarchical text pairings:**
```
spacing-1 or spacing-2 (6-8px)
```

Example:
```jsx
<div>
  <h2 className="text-2xl font-bold">Main Title</h2>
  <p className="mt-2 text-sm text-gray-600">Subtitle or description</p>
</div>
```

### Horizontal Element Groups

**Cards in a row, filter chips, button groups:**
```
spacing-3 (12px)
```

Example:
```jsx
<div className="flex gap-3">
  <Card />
  <Card />
  <Card />
</div>
```

### Card Internal Padding

**Standard cards:**
```
spacing-4 or spacing-5 (16-20px)
```

Use 16px for compact cards, 20px for spacious ones.

Example:
```jsx
<div className="p-5 bg-white rounded-2xl">
  {/* Card content */}
</div>
```

**Glassmorphism cards (premium):**
```
spacing-5 or spacing-6 (20-24px)
```

More padding for breathing room on transparent backgrounds.

### List Items

**Between list items:**
```
spacing-4 (16px)
```

Example:
```jsx
<ul className="space-y-4">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

### Section Separations

**Between major sections:**
```
spacing-6 (24px)
```

Example:
```jsx
<div>
  <section className="mb-6">{/* Section 1 */}</section>
  <section className="mb-6">{/* Section 2 */}</section>
</div>
```

### Header ↔ Content

**After page header, before main content:**
```
spacing-6 or spacing-8 (24-32px)
```

Use 32px for onboarding or landing pages (more dramatic).

Example:
```jsx
<div>
  <header className="mb-8">
    <h1>Page Title</h1>
  </header>
  <main>{/* Content */}</main>
</div>
```

### Onboarding Screens

**Title/subtitle → action buttons:**
```
spacing-8 (32px)
```

Creates clear separation between information and actions.

Example:
```jsx
<div>
  <div>
    <h1 className="text-3xl font-bold">Welcome</h1>
    <p className="mt-2 text-gray-600">Get started in seconds</p>
  </div>
  
  <div className="mt-8">
    <button className="btn-primary w-full">Continue</button>
  </div>
</div>
```

### Form Fields

**Between form fields:**
```
spacing-4 (16px)
```

Example:
```jsx
<form className="space-y-4">
  <Input label="Name" />
  <Input label="Email" />
  <Input label="Password" />
</form>
```

**Label → Input:**
```
spacing-2 (8px)
```

Example:
```jsx
<div>
  <label className="block mb-2">Email</label>
  <input type="email" />
</div>
```

---

## Grid Spacing

### Card Grids

**Mobile (2 columns):**
```
gap-3 (12px)
```

**Desktop (3+ columns):**
```
gap-4 (16px)
```

Example:
```jsx
<div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

---

## Component-Specific Spacing

### Buttons

**Internal padding:**
- Horizontal: `spacing-4` (16px)
- Vertical: `spacing-3` (12px)

**Between buttons in group:**
```
spacing-3 (12px)
```

### Cards

**Internal padding:**
- Standard: `spacing-4 or spacing-5` (16-20px)
- Glassmorphism: `spacing-5 or spacing-6` (20-24px)

**Between cards in grid:**
```
spacing-3 (12px)
```

### Inputs

**Internal padding:**
- Horizontal: `spacing-5` (20px)
- Vertical: `spacing-4` (16px)

**Label → Input:**
```
spacing-2 (8px)
```

**Error message below:**
```
spacing-2 (8px)
```

### Modals

**Internal padding:**
- Header/Content/Footer: `spacing-8` (32px)

**Between sections:**
```
spacing-6 (24px)
```

---

## Tailwind Classes Reference

For quick use in Tailwind projects:

| Santos Token | Tailwind Class | Value |
|--------------|----------------|-------|
| `spacing-1` | `gap-1.5` / `p-1.5` / `m-1.5` | 6px |
| `spacing-2` | `gap-2` / `p-2` / `m-2` | 8px |
| `spacing-3` | `gap-3` / `p-3` / `m-3` | 12px |
| `spacing-4` | `gap-4` / `p-4` / `m-4` | 16px |
| `spacing-5` | `gap-5` / `p-5` / `m-5` | 20px |
| `spacing-6` | `gap-6` / `p-6` / `m-6` | 24px |
| `spacing-8` | `gap-8` / `p-8` / `m-8` | 32px |
| `spacing-10` | `gap-10` / `p-10` / `m-10` | 40px |
| `spacing-12` | `gap-12` / `p-12` / `m-12` | 48px |
| `spacing-16` | `gap-16` / `p-16` / `m-16` | 64px |

---

## CSS Custom Properties

For vanilla CSS or other frameworks:

```css
:root {
  --spacing-1: 6px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;
}

/* Usage */
.card {
  padding: var(--spacing-5);
  margin-bottom: var(--spacing-4);
}

.button-group {
  gap: var(--spacing-3);
}
```

---

## Common Patterns

### Card with Content

```jsx
<div className="p-5 bg-white rounded-2xl">
  <h3 className="text-xl font-bold mb-2">Title</h3>
  <p className="text-gray-600 mb-4">Description text</p>
  <button className="btn-primary">Action</button>
</div>
```

Spacing breakdown:
- Padding: 20px (spacing-5)
- Title → Description: 8px (spacing-2)
- Description → Button: 16px (spacing-4)

### Form Layout

```jsx
<form className="space-y-4">
  <div>
    <label className="block mb-2">Name</label>
    <input className="px-5 py-4" />
  </div>
  
  <div>
    <label className="block mb-2">Email</label>
    <input className="px-5 py-4" />
    <p className="mt-2 text-sm text-red-600">Error message</p>
  </div>
  
  <button className="btn-primary mt-6">Submit</button>
</form>
```

Spacing breakdown:
- Between fields: 16px (spacing-4)
- Label → Input: 8px (spacing-2)
- Input → Error: 8px (spacing-2)
- Form → Button: 24px (spacing-6)

### Page Layout

```jsx
<div className="p-6">
  <header className="mb-8">
    <h1 className="text-3xl font-bold">Page Title</h1>
    <p className="mt-2 text-gray-600">Description</p>
  </header>
  
  <section className="mb-6">
    <h2 className="text-xl font-bold mb-4">Section 1</h2>
    {/* Content */}
  </section>
  
  <section>
    <h2 className="text-xl font-bold mb-4">Section 2</h2>
    {/* Content */}
  </section>
</div>
```

Spacing breakdown:
- Page padding: 24px (spacing-6)
- Header → Content: 32px (spacing-8)
- Title → Subtitle: 8px (spacing-2)
- Section title → Content: 16px (spacing-4)
- Between sections: 24px (spacing-6)

---

## Best Practices

### Do's ✅
- Always use the spacing scale (6, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- Use consistent spacing throughout the interface
- Give elements breathing room (don't fear whitespace)
- Use 24-32px for section separations
- Use 12px for horizontal card gaps
- Use 16-20px for card internal padding

### Don'ts ❌
- Never use values below 6px
- Never use arbitrary values (e.g., 13px, 17px, 22px)
- Don't crowd elements together (minimum 12px between blocks)
- Don't use different spacing for similar contexts
- Don't skip spacing tokens (use the scale)

---

## When to Break the System

**Rarely, but acceptable cases:**
- Fine-tuning optical alignment (1-2px adjustments)
- Matching specific brand guidelines that conflict
- Technical constraints (e.g., pixel-perfect icon alignment)

**Rule:** If you break the system, document why and keep it minimal.

---

## Quick Decision Tree

**Question: What spacing should I use?**

1. **Same element (icon + text)** → 6px
2. **Title + subtitle** → 6-8px
3. **Horizontal blocks** → 12px
4. **List items** → 16px
5. **Card padding** → 16-20px
6. **Section separations** → 24px
7. **Major sections** → 32px
8. **Hero spacing** → 40-64px

**Still unsure?** Use 16px (spacing-4) — it works 70% of the time.
