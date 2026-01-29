# Visual & Content Hierarchy

How to guide user attention and make interfaces scannable.

## Core Principle

**Users don't read, they scan.** Design for scanning first, reading second.

## Scanning Patterns

### F-Pattern (Text-Heavy Pages)
Users scan in an F shape:
1. Horizontal line at the top
2. Second horizontal line below
3. Vertical scan down the left side

**Use for:** Articles, search results, documentation, dashboards

**Design implications:**
- Put critical info in the first two paragraphs
- Start paragraphs/list items with keywords
- Left-align important content
- Use clear headings as "entry points"

### Z-Pattern (Marketing/Landing Pages)
Users scan in a Z shape:
1. Top left → Top right (logo → nav/CTA)
2. Diagonal down to bottom left
3. Bottom left → Bottom right (content → CTA)

**Use for:** Landing pages, hero sections, promotional content

**Design implications:**
- Logo top left, primary CTA top right
- Key message in the center diagonal
- Main CTA bottom right (or center)

## Visual Weight Hierarchy

Visual weight determines what users see first. In order of impact:

### 1. Size
Bigger = more important. Simple.
```
Hero title: 32-48px
Section title: 24px
Body: 14-16px
Caption: 12px
```

### 2. Color & Contrast
High contrast draws attention first.
- Primary actions: High contrast (filled buttons)
- Secondary actions: Medium contrast (outlined buttons)
- Tertiary actions: Low contrast (text links)

### 3. Position
- Top and left = seen first (in LTR languages)
- Center = focal point
- Bottom right = natural endpoint for CTAs

### 4. Whitespace
More whitespace around an element = more importance.
```
Hero section: 64-80px padding
Regular section: 24-32px padding
Compact element: 12-16px padding
```

### 5. Typography Weight
```
Bold (600-700): Headings, labels, emphasis
Medium (500): Subheadings, buttons
Regular (400): Body text, descriptions
Light (300): Use sparingly, accessibility concerns
```

## Content Hierarchy Principles

### One Primary Action Per Screen
Users should never ask "What am I supposed to do here?"

**Good:**
```
[         Sign Up          ]  ← Clear primary
Already have an account? Log in  ← Subtle secondary
```

**Bad:**
```
[   Sign Up   ]  [   Log In   ]  ← Competing equals
```

### Heading Hierarchy
Strict order, never skip levels:
```html
<h1>Page Title</h1>           <!-- One per page -->
  <h2>Section</h2>            <!-- Major sections -->
    <h3>Subsection</h3>       <!-- Within sections -->
      <h4>Detail</h4>         <!-- Rarely needed -->
```

**Screen readers use this for navigation.** Breaking hierarchy breaks accessibility.

### Information Layering
Structure content in layers of detail:

```
Layer 1: Title (what is this?)
Layer 2: Summary (why should I care?)
Layer 3: Details (tell me more)
Layer 4: Actions (what can I do?)
```

**Example - Product Card:**
```
[Product Image]
MacBook Pro 14"              ← Layer 1: What
Powerful laptop for pros     ← Layer 2: Why care
M3 Pro chip, 18GB RAM...     ← Layer 3: Details
[Add to Cart]                ← Layer 4: Action
```

## Hierarchy Mistakes to Avoid

### ❌ Everything is Bold
If everything is emphasized, nothing is emphasized.

### ❌ Too Many Colors
Stick to 1 primary + 1-2 accent colors for actions. More = confusion.

### ❌ Centered Everything
Center alignment works for short titles, not for paragraphs or lists. It breaks the left-edge scanning anchor.

### ❌ Competing CTAs
```
❌ [Buy Now] [Learn More] [Contact Us]  ← 3 options = decision paralysis
✅ [Buy Now]                            ← Clear primary
   Learn more | Contact us              ← Subtle alternatives
```

### ❌ Hidden Primary Actions
The main thing users want to do should be immediately visible, not buried in a menu.

## Practical Checklist

Before shipping any screen, verify:

- [ ] Is there ONE clear primary action?
- [ ] Can users identify the page purpose in <3 seconds?
- [ ] Does heading hierarchy follow h1→h2→h3 order?
- [ ] Is the most important content "above the fold"?
- [ ] Are related items visually grouped?
- [ ] Is there enough whitespace to distinguish sections?
- [ ] Do visual weights match content importance?
