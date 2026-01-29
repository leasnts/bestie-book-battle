# Navigation & Wayfinding

How users move through your product and always know where they are.

## Core Principle

**Users should never feel lost.** At any moment, they should know:
1. Where they are
2. Where they can go
3. How to go back

## The 5±2 Rule

Humans can hold **5-9 items** in working memory. Keep navigation to **5 items maximum** in any single menu.

```
❌ Bad: 12 nav items
Home | Products | Services | About | Team | Careers | Blog | 
Resources | Support | Contact | Partners | Investors

✅ Good: 5 nav items
Home | Products | About | Resources | Contact
```

If you need more items, use:
- Dropdowns/submenus
- Secondary navigation
- Footer links

---

## Navigation Patterns

### Top Navigation Bar (Web Desktop)

```
┌────────────────────────────────────────────┐
│ [Logo]    Nav1  Nav2  Nav3  Nav4    [CTA]  │
└────────────────────────────────────────────┘
```

**Use for:**
- Marketing sites
- SaaS products
- E-commerce

**Rules:**
- Logo links to homepage
- Primary CTA on the right
- Current page is visually distinct
- Sticky on scroll (optional, useful for long pages)

### Bottom Tab Bar (Mobile Apps)

```
┌─────────────────────────┐
│                         │
│        Content          │
│                         │
├─────────────────────────┤
│  🏠   🔍   ➕   💬   👤 │
└─────────────────────────┘
```

**Use for:**
- Native mobile apps
- PWAs
- Mobile-first web apps

**Rules:**
- Maximum **5 items**
- Always visible
- Active state clearly marked
- Icons + labels (not icons alone)
- Most important action in easy thumb reach

### Sidebar Navigation (Complex Apps)

```
┌────────┬──────────────────────┐
│ [Logo] │                      │
├────────┤                      │
│ ▸ Nav1 │                      │
│   Nav2 │       Content        │
│   Nav3 │                      │
│ ▸ Nav4 │                      │
│        │                      │
│ ────── │                      │
│ Settings                      │
└────────┴──────────────────────┘
```

**Use for:**
- Dashboards
- Admin panels
- Complex SaaS apps
- Documentation sites

**Rules:**
- Collapsible on smaller screens
- Group related items
- Use icons + text
- Highlight current section
- Keep important items visible (don't over-collapse)

### Hamburger Menu (Mobile Web)

```
┌─────────────────────────┐
│ [☰]  [Logo]      [🔍]   │
├─────────────────────────┤
│                         │
│        Content          │
│                         │
└─────────────────────────┘

Opens to:
┌─────────────────────────┐
│ [✕]  [Logo]             │
├─────────────────────────┤
│ Home                    │
│ Products                │
│ About                   │
│ Contact                 │
├─────────────────────────┤
│ Log In                  │
└─────────────────────────┘
```

**Use for:**
- Mobile websites
- When nav items are secondary

**Rules:**
- ❌ **NEVER hide primary actions** in hamburger
- Clear close button (X)
- Full-screen or side-drawer
- Animate open/close

---

## Wayfinding Elements

### Breadcrumbs

```
Home > Products > Electronics > Phones > iPhone 15
```

**Use for:**
- Deep hierarchies (e-commerce, documentation)
- Multi-level navigation
- When users might land on deep pages via search

**Rules:**
- Show full path (not just parent)
- Each level is clickable
- Current page is NOT a link (plain text)
- Separator: `>` or `/` or `›`

### Page Titles

**Every page needs a clear title.**

```
┌─────────────────────────────────┐
│ ← Back                          │
│                                 │
│ Account Settings                │  ← Clear title
│ Manage your profile and...      │  ← Optional subtitle
│                                 │
```

### Current State Indicators

**Users must know which page/section they're on.**

```css
/* Nav item - default */
.nav-item {
  color: #666;
  border-bottom: 2px solid transparent;
}

/* Nav item - active */
.nav-item.active {
  color: #000;
  font-weight: 600;
  border-bottom: 2px solid #2563eb;
}
```

**Techniques:**
- Background highlight
- Underline/border
- Bold text
- Different color
- Icon indicator

### Back Navigation

**Always provide a way back.**

```
Mobile: ← Back button (top left)
Web: Browser back should work + breadcrumbs
Modal: X close button (top right)
```

**Rules:**
- Back button = left arrow + "Back" text
- Goes to previous logical location (not always browser history)
- Modals: X in top right corner
- Forms: "Cancel" as secondary action

---

## Information Architecture

### Mental Models

Design navigation around how **users** think, not how **your database** is structured.

```
❌ Organized by internal structure:
├── Products
│   ├── SKU-001
│   ├── SKU-002
│   └── SKU-003

✅ Organized by user mental model:
├── Shop by Category
│   ├── Electronics
│   ├── Clothing
│   └── Home & Garden
├── Shop by Brand
└── Sale Items
```

### Card Sorting

When unsure how to organize, do a card sort:
1. Write features/pages on cards
2. Ask users to group them
3. Ask users to name the groups
4. Use their language and groupings

### Progressive Disclosure

Don't show everything at once. Reveal complexity gradually.

```
Level 1: Main categories (visible)
Level 2: Subcategories (on hover/click)
Level 3: Details (on deeper navigation)
```

---

## Navigation Behaviors

### Sticky vs. Static

**Sticky (fixed on scroll)**
- ✅ Long content pages
- ✅ E-commerce (cart always accessible)
- ✅ When primary CTA must be visible
- ❌ Short pages
- ❌ Mobile (eats screen space)

**Static (scrolls with content)**
- ✅ Short pages
- ✅ Content-focused reading experiences
- ✅ Mobile apps with bottom nav

### Hide on Scroll (Mobile)

```
Scroll down → Hide nav (more content visible)
Scroll up → Show nav (user wants to navigate)
```

**Implementation:**
- Smooth transition (not jarring)
- Threshold before hiding (~50px scroll)
- Small upward scroll triggers show

### Mega Menus (E-commerce)

```
┌───────────────────────────────────────────────────┐
│ [Logo]   Products ▾   Services   About   Contact  │
├───────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────┐ │
│ │ Electronics    │ Clothing      │ [Featured]  │ │
│ │ ├ Phones       │ ├ Men's       │             │ │
│ │ ├ Laptops      │ ├ Women's     │  [Image]    │ │
│ │ ├ Tablets      │ ├ Kids        │  Sale 50%   │ │
│ │ └ Accessories  │ └ Accessories │  [Shop Now] │ │
│ └───────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

**Rules:**
- Open on hover (desktop) / tap (mobile)
- Delay before closing (~300ms)
- Clear visual hierarchy
- Include featured content/promotions
- Mobile: convert to drill-down pages

---

## Search as Navigation

For large sites/apps, search becomes primary navigation.

### Search Placement

```
Desktop: Top right, or centered in header
Mobile: Icon that expands, or dedicated tab

┌─────────────────────────────────┐
│ [Logo]           [🔍 Search...] │
└─────────────────────────────────┘
```

### Search Features

**Minimum viable:**
- Autocomplete suggestions
- Recent searches
- Clear button

**Enhanced:**
- Fuzzy matching (typo tolerance)
- Category filters
- Voice search
- Results preview in dropdown

---

## Navigation Anti-Patterns

### ❌ Hidden Primary Actions

```
❌ Primary action buried in hamburger menu

✅ Primary action always visible:
┌─────────────────────────────────┐
│ [☰]  [Logo]           [+ New]  │
└─────────────────────────────────┘
```

### ❌ Too Many Levels

```
❌ 5+ levels deep = users are lost
   Home > Category > Subcategory > Sub-sub > Sub-sub-sub > Item

✅ Max 3-4 levels, use filters instead:
   Products > Electronics > [Filter: Phones, Under $500]
```

### ❌ Inconsistent Placement

```
❌ Nav moves around on different pages

✅ Same position, same order, everywhere
```

### ❌ No Current State

```
❌ User can't tell which page they're on

✅ Current page/section clearly highlighted
```

### ❌ Dead Ends

```
❌ Page with no navigation out (except browser back)

✅ Always provide: back, home, or related links
```

---

## Testing Checklist

- [ ] Can users identify current location?
- [ ] Is there always a way back?
- [ ] Are nav items limited to 5-7 max?
- [ ] Does navigation match user mental model (not internal structure)?
- [ ] Is the primary action visible without opening menus?
- [ ] Does mobile nav respect thumb zones?
- [ ] Is current state clearly indicated?
- [ ] Can users access key features in 3 taps/clicks or less?
- [ ] Does browser back button work as expected?
- [ ] Are keyboard shortcuts available for power users?
