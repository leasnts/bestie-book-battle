# Cards - Santos Studio UI Components

Card components with standard and glassmorphism variants for modern, premium interfaces.

## Card Types Overview

| Type | Use Case | Background | Effect |
|------|----------|------------|--------|
| **Standard** | General content containers | White/Dark solid | Subtle shadow |
| **Glassmorphism** | Premium overlays, layered UI | Semi-transparent | Backdrop blur |

---

## Standard Card

**Purpose:** General-purpose content container for most use cases.

### Specifications

**Visual:**
- Background: White (light mode) / Gray-800 (dark mode)
- Border: 1px solid rgba(0, 0, 0, 0.08) light / rgba(255, 255, 255, 0.1) dark
- Border radius: **16-20px** (use 20px for large cards)
- Shadow: Subtle elevation

**Spacing:**
- Padding: **16-24px** (use 20px as default)
- Margin between cards in grid: **12px**

**Shadow:**
```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
```

For elevated cards (hover states, important content):
```css
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
```

### States

**Default:**
Standard shadow, static

**Hover (if interactive):**
```css
transform: translateY(-2px);
box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
transition: all 200ms ease-out;
```

**Active/Selected:**
```css
border: 2px solid Primary-500;
box-shadow: 0 0 0 3px rgba(primary-color, 0.1);
```

### Code Examples

**React + Tailwind:**
```jsx
<div className="
  bg-white dark:bg-gray-800
  p-6 rounded-2xl
  border border-black/8 dark:border-white/10
  shadow-[0_2px_8px_rgba(0,0,0,0.12)]
">
  <h3 className="text-xl font-bold mb-2">Card Title</h3>
  <p className="text-gray-600 dark:text-gray-400">
    Card content goes here
  </p>
</div>
```

**Interactive Card (hover effect):**
```jsx
<div className="
  bg-white dark:bg-gray-800
  p-6 rounded-2xl
  border border-black/8 dark:border-white/10
  shadow-[0_2px_8px_rgba(0,0,0,0.12)]
  hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]
  transition-all duration-200
  cursor-pointer
">
  {/* Card content */}
</div>
```

---

## Glassmorphism Card

**Purpose:** Premium feel, overlays on images/gradients, modern tech aesthetic.

**When to use:**
- Premium features or paid content
- Overlays on photos or colored backgrounds
- Modern/tech-forward products (inspired by Opal, Revolut)
- When you want depth and layers

**When NOT to use:**
- On plain white/gray backgrounds (use standard cards instead)
- For dense information (glassmorphism reduces readability)
- When accessibility is critical (contrast can be challenging)

### Specifications

**Visual:**
- Background: **rgba(255, 255, 255, 0.1)** (adjust 0.05-0.15 based on background)
- Backdrop filter: **blur(20px)**
- Border: Gradient (white 20% → 10% opacity, top to bottom)
- Border radius: **20px**
- Shadow: Subtle, may be colored if on colored background

**Spacing:**
- Padding: **20-24px** (generous for breathing room)
- Text should be white or high-contrast

**Key CSS properties:**
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px); /* Safari support */
border: 1px solid rgba(255, 255, 255, 0.2);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
```

**Border gradient (Santos Studio signature):**
```css
border: 1px solid;
border-image: linear-gradient(
  to bottom,
  rgba(255, 255, 255, 0.2),
  rgba(255, 255, 255, 0.1)
) 1;
```

This creates a white rim at top (20% opacity) that's still visible at bottom (10% opacity).

### Dark Background Variant

On dark backgrounds, use darker base:
```css
background: rgba(0, 0, 0, 0.3);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.15);
```

### Code Examples

**React + Tailwind + Custom CSS:**
```jsx
<div className="glass-card">
  <h3 className="text-white text-xl font-bold mb-2">
    Good Afternoon
  </h3>
  <p className="text-white/80 text-sm">
    Here's a breakdown of your activity
  </p>
</div>

<style jsx>{`
  .glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 24px;
    border: 1px solid;
    border-image: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.2),
      rgba(255, 255, 255, 0.1)
    ) 1;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
`}</style>
```

**Pure CSS Class:**
```css
.glassmorphism-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* On dark backgrounds */
.glassmorphism-card-dark {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

**Example with gradient background:**
```jsx
<div className="relative min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 p-8">
  <div className="
    backdrop-blur-xl
    bg-white/10
    border border-white/20
    rounded-2xl p-6
    shadow-[0_8px_32px_rgba(0,0,0,0.1)]
  ">
    <h2 className="text-white text-2xl font-bold">
      Never miss a great deal
    </h2>
    <p className="text-white/80 mt-2">
      Exclusive deals straight to your inbox
    </p>
  </div>
</div>
```

---

## Card Grid Layouts

### Two-Column Grid (Mobile)

```jsx
<div className="grid grid-cols-2 gap-3">
  <Card />
  <Card />
  <Card />
  <Card />
</div>
```

Spacing: **12px gap**

### Three-Column Grid (Desktop)

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

Spacing: **16px gap** on desktop

---

## Card Variants by Content Type

### Profile Card

```jsx
<div className="
  bg-white dark:bg-gray-800
  p-6 rounded-2xl
  border border-black/8 dark:border-white/10
  shadow-md
">
  <img 
    src="/avatar.jpg" 
    alt="Profile" 
    className="w-20 h-20 rounded-full mb-4"
  />
  <h3 className="text-xl font-bold">Allison</h3>
  <p className="text-sm text-gray-600 dark:text-gray-400">Superhost</p>
  
  <div className="mt-4 space-y-2">
    <div className="flex justify-between">
      <span className="text-gray-600">Reviews</span>
      <span className="font-bold">298</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-600">Rating</span>
      <span className="font-bold">4.96 ⭐</span>
    </div>
  </div>
</div>
```

### Stats Card

```jsx
<div className="
  bg-white dark:bg-gray-800
  p-6 rounded-2xl
  border border-black/8 dark:border-white/10
  shadow-md
">
  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
    Total Revenue
  </p>
  <h2 className="text-4xl font-bold mb-2">$24,567</h2>
  <p className="text-sm text-green-600">+12.5% from last month</p>
</div>
```

### Image Card (inspired by Airbnb)

```jsx
<div className="
  bg-white dark:bg-gray-800
  rounded-2xl
  border border-black/8 dark:border-white/10
  shadow-md
  overflow-hidden
">
  <img 
    src="/property.jpg" 
    alt="Property" 
    className="w-full h-48 object-cover"
  />
  <div className="p-4">
    <h3 className="font-bold text-lg mb-1">
      Apartment in Center City
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
      2 beds · 1 bath · WiFi
    </p>
    <div className="flex items-baseline gap-1">
      <span className="font-bold text-lg">$228</span>
      <span className="text-sm text-gray-600">for 2 nights</span>
    </div>
  </div>
</div>
```

---

## Best Practices

### Do's ✅
- Use 16-20px radius (never below 12px)
- Give cards generous padding (16-24px)
- Use glassmorphism on colored/image backgrounds
- Add subtle shadows for depth
- Use 12px gap in card grids
- Ensure contrast for text readability
- Add hover states for interactive cards

### Don'ts ❌
- Don't use glassmorphism on plain white/gray (defeats the purpose)
- Don't use radius below 12px (too sharp)
- Don't over-pack cards with content (breathing room matters)
- Don't skip padding (16px minimum)
- Don't use heavy borders (1px max, subtle colors)
- Don't forget dark mode variants

---

## Accessibility

- Ensure text contrast meets WCAG AA (4.5:1 minimum)
- For glassmorphism, test readability on various backgrounds
- Use semantic HTML (`<article>`, `<section>`)
- Provide focus states for interactive cards
- Support keyboard navigation (Tab, Enter)

---

## Complete React Component

```jsx
import React from 'react';

const Card = ({ 
  variant = 'standard',
  children,
  interactive = false,
  className = ''
}) => {
  const baseStyles = "rounded-2xl transition-all duration-200";
  
  const variantStyles = {
    standard: `
      bg-white dark:bg-gray-800
      border border-black/8 dark:border-white/10
      shadow-[0_2px_8px_rgba(0,0,0,0.12)]
      p-6
      ${interactive ? 'hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] cursor-pointer' : ''}
    `,
    glass: `
      backdrop-blur-xl
      bg-white/10 dark:bg-black/30
      border border-white/20
      shadow-[0_8px_32px_rgba(0,0,0,0.1)]
      p-6
    `
  };
  
  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;

// Usage:
// <Card variant="standard">Content</Card>
// <Card variant="glass">Premium content</Card>
// <Card variant="standard" interactive>Clickable card</Card>
```

---

## Inspiration Examples

**Opal-style glassmorphism:**
- Deep blue gradient background
- White/10% glassmorphism cards
- White text, high contrast
- 20px radius, generous padding

**Airbnb-style standard cards:**
- White background, subtle shadow
- 16px radius, clean borders
- Professional spacing (20px padding)
- Image + content layout

**Revolut-style premium cards:**
- Colored gradient backgrounds
- Glassmorphism overlays
- 3D rendered elements inside cards
- Bold typography, high contrast
