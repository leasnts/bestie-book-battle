# Inputs - Santos Studio UI Components

Input field specifications with generous padding, clear states, and excellent usability.

## Input Field Philosophy

Santos Studio inputs prioritize **usability and clarity**:
- **Generous padding** (20px horizontal, 16px vertical) for easy interaction
- **Clear visual states** (focus, error, disabled)
- **16-20px radius** for modern feel
- **16px font size** to prevent iOS zoom

---

## Standard Text Input

### Specifications

**Visual:**
- Border: 1px solid Gray-300 (default)
- Border radius: **16-20px** (use 16px for compact, 20px for spacious)
- Background: White (light mode) / Gray-900 (dark mode)
- Font size: **16px** (prevents zoom on mobile)

**Spacing:**
- Padding: **20px horizontal, 16px vertical**
- Height: ~56px (with padding)
- Margin bottom (with label): 20px

**Typography:**
- Font weight: Regular (400)
- Line-height: 1.5
- Color: Gray-900 (light) / White (dark)

### States

#### Default
```css
border: 1px solid #d1d5db; /* Gray-300 */
background: white;
color: #111827; /* Gray-900 */
```

#### Focus
```css
border: 1px solid Primary-500;
outline: none;
box-shadow: 0 0 0 3px rgba(primary-color, 0.1);
/* Ring effect around input */
```

#### Error
```css
border: 2px solid #ef4444; /* Red-500 */
box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
```

Error message below (12px, Red-600):
```jsx
<p className="mt-2 text-sm text-red-600 dark:text-red-400">
  Email is required
</p>
```

#### Disabled
```css
background: #f3f4f6; /* Gray-100 */
color: #9ca3af; /* Gray-400 */
cursor: not-allowed;
border: 1px solid #e5e7eb; /* Gray-200 */
```

#### Success (optional)
```css
border: 2px solid #10b981; /* Green-500 */
box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
```

Success message below (12px, Green-600):
```jsx
<p className="mt-2 text-sm text-green-600 dark:text-green-400">
  ✓ Email is available
</p>
```

### Code Examples

**React + Tailwind:**
```jsx
<div className="w-full">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Email address
  </label>
  <input
    type="email"
    placeholder="you@example.com"
    className="
      w-full px-5 py-4 rounded-2xl
      border border-gray-300 dark:border-gray-700
      bg-white dark:bg-gray-900
      text-base text-gray-900 dark:text-white
      placeholder:text-gray-400
      focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100
      disabled:bg-gray-100 dark:disabled:bg-gray-800
      disabled:text-gray-400 disabled:cursor-not-allowed
      transition-all duration-200
    "
  />
</div>
```

**With error state:**
```jsx
<div className="w-full">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Email address
  </label>
  <input
    type="email"
    className="
      w-full px-5 py-4 rounded-2xl
      border-2 border-red-500
      bg-white dark:bg-gray-900
      text-base
      focus:outline-none focus:ring-3 focus:ring-red-100
      transition-all duration-200
    "
  />
  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
    Please enter a valid email address
  </p>
</div>
```

---

## Textarea

For multi-line text input.

### Specifications

Same as standard input, but:
- **Min-height:** 120px (3-4 lines)
- **Resize:** Vertical only
- Padding: Same as input (20px horizontal, 16px vertical)

### Code Example

```jsx
<textarea
  rows={4}
  placeholder="Enter your message..."
  className="
    w-full px-5 py-4 rounded-2xl
    border border-gray-300 dark:border-gray-700
    bg-white dark:bg-gray-900
    text-base
    resize-y
    focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100
    transition-all duration-200
  "
/>
```

---

## Search Input

Input with search icon.

### Specifications

- Icon: Left-aligned, 20x20px, Gray-400
- Icon padding: 16px from left edge
- Text padding: Starts after icon (48px from left)
- Same vertical padding: 16px

### Code Example

```jsx
<div className="relative w-full">
  <svg 
    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
  <input
    type="search"
    placeholder="Search..."
    className="
      w-full pl-12 pr-5 py-4 rounded-2xl
      border border-gray-300 dark:border-gray-700
      bg-white dark:bg-gray-900
      text-base
      focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100
      transition-all duration-200
    "
  />
</div>
```

---

## Select Dropdown

### Specifications

Same padding and radius as standard input:
- Padding: 20px horizontal, 16px vertical
- Radius: 16-20px
- Chevron icon: Right-aligned

### Code Example

```jsx
<div className="relative w-full">
  <select
    className="
      w-full px-5 py-4 pr-12 rounded-2xl
      border border-gray-300 dark:border-gray-700
      bg-white dark:bg-gray-900
      text-base
      appearance-none
      focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100
      transition-all duration-200
      cursor-pointer
    "
  >
    <option>Select an option</option>
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
  {/* Chevron icon */}
  <svg 
    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
</div>
```

---

## Checkbox

### Specifications

- Size: 20x20px (default), 24x24px (large)
- Border radius: 4px (slightly rounded, not circle)
- Border: 2px solid Gray-300
- Checkmark: White on Primary-500 background when checked

### Code Example

```jsx
<label className="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    className="
      w-5 h-5 rounded
      border-2 border-gray-300
      text-blue-500
      focus:ring-2 focus:ring-blue-100 focus:ring-offset-0
      transition-all duration-150
      cursor-pointer
    "
  />
  <span className="text-sm text-gray-700 dark:text-gray-300">
    I agree to the terms and conditions
  </span>
</label>
```

---

## Radio Button

### Specifications

- Size: 20x20px
- Shape: Circle (9999px radius)
- Border: 2px solid Gray-300
- Selected: Primary-500 fill with white center dot

### Code Example

```jsx
<div className="space-y-3">
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="radio"
      name="option"
      className="
        w-5 h-5
        border-2 border-gray-300
        text-blue-500
        focus:ring-2 focus:ring-blue-100 focus:ring-offset-0
        cursor-pointer
      "
    />
    <span className="text-sm text-gray-700 dark:text-gray-300">
      Option 1
    </span>
  </label>
  
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="radio"
      name="option"
      className="
        w-5 h-5
        border-2 border-gray-300
        text-blue-500
        focus:ring-2 focus:ring-blue-100 focus:ring-offset-0
        cursor-pointer
      "
    />
    <span className="text-sm text-gray-700 dark:text-gray-300">
      Option 2
    </span>
  </label>
</div>
```

---

## Toggle Switch

### Specifications

- Width: 44px, Height: 24px
- Border radius: Full (9999px)
- Background: Gray-300 (off), Primary-500 (on)
- Circle: 20x20px, white, slides left/right

### Code Example

```jsx
<label className="flex items-center gap-3 cursor-pointer">
  <div className="relative inline-block w-11 h-6">
    <input type="checkbox" className="peer sr-only" />
    <div className="
      w-11 h-6 bg-gray-300 rounded-full
      peer-checked:bg-blue-500
      peer-focus:ring-2 peer-focus:ring-blue-100
      transition-all duration-200
    "></div>
    <div className="
      absolute left-1 top-1
      w-4 h-4 bg-white rounded-full
      peer-checked:translate-x-5
      transition-transform duration-200
    "></div>
  </div>
  <span className="text-sm text-gray-700 dark:text-gray-300">
    Enable notifications
  </span>
</label>
```

---

## Input with Icon & Button

Example: Password input with "show/hide" button.

### Code Example

```jsx
<div className="relative w-full">
  <input
    type="password"
    placeholder="Enter password"
    className="
      w-full pl-5 pr-12 py-4 rounded-2xl
      border border-gray-300 dark:border-gray-700
      bg-white dark:bg-gray-900
      text-base
      focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100
      transition-all duration-200
    "
  />
  <button
    type="button"
    className="
      absolute right-4 top-1/2 -translate-y-1/2
      text-gray-400 hover:text-gray-600
      transition-colors duration-150
    "
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  </button>
</div>
```

---

## Best Practices

### Do's ✅
- Use **20px horizontal, 16px vertical padding** (generous for touch)
- Use **16px font size** to prevent iOS zoom
- Use **16-20px radius** for modern feel
- Provide clear visual states (focus, error, disabled)
- Show error messages below input (12px, red)
- Use placeholders for hints, not labels
- Support keyboard navigation

### Don'ts ❌
- Don't use small padding (minimum 16px vertical)
- Don't use font-size below 16px on mobile (causes zoom)
- Don't use radius below 12px
- Don't skip focus states (accessibility!)
- Don't use placeholder as label replacement
- Don't make inputs too narrow (minimum width ~200px)
- Don't forget disabled state styling

---

## Accessibility

- Use `<label>` elements with `for` attribute
- Provide clear error messages
- Use `aria-invalid` on error states
- Use `aria-describedby` to link error messages
- Ensure color contrast (4.5:1 minimum)
- Support keyboard navigation (Tab, Shift+Tab, Enter)
- Use `autocomplete` attributes where appropriate

---

## Complete React Component

```jsx
import React, { useState } from 'react';

const Input = ({ 
  label, 
  error, 
  success,
  disabled = false,
  icon,
  ...props 
}) => {
  const [focused, setFocused] = useState(false);
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          {...props}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full ${icon ? 'pl-12' : 'pl-5'} pr-5 py-4 rounded-2xl
            text-base
            transition-all duration-200
            ${error 
              ? 'border-2 border-red-500 focus:ring-red-100' 
              : success
              ? 'border-2 border-green-500 focus:ring-green-100'
              : 'border border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-100'
            }
            ${disabled 
              ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed' 
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
            }
            focus:outline-none focus:ring-3
            placeholder:text-gray-400
          `}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      
      {success && (
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          ✓ {success}
        </p>
      )}
    </div>
  );
};

export default Input;

// Usage:
// <Input label="Email" type="email" placeholder="you@example.com" />
// <Input label="Email" error="Please enter a valid email" />
// <Input label="Username" success="Username is available" />
// <Input icon={<SearchIcon />} placeholder="Search..." />
```
