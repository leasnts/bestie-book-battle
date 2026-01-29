# Buttons - Santos Studio UI Components

Complete button system with 4 types: Primary, Secondary, Tertiary, and Link.

## Button Types Overview

| Type | Purpose | Prominence | Use Case |
|------|---------|------------|----------|
| **Primary** | Main action | Highest | "Sign Up", "Save", "Submit" |
| **Secondary** | Alternative action | Medium | "Cancel", "Back", "Skip" |
| **Tertiary** | Subtle action | Low | "Learn More", "View Details" |
| **Link** | Navigation | Minimal | "Privacy Policy", inline links |

---

## Primary Button

**Purpose:** Main action on a screen, highest visual priority.

### Specifications

**Visual:**
- Background: Primary color (solid, vibrant)
- Text: White or high-contrast color
- Font size: 16px
- Font weight: Bold or Semi-bold
- Border radius: 12-16px (use 16px for larger buttons)

**Spacing:**
- Padding: **16px horizontal, 12px vertical**
- Minimum width: 120px (except for icon-only buttons)
- Height: ~48px (including padding)

**Shadow:**
Colored shadow matching the button color for depth:
```css
box-shadow: 
  0 4px 12px rgba(primary-color, 0.3),
  0 2px 6px rgba(0, 0, 0, 0.15);
```

**On dark backgrounds:**
Add gradient border (white 20% opacity top → 10% opacity bottom):
```css
border: 1px solid;
border-image: linear-gradient(
  to bottom,
  rgba(255, 255, 255, 0.2),
  rgba(255, 255, 255, 0.1)
) 1;
```

This creates a subtle white rim at the top that's still visible at the bottom.

### States

**Hover:**
```css
transform: scale(1.02);
box-shadow: 
  0 6px 16px rgba(primary-color, 0.4),
  0 3px 8px rgba(0, 0, 0, 0.2);
transition: all 150ms ease-out;
```

**CRITICAL:** ALL buttons MUST have hover and active states. Never create static buttons.

**Active (pressed):**
```css
transform: scale(0.98);
box-shadow: 
  0 2px 6px rgba(primary-color, 0.2),
  0 1px 3px rgba(0, 0, 0, 0.1);
```

**Disabled:**
```css
opacity: 0.5;
cursor: not-allowed;
/* Remove hover/active effects */
pointer-events: none;
```

**Focus (accessibility):**
```css
outline: none;
box-shadow: 
  0 0 0 3px rgba(primary-color, 0.3),
  0 4px 12px rgba(primary-color, 0.3);
```

### Code Examples

**React + Tailwind:**
```jsx
<button className="
  bg-blue-500 text-white
  px-4 py-3 rounded-xl
  font-semibold text-base
  shadow-[0_4px_12px_rgba(59,130,246,0.3),0_2px_6px_rgba(0,0,0,0.15)]
  hover:scale-102 hover:shadow-[0_6px_16px_rgba(59,130,246,0.4)]
  active:scale-98
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-all duration-150
  border border-white/20
">
  Get Started
</button>
```

**HTML + CSS:**
```html
<button class="btn-primary">Get Started</button>

<style>
.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 4px 12px rgba(59, 130, 246, 0.3),
    0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 
    0 6px 16px rgba(59, 130, 246, 0.4),
    0 3px 8px rgba(0, 0, 0, 0.2);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

---

## Secondary Button

**Purpose:** Alternative or less important actions.

### Specifications

**Visual:**
- Background: Gray-200 (light mode) / Gray-800 (dark mode)
- Text: Gray-900 (light) / White (dark)
- Font size: 16px
- Font weight: Semi-bold
- Border: 1px solid Gray-300 (light) / Gray-700 (dark)
- Border radius: 12px

**Spacing:**
- Padding: **16px horizontal, 12px vertical**
- Same dimensions as primary button

**Shadow:**
Subtle, neutral (no colored shadow):
```css
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
```

### States

**Hover:**
```css
background: Gray-300 (light) / Gray-700 (dark);
box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
```

**Active:**
```css
background: Gray-400 (light) / Gray-600 (dark);
```

### Code Example

```jsx
<button className="
  bg-gray-200 dark:bg-gray-800
  text-gray-900 dark:text-white
  px-4 py-3 rounded-xl
  font-semibold text-base
  border border-gray-300 dark:border-gray-700
  shadow-sm
  hover:bg-gray-300 dark:hover:bg-gray-700
  active:bg-gray-400 dark:active:bg-gray-600
  transition-all duration-150
">
  Cancel
</button>
```

---

## Tertiary Button

**Purpose:** Subtle actions that shouldn't dominate the UI.

### Specifications

**Visual:**
- Background: **Transparent** (no fill)
- Text: Primary color or Gray-700
- Font size: 14-16px
- Font weight: Medium
- Border: None
- Border radius: 8px (smaller than primary/secondary)

**Spacing:**
- Padding: **12px horizontal, 10px vertical**
- More compact than primary/secondary

**Shadow:**
None (keeps it subtle)

### States

**Hover:**
```css
background: Primary-50 (light) / Primary-900/20 (dark);
/* Light tint of primary color */
```

**Active:**
```css
background: Primary-100 (light) / Primary-900/30 (dark);
```

### Code Example

```jsx
<button className="
  bg-transparent
  text-blue-600 dark:text-blue-400
  px-3 py-2.5 rounded-lg
  font-medium text-sm
  hover:bg-blue-50 dark:hover:bg-blue-900/20
  active:bg-blue-100 dark:active:bg-blue-900/30
  transition-all duration-150
">
  Learn More
</button>
```

---

## Link Button

**Purpose:** Text-like buttons for navigation or inline actions.

### Specifications

**Visual:**
- Background: None
- Text: Primary color or Gray-600
- Font size: 14-16px
- Font weight: Regular or Medium
- Underline: None (default), underline on hover

**Spacing:**
- Padding: **Minimal** (4px horizontal, 2px vertical)
- Inline with text

**No shadow, no border**

### States

**Hover:**
```css
text-decoration: underline;
color: Darker shade of current color;
```

### Code Example

```jsx
<button className="
  bg-transparent
  text-blue-600 dark:text-blue-400
  px-1 py-0.5
  font-normal text-sm
  hover:underline
  transition-all duration-150
">
  Privacy Policy
</button>
```

---

## Icon Buttons

For buttons with only icons (no text).

### Specifications

**Size:**
- Small: 32x32px (icon 16px)
- Medium: 40x40px (icon 20px)
- Large: 48x48px (icon 24px)

**Padding:**
Equal on all sides to center icon

**Border radius:**
- Square variant: 8-12px
- Circle variant: 9999px (full round)

### Code Example

```jsx
{/* Square icon button */}
<button className="
  w-10 h-10
  flex items-center justify-center
  bg-gray-100 dark:bg-gray-800
  rounded-lg
  hover:bg-gray-200 dark:hover:bg-gray-700
  transition-all duration-150
">
  <IconComponent className="w-5 h-5" />
</button>

{/* Circle icon button */}
<button className="
  w-10 h-10
  flex items-center justify-center
  bg-blue-500 text-white
  rounded-full
  shadow-md
  hover:scale-105
  transition-all duration-150
">
  <IconComponent className="w-5 h-5" />
</button>
```

---

## Button Groups

When multiple buttons appear together.

### Horizontal Group

**Spacing between buttons:** 12px

```jsx
<div className="flex gap-3">
  <button className="btn-primary">Save</button>
  <button className="btn-secondary">Cancel</button>
</div>
```

### Vertical Stack

**Spacing between buttons:** 12px

```jsx
<div className="flex flex-col gap-3">
  <button className="btn-primary w-full">Continue</button>
  <button className="btn-secondary w-full">Go Back</button>
</div>
```

---

## Best Practices

### Do's ✅
- Use primary buttons for **one main action per screen**
- Give buttons generous padding (16px horizontal minimum)
- Use colored shadows on primary buttons for depth
- Add gradient border on primary buttons over dark backgrounds
- Ensure 48px minimum tap target for mobile
- Use consistent radius (12-16px)

### Don'ts ❌
- Don't use multiple primary buttons on one screen (creates confusion)
- Don't use radius below 12px (too sharp)
- Don't skip hover/active states
- Don't use red as primary button color (reserved for destructive actions)
- Don't use purple as primary button color (AI cliché)
- Don't make buttons too small (minimum 120px width for text buttons)

---

## Accessibility

- Ensure color contrast meets WCAG AA standards (4.5:1 for text)
- Provide focus states (visible outline or ring)
- Use semantic `<button>` elements
- Add `aria-label` for icon-only buttons
- Support keyboard navigation (Tab, Enter, Space)

## Complete React Component Example

```jsx
import React from 'react';

const Button = ({ 
  variant = 'primary', 
  size = 'medium',
  children, 
  disabled = false,
  onClick,
  className = ''
}) => {
  const baseStyles = "font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    small: "px-3 py-2 text-sm rounded-lg",
    medium: "px-4 py-3 text-base rounded-xl",
    large: "px-6 py-4 text-lg rounded-2xl"
  };
  
  const variantStyles = {
    primary: `
      bg-blue-500 text-white
      shadow-[0_4px_12px_rgba(59,130,246,0.3),0_2px_6px_rgba(0,0,0,0.15)]
      hover:scale-102 hover:shadow-[0_6px_16px_rgba(59,130,246,0.4)]
      active:scale-98
      border border-white/20
    `,
    secondary: `
      bg-gray-200 dark:bg-gray-800 
      text-gray-900 dark:text-white
      border border-gray-300 dark:border-gray-700
      shadow-sm
      hover:bg-gray-300 dark:hover:bg-gray-700
      active:bg-gray-400 dark:active:bg-gray-600
    `,
    tertiary: `
      bg-transparent text-blue-600 dark:text-blue-400
      hover:bg-blue-50 dark:hover:bg-blue-900/20
      active:bg-blue-100 dark:active:bg-blue-900/30
    `,
    link: `
      bg-transparent text-blue-600 dark:text-blue-400
      px-1 py-1
      hover:underline
    `
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;

// Usage:
// <Button variant="primary">Save Changes</Button>
// <Button variant="secondary" size="large">Cancel</Button>
// <Button variant="tertiary">Learn More</Button>
```
