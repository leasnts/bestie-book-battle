# Responsive Design

Mobile-first approach for interfaces that work on every device.

## Core Principle

**Design for constraints first, then expand.** Mobile-first forces you to prioritize what truly matters.

## Mobile-First Methodology

### Why Mobile-First?

1. **Forces prioritization** — Limited space = only essential content
2. **Performance** — Mobile users often have slower connections
3. **Progressive enhancement** — Add complexity as screen grows
4. **Majority usage** — Most traffic is mobile (60%+ for many products)

### The Process

```
1. Design for 375px (smallest common mobile)
2. Ensure everything works and looks good
3. Add tablet layout (768px)
4. Add desktop enhancements (1024px+)
```

**NOT:** Design beautiful desktop → squeeze into mobile

---

## Breakpoints

### Santos Studio Standard Breakpoints

```css
/* Mobile first - no media query needed for mobile */
/* Base styles = mobile (375px+) */

/* Tablet */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large desktop */
@media (min-width: 1440px) { }
```

### Tailwind Equivalents

```
sm:  640px   (large phones, small tablets)
md:  768px   (tablets)
lg:  1024px  (small laptops)
xl:  1280px  (desktops)
2xl: 1536px  (large monitors)
```

### Common Device Widths

| Device | Width |
|--------|-------|
| iPhone SE | 375px |
| iPhone 14 | 390px |
| iPhone 14 Pro Max | 428px |
| iPad Mini | 768px |
| iPad Pro 11" | 834px |
| iPad Pro 12.9" | 1024px |
| Laptop | 1280-1440px |
| Desktop | 1920px+ |

---

## Touch Targets

### Minimum Sizes

| Platform | Minimum | Recommended |
|----------|---------|-------------|
| iOS | 44x44px | 48x48px |
| Web (mobile) | 44x44px | 48x48px |

### Spacing Between Targets

Minimum **8px** between clickable elements to prevent mis-taps.

```css
/* ❌ Bad: buttons too close */
.button-group button {
  margin: 2px;
}

/* ✅ Good: comfortable spacing */
.button-group button {
  margin: 8px;
}
```

### Making Small Elements Tappable

```css
/* Icon appears 24px but tap target is 44px */
.icon-button {
  width: 24px;
  height: 24px;
  padding: 10px; /* (44 - 24) / 2 = 10px padding */
  margin: -10px; /* Negative margin keeps visual size */
}
```

---

## Thumb Zones

### The Thumb Zone Map

On mobile, users hold phones in three ways:
1. **One-handed** (most common) — Thumb reaches ~60% of screen
2. **Cradled** — One hand holds, other taps
3. **Two-handed** — Both thumbs active

### Reachability Zones

```
┌─────────────────────┐
│   HARD TO REACH     │ ← Top corners
├─────────────────────┤
│                     │
│   OK TO REACH       │ ← Middle area
│                     │
├─────────────────────┤
│   EASY TO REACH     │ ← Bottom third
│   (Primary actions) │
└─────────────────────┘
```

### Design Implications

- **Primary CTAs** → Bottom of screen
- **Navigation** → Bottom tab bar (not hamburger at top)
- **Destructive actions** → Top (harder to accidentally tap)
- **Frequently used actions** → Easy reach zone

---

## Layout Patterns

### Mobile Layouts

**Single Column**
```
┌─────────────┐
│   Header    │
├─────────────┤
│   Content   │
│   Block 1   │
├─────────────┤
│   Content   │
│   Block 2   │
├─────────────┤
│   Content   │
│   Block 3   │
└─────────────┘
```

**Card Grid (2 columns max on mobile)**
```
┌──────┬──────┐
│ Card │ Card │
├──────┼──────┤
│ Card │ Card │
└──────┴──────┘
```

### Tablet Layouts

**2-Column Split**
```
┌─────────────────────┐
│       Header        │
├──────────┬──────────┤
│          │          │
│   Main   │ Sidebar  │
│          │          │
└──────────┴──────────┘
```

**Card Grid (3 columns)**
```
┌───────┬───────┬───────┐
│ Card  │ Card  │ Card  │
├───────┼───────┼───────┤
│ Card  │ Card  │ Card  │
└───────┴───────┴───────┘
```

### Desktop Layouts

**3-Column**
```
┌────────────────────────────┐
│          Header            │
├───────┬────────────┬───────┤
│       │            │       │
│ Side  │    Main    │ Side  │
│       │            │       │
└───────┴────────────┴───────┘
```

**Wide Content + Sidebar**
```
┌────────────────────────────┐
│          Header            │
├────────────────────┬───────┤
│                    │       │
│       Main         │ Side  │
│     (wide)         │       │
└────────────────────┴───────┘
```

---

## Navigation Patterns

### Mobile Navigation

**Bottom Tab Bar (Recommended for apps)**
```
┌─────────────────────┐
│                     │
│      Content        │
│                     │
├─────────────────────┤
│ 🏠  🔍  ➕  👤  ⚙️  │
└─────────────────────┘
```
- Max 5 items
- Always visible
- Current state highlighted

**Hamburger Menu (For web/less frequent actions)**
```
┌─────────────────────┐
│ ☰  Logo      🔔 👤 │
├─────────────────────┤
│                     │
│      Content        │
│                     │
└─────────────────────┘
```
- Hides navigation
- Use only when nav items are secondary
- **Never hide primary actions in hamburger**

### Tablet Navigation

**Top Nav + Visible Items**
```
┌────────────────────────┐
│ Logo  Nav1 Nav2 Nav3 👤│
├────────────────────────┤
```

### Desktop Navigation

**Full Horizontal Nav**
```
┌────────────────────────────────┐
│ Logo    Nav1  Nav2  Nav3    👤 │
├────────────────────────────────┤
```

**Sidebar Nav (for complex apps)**
```
┌──────┬─────────────────────┐
│ Logo │      Top Bar        │
├──────┼─────────────────────┤
│ Nav1 │                     │
│ Nav2 │      Content        │
│ Nav3 │                     │
│ Nav4 │                     │
└──────┴─────────────────────┘
```

---

## Content Adaptation

### Text

```css
/* Mobile: Larger relative text for readability */
body {
  font-size: 16px;
  line-height: 1.6;
}

h1 {
  font-size: 28px;
}

/* Desktop: Can go smaller, more content visible */
@media (min-width: 1024px) {
  body {
    font-size: 14px;
    line-height: 1.5;
  }
  
  h1 {
    font-size: 36px;
  }
}
```

### Images

```html
<!-- Responsive images -->
<img 
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w
  "
  sizes="
    (max-width: 600px) 100vw,
    (max-width: 1024px) 50vw,
    33vw
  "
  alt="Description"
>
```

### Tables (Mobile)

Convert tables to cards or stacked layout:

```
Desktop:
| Name    | Email           | Role    |
|---------|-----------------|---------|
| Alice   | alice@mail.com  | Admin   |

Mobile (stacked):
┌─────────────────┐
│ Name: Alice     │
│ Email: alice@.. │
│ Role: Admin     │
└─────────────────┘
```

---

## Performance Considerations

### Mobile-Specific

- **Lazy load images** below the fold
- **Minimize JavaScript** — mobile CPUs are slower
- **Reduce HTTP requests** — combine files
- **Use system fonts** when possible
- **Compress images** — use WebP format

### Critical Rendering Path

1. Inline critical CSS
2. Defer non-critical JS
3. Preload important assets
4. Use skeleton loaders (not spinners)

---

## Testing Checklist

### Before Launch

- [ ] Test on actual devices (not just browser resize)
- [ ] Test on slow 3G connection
- [ ] Check touch targets are 44px+ on mobile
- [ ] Verify primary actions are in thumb zone
- [ ] Test both portrait and landscape
- [ ] Check text is readable without zooming
- [ ] Verify forms are usable on mobile keyboard
- [ ] Test with one hand / thumb only

### Devices to Test

**Minimum:**
- iPhone SE (375px) — smallest common
- iPhone 14 (390px) — average
- iPad (768px) — tablet
- Laptop (1280px) — desktop

**Ideal:**
- Add large phones (iPhone Pro Max, 428px)
- Add various tablet sizes
- Test on actual hardware, not just simulators
