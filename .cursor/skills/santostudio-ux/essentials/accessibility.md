# Accessibility (A11y)

Making interfaces usable by everyone, regardless of ability.

## Core Principle

**Accessibility is not a feature, it's a requirement.** If 15% of users can't use your product, you've failed 15% of your users.

## WCAG Quick Reference

Web Content Accessibility Guidelines (WCAG) 2.1 defines three levels:
- **A** — Minimum (legal baseline)
- **AA** — Standard (target this)
- **AAA** — Enhanced (ideal for specific contexts)

**Santos Studio targets WCAG 2.1 AA as the minimum standard.**

### Focus-Visible (NOT Focus)

Use `:focus-visible` instead of `:focus` to show focus rings only for keyboard users. Mouse/touch users don't need them.

```css
/* ✅ Keyboard users see the ring */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ❌ NEVER remove focus without replacement */
button:focus { outline: none; }  /* Accessibility violation */
```

### Input Detection (Not Just Screen Size)

Screen size doesn't tell you input method. Use pointer and hover queries:

```css
@media (pointer: fine) { .button { padding: 8px 16px; } }    /* Mouse/trackpad */
@media (pointer: coarse) { .button { padding: 12px 20px; } }  /* Touch */
@media (hover: hover) { .card:hover { transform: translateY(-2px); } }
@media (hover: none) { /* No hover — use active states instead */ }
```

### Touch Target Expansion

Small visual elements can have larger touch targets via invisible expansion:

```css
.icon-button { width: 24px; height: 24px; position: relative; }
.icon-button::before { content: ''; position: absolute; inset: -10px; } /* 44px touch area */
```

## The Four Principles (POUR)

### 1. Perceivable
Users must be able to perceive the content.

### 2. Operable
Users must be able to operate the interface.

### 3. Understandable
Users must be able to understand the content and interface.

### 4. Robust
Content must work with current and future technologies.

---

## Color & Contrast

### Contrast Ratios (WCAG AA)

| Element | Minimum Ratio | Example |
|---------|---------------|---------|
| Normal text (<18px) | **4.5:1** | Dark gray on white |
| Large text (≥18px or ≥14px bold) | **3:1** | Medium gray on white |
| UI components & graphics | **3:1** | Button borders, icons |

### Testing Contrast
Tools:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools → Rendering → Emulate vision deficiencies
- Figma plugins: Stark, Contrast

### Color Independence
**NEVER use color alone to convey information.**

```
❌ Bad:
  Red = error, Green = success (colorblind users can't distinguish)

✅ Good:
  🔴 ✕ Error message here (color + icon + text)
  🟢 ✓ Success message here (color + icon + text)
```

### Common Color Blindness

| Type | Affects | Confusion |
|------|---------|-----------|
| Protanopia | ~1% of men | Red-green |
| Deuteranopia | ~5% of men | Red-green |
| Tritanopia | ~0.003% | Blue-yellow |

**Safe palette combinations:**
- Blue + Orange (distinguishable by all types)
- Blue + Red (add texture/pattern for tritanopia)
- Always add secondary indicator (icon, pattern, text)

---

## Keyboard Navigation

### Requirements
Every interactive element must be:
1. **Focusable** — Reachable via Tab key
2. **Operable** — Activatable via Enter/Space
3. **Visible** — Focus state clearly visible

### Focus Order
Tab order should follow visual/logical order:
```
Logo → Nav items → Main content → Sidebar → Footer
```

**Never use `tabindex` > 0.** It breaks natural flow.

### Focus Styles
```css
/* ❌ NEVER do this */
*:focus {
  outline: none;
}

/* ✅ Replace default with visible custom style */
*:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

### Keyboard Patterns

| Element | Keys | Behavior |
|---------|------|----------|
| Button | Enter, Space | Activate |
| Link | Enter | Navigate |
| Checkbox | Space | Toggle |
| Radio group | Arrows | Move selection |
| Dropdown | Arrows, Enter, Escape | Navigate, select, close |
| Modal | Escape | Close |
| Tabs | Arrows | Switch tabs |

### Skip Links
First focusable element should be "Skip to main content":
```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px 16px;
  background: #000;
  color: #fff;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

---

## Screen Readers

### Semantic HTML
Use the right element for the job:

```html
<!-- ❌ Bad: div soup -->
<div class="button" onclick="submit()">Submit</div>

<!-- ✅ Good: semantic -->
<button type="submit">Submit</button>
```

| Use Case | Element |
|----------|---------|
| Navigation | `<nav>` |
| Main content | `<main>` |
| Section | `<section>` with heading |
| Article/post | `<article>` |
| Sidebar | `<aside>` |
| Footer | `<footer>` |
| Button/action | `<button>` |
| Link/navigation | `<a href>` |
| List | `<ul>`, `<ol>` |

### Alt Text for Images

**Content images (informative):**
```html
<img src="chart.png" alt="Sales increased 25% from Q1 to Q2 2024">
```

**Decorative images:**
```html
<img src="decorative-swirl.png" alt="">
<!-- Empty alt tells screen readers to skip -->
```

**Complex images (charts, diagrams):**
```html
<img src="org-chart.png" alt="Organization structure" aria-describedby="org-desc">
<p id="org-desc" class="sr-only">
  CEO at top, with three direct reports: CTO, CFO, and COO...
</p>
```

### ARIA Labels

Use when HTML alone isn't descriptive enough:

```html
<!-- Icon-only button -->
<button aria-label="Close modal">
  <svg><!-- X icon --></svg>
</button>

<!-- Search input -->
<input type="search" aria-label="Search products">

<!-- Current page in navigation -->
<a href="/products" aria-current="page">Products</a>

<!-- Expanded/collapsed state -->
<button aria-expanded="false" aria-controls="menu">Menu</button>
<nav id="menu" hidden>...</nav>
```

### Live Regions
Announce dynamic content changes:

```html
<!-- Polite: waits for pause in speech -->
<div aria-live="polite">
  3 items in cart
</div>

<!-- Assertive: interrupts immediately (use sparingly) -->
<div aria-live="assertive" role="alert">
  Error: Payment failed
</div>
```

### Screen Reader Only Content
Visually hidden but announced:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

```html
<button>
  <svg><!-- trash icon --></svg>
  <span class="sr-only">Delete item</span>
</button>
```

---

## Motor Accessibility

### Touch Targets
Minimum sizes for comfortable interaction:

| Platform | Minimum Size |
|----------|--------------|
| Mobile (iOS/Android) | **44x44px** |
| Desktop | **24x24px** |

**Spacing between targets:** At least 8px to prevent mis-taps.

### Click/Tap Area
Make the entire row/card clickable, not just the text:

```html
<!-- ❌ Bad: tiny click target -->
<div class="card">
  <h3><a href="/product">Product Name</a></h3>
  <p>Description...</p>
</div>

<!-- ✅ Good: entire card clickable -->
<a href="/product" class="card">
  <h3>Product Name</h3>
  <p>Description...</p>
</a>
```

### Reduce Motion
Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Timeout Considerations
- Allow users to extend time limits
- Warn before timeouts (at least 20 seconds before)
- Save progress automatically

---

## Forms Accessibility

### Labels
Every input needs a label:

```html
<!-- ❌ Bad: placeholder as label -->
<input type="email" placeholder="Email">

<!-- ✅ Good: proper label -->
<label for="email">Email</label>
<input type="email" id="email">

<!-- ✅ Also good: wrapped -->
<label>
  Email
  <input type="email">
</label>
```

### Error Messages
Connect errors to inputs:

```html
<label for="email">Email</label>
<input 
  type="email" 
  id="email" 
  aria-invalid="true"
  aria-describedby="email-error"
>
<p id="email-error" class="error">
  Please enter a valid email address
</p>
```

### Required Fields
```html
<label for="name">
  Name <span aria-hidden="true">*</span>
  <span class="sr-only">(required)</span>
</label>
<input type="text" id="name" required aria-required="true">
```

### Fieldsets for Groups
```html
<fieldset>
  <legend>Payment Method</legend>
  <label><input type="radio" name="payment" value="card"> Credit Card</label>
  <label><input type="radio" name="payment" value="paypal"> PayPal</label>
</fieldset>
```

---

## Testing Checklist

### Automated Testing
- [ ] Run axe DevTools or Lighthouse accessibility audit
- [ ] Check contrast ratios with WebAIM tool
- [ ] Validate HTML (validator.w3.org)

### Manual Testing
- [ ] Navigate entire page using only keyboard (Tab, Enter, Arrows, Escape)
- [ ] Test with screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Check with browser zoom at 200%
- [ ] Test with `prefers-reduced-motion` enabled
- [ ] Verify focus is always visible
- [ ] Test forms with only keyboard

### User Testing
- [ ] Include users with disabilities in testing
- [ ] Test with actual assistive technology users

## Quick Wins

If you do nothing else, do these:

1. **Add alt text** to all content images
2. **Ensure 4.5:1 contrast** for all text
3. **Make focus visible** on all interactive elements
4. **Use semantic HTML** (buttons, links, headings)
5. **Don't rely on color alone** — add icons/text
6. **Make touch targets 44px** on mobile
