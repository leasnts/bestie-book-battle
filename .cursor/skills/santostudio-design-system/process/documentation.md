# Documentation Guide

How to document the design system for the client's team.

---

## Documentation Structure

```
docs/
├── index.md              → Overview, quick start
├── foundations/
│   ├── colors.md
│   ├── typography.md
│   ├── spacing.md
│   ├── radius.md
│   ├── shadows.md
│   └── motion.md
├── components/
│   ├── button.md
│   ├── input.md
│   └── [etc.]
├── patterns/
│   ├── forms.md
│   ├── navigation.md
│   └── data-display.md
└── resources/
    ├── downloads.md      → Token files, assets
    └── changelog.md      → Version history
```

---

## Quick Start Guide

Every design system needs a quick start page:

```markdown
# [System Name] Design System

## Overview
[One paragraph describing the system and its purpose]

## Quick Install

### CSS Variables
```html
<link rel="stylesheet" href="path/to/tokens.css">
```

### Tailwind
```js
// tailwind.config.js
module.exports = {
  presets: [require('./your-preset')],
}
```

### Figma
[Link to Figma library]

## Core Concepts

### Tokens
Design tokens are the foundation. They define colors, spacing, typography, and other visual properties.

### Components
Pre-built UI components that use the tokens. Start with these for consistency.

### Patterns
Common UI patterns showing how to combine components.

## Getting Help
- [Slack channel / Contact]
- [GitHub issues]
- [Office hours]
```

---

## Foundation Documentation Template

For each token category:

```markdown
# Colors

## Overview
[Brief description of the color system]

## Brand Colors

### Primary
The primary color is used for main actions and key UI elements.

| Token | Value | Preview |
|-------|-------|---------|
| `--color-primary-50` | #eff6ff | [swatch] |
| `--color-primary-500` | #3b82f6 | [swatch] |
| `--color-primary-900` | #1e3a8a | [swatch] |

**Usage:**
- Primary buttons
- Links
- Active states
- Focus rings

### Secondary
[Same structure]

## Semantic Colors

### Success
| Token | Value | Usage |
|-------|-------|-------|
| `--color-success-500` | #10b981 | Success states |

[Error, warning, info same structure]

## Neutral Colors
[Gray scale]

## Usage Guidelines

### Do ✅
- Use primary for main CTAs
- Use semantic colors consistently
- Ensure sufficient contrast (4.5:1 minimum)

### Don't ❌
- Don't use red for non-destructive actions
- Don't use multiple primary colors
- Don't use low-contrast combinations

## Code Examples

### CSS
```css
.button-primary {
  background-color: var(--color-primary-500);
  color: white;
}
.button-primary:hover {
  background-color: var(--color-primary-600);
}
```

### Tailwind
```html
<button class="bg-primary-500 hover:bg-primary-600 text-white">
  Primary Button
</button>
```
```

---

## Component Documentation Template

```markdown
# Button

## Overview
Buttons trigger actions and submit forms.

## Playground
[Interactive demo if possible]

## Variants

### Primary
Use for the main action on a page. Limit to one per view.
[Visual example]

### Secondary
Use for alternative actions alongside primary.
[Visual example]

### Ghost
Use for tertiary actions with less visual emphasis.
[Visual example]

### Destructive
Use for dangerous or irreversible actions.
[Visual example]

## Sizes

| Size | Height | Usage |
|------|--------|-------|
| sm | 32px | Dense UIs, tables |
| md | 40px | Default, most cases |
| lg | 48px | Hero sections, emphasis |

[Visual comparison]

## States

| State | Description |
|-------|-------------|
| Default | Resting state |
| Hover | Mouse over |
| Active | Being pressed |
| Focus | Keyboard focus |
| Disabled | Not interactive |
| Loading | Async action in progress |

[Visual of each state]

## With Icons

### Icon Left
[Example]

### Icon Right
[Example]

### Icon Only
[Example]

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | string | 'primary' | Visual style |
| size | string | 'md' | Size variant |
| disabled | boolean | false | Disables button |
| loading | boolean | false | Shows spinner |

## Usage Guidelines

### Do ✅
- Use clear, action-oriented labels
- Provide visual feedback for async actions
- Maintain consistent sizing in groups

### Don't ❌
- Don't use multiple primary buttons
- Don't use vague labels like "Click here"
- Don't disable without explanation

## Accessibility

- Uses native `<button>` element
- Includes focus ring for keyboard users
- Disabled state removes from tab order
- Loading state announces to screen readers

## Code Examples

### React
```jsx
import { Button } from '@your-org/ui';

<Button variant="primary" size="md">
  Save Changes
</Button>

<Button variant="secondary" loading>
  Submitting...
</Button>
```

### HTML
```html
<button class="btn btn-primary btn-md">
  Save Changes
</button>
```
```

---

## Pattern Documentation Template

Patterns show how to combine components:

```markdown
# Form Patterns

## Overview
Guidelines for building consistent, accessible forms.

## Basic Form

### Structure
```
Form
├── Form Field (name)
├── Form Field (email)
├── Form Field (password)
└── Actions
    ├── Submit Button (primary)
    └── Cancel Button (secondary)
```

### Example
[Visual + code]

### Spacing
- Between fields: 16px
- Before actions: 24px
- Between action buttons: 12px

## Form with Sections

### When to Use
Forms with 5+ fields or distinct groups.

### Structure
```
Form
├── Section 1: Personal Info
│   ├── Field (name)
│   └── Field (email)
├── Section 2: Address
│   ├── Field (street)
│   ├── Field (city)
│   └── Field (zip)
└── Actions
```

### Example
[Visual + code]

## Inline Validation

### Rules
- Validate on blur (not on every keystroke)
- Show success state for corrected errors
- Keep error messages concise

### Example
[Visual + code]

## Do / Don't

### Do ✅
- Group related fields
- Mark required fields
- Show inline errors
- Provide clear submit labels

### Don't ❌
- Don't validate while typing
- Don't use only color for errors
- Don't hide all errors until submit
- Don't use generic "Error" messages
```

---

## Do/Don't Guidelines

Include these throughout:

### Format

```markdown
### Do ✅
- [Good practice]
- [Good practice]
- [Good practice]

### Don't ❌
- [Bad practice]
- [Bad practice]
- [Bad practice]
```

### Visuals

Pair with visual examples when possible:

```
┌─────────────────┐  ┌─────────────────┐
│  ✅ Do          │  │  ❌ Don't       │
│                 │  │                 │
│  [Good visual]  │  │  [Bad visual]   │
│                 │  │                 │
└─────────────────┘  └─────────────────┘
```

### Common Guidelines to Include

**Colors:**
- ✅ Use primary for main CTAs
- ❌ Don't use red for non-errors

**Typography:**
- ✅ Use hierarchy (one h1 per page)
- ❌ Don't use more than 2-3 font sizes per view

**Spacing:**
- ✅ Use consistent spacing tokens
- ❌ Don't use arbitrary values

**Components:**
- ✅ One primary button per view
- ❌ Don't disable without explanation

---

## Changelog

Track versions:

```markdown
# Changelog

## [1.2.0] - 2025-02-15

### Added
- New `Badge` component
- Dark mode support for all components

### Changed
- Button padding increased (12px → 16px horizontal)
- Primary color updated (#3b82f6 → #2563eb)

### Fixed
- Input focus ring not visible in Safari
- Modal close button alignment

### Deprecated
- `Button` size "xs" (use "sm" instead)

---

## [1.1.0] - 2025-01-20

### Added
- Initial component library
- Token system
```

---

## Documentation Levels

Adjust depth based on team needs:

### Basic (Small teams, <5 people)
- Token values + usage notes
- Component examples
- Key do/don'ts

### Standard (Medium teams, 5-20 people)
- Full token documentation
- Component API reference
- Pattern library
- Changelog

### Extensive (Large teams, 20+ people)
- All of the above
- Contribution guidelines
- Governance model
- Migration guides
- Video tutorials

---

## Writing Style

### Tone
- Clear and direct
- Friendly but professional
- Action-oriented

### Format
- Short paragraphs
- Bullet points for lists
- Tables for structured data
- Code examples for everything

### Examples

**Good:**
> Use primary buttons for the main action on a page. Limit to one per view.

**Bad:**
> The primary button variant should be utilized when you want to draw the user's attention to the most important action that they can take on any given page or view within the application interface.

---

## Documentation Checklist

- [ ] Quick start guide
- [ ] All foundations documented
- [ ] All components documented
- [ ] Key patterns documented
- [ ] Do/Don't guidelines
- [ ] Code examples (React/HTML/CSS)
- [ ] Accessibility notes
- [ ] Changelog started
- [ ] Downloads/resources linked

---

## Next Step

Documentation complete → Prepare **exports** (CSS, Tailwind, JSON).
