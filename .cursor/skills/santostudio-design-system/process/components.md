# Component Architecture

How to structure and document components in the design system.

---

## Atomic Design Structure

Organize components by complexity:

```
components/
├── atoms/        → Smallest, indivisible units
├── molecules/    → Combinations of atoms
├── organisms/    → Complex, self-contained sections
└── templates/    → Page-level layouts
```

---

## Atoms

**Definition:** Single-purpose elements that can't be broken down further.

### Core Atoms

| Atom | Purpose | Variants |
|------|---------|----------|
| **Button** | Trigger actions | primary, secondary, ghost, destructive |
| **Input** | Text entry | text, email, password, number |
| **Textarea** | Multi-line text | default, resizable |
| **Select** | Dropdown selection | single, searchable |
| **Checkbox** | Binary toggle | checked, indeterminate |
| **Radio** | Single selection | grouped |
| **Toggle/Switch** | On/off | small, default, large |
| **Badge** | Status indicator | default, success, warning, error |
| **Avatar** | User representation | image, initials, icon |
| **Icon** | Visual symbol | various |
| **Spinner** | Loading state | small, default, large |
| **Divider** | Visual separation | horizontal, vertical |

### Atom Specification Template

```markdown
## Button

### Purpose
Trigger actions and submit forms.

### Variants

| Variant | Usage |
|---------|-------|
| Primary | Main CTA, one per view |
| Secondary | Alternative actions |
| Ghost | Tertiary actions, less emphasis |
| Destructive | Delete, remove, dangerous actions |

### Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| sm | 32px | 12px 16px | 14px |
| md | 40px | 12px 20px | 14px |
| lg | 48px | 16px 24px | 16px |

### States

- Default
- Hover
- Active/Pressed
- Focus (with ring)
- Disabled
- Loading

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'primary' \| 'secondary' \| 'ghost' \| 'destructive' | 'primary' | Visual style |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Size variant |
| disabled | boolean | false | Disabled state |
| loading | boolean | false | Shows spinner |
| icon | ReactNode | - | Icon element |
| iconPosition | 'left' \| 'right' | 'left' | Icon placement |

### Guidelines

✅ **Do:**
- Use one primary button per view
- Use verbs for labels ("Save", "Submit", "Delete")
- Provide loading state for async actions

❌ **Don't:**
- Use multiple primary buttons together
- Use vague labels ("Click here", "OK")
- Disable without explanation
```

---

## Molecules

**Definition:** Functional groups of atoms working together.

### Core Molecules

| Molecule | Composition | Purpose |
|----------|-------------|---------|
| **Form Field** | Label + Input + Helper/Error | Labeled input with validation |
| **Search Bar** | Input + Button/Icon | Search functionality |
| **Card** | Container + Content areas | Content grouping |
| **Nav Item** | Icon + Label + Badge | Navigation element |
| **Menu Item** | Icon + Label + Shortcut | Dropdown/menu option |
| **List Item** | Avatar + Content + Action | List row |
| **Stat Card** | Label + Value + Trend | Data display |
| **Alert** | Icon + Message + Action | Notifications |
| **Toast** | Icon + Message + Dismiss | Temporary notification |
| **Tooltip** | Trigger + Content | Contextual help |

### Molecule Specification Template

```markdown
## Form Field

### Purpose
Combine label, input, and helper text for form entries.

### Anatomy

```
┌─────────────────────────────┐
│ Label            (optional) │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Input                   │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Helper text / Error message │
└─────────────────────────────┘
```

### Variants

| Variant | Usage |
|---------|-------|
| Default | Standard form input |
| With icon | Input with leading/trailing icon |
| With addon | Input with button or text addon |

### States

- Default
- Focus
- Filled
- Error
- Disabled
- Read-only

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Field label |
| placeholder | string | - | Input placeholder |
| helperText | string | - | Helper message below |
| error | string | - | Error message (shows error state) |
| required | boolean | false | Shows required indicator |
| disabled | boolean | false | Disabled state |

### Spacing

- Label → Input: 8px
- Input → Helper: 8px
- Between fields: 16px

### Guidelines

✅ **Do:**
- Always include labels (not just placeholders)
- Show error messages inline below the field
- Mark required fields clearly

❌ **Don't:**
- Use placeholder as the only label
- Show errors only on submit
- Use red for helper text (reserve for errors)
```

---

## Organisms

**Definition:** Self-contained sections composed of molecules and atoms.

### Core Organisms

| Organism | Purpose |
|----------|---------|
| **Header** | Site/app navigation |
| **Sidebar** | Vertical navigation |
| **Modal/Dialog** | Focused overlay content |
| **Drawer** | Slide-out panel |
| **Data Table** | Tabular data display |
| **Form** | Complete form with fields |
| **Card Grid** | Grid of cards |
| **Hero Section** | Landing page hero |
| **Footer** | Site footer |
| **Command Palette** | Quick actions search |

### Organism Specification Template

```markdown
## Modal

### Purpose
Display focused content in an overlay, blocking the background.

### Anatomy

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │ Header                    X │ │
│ ├─────────────────────────────┤ │
│ │                             │ │
│ │ Content                     │ │
│ │                             │ │
│ ├─────────────────────────────┤ │
│ │ Footer (actions)            │ │
│ └─────────────────────────────┘ │
│         (backdrop)              │
└─────────────────────────────────┘
```

### Variants

| Variant | Width | Usage |
|---------|-------|-------|
| sm | 400px | Simple confirmations |
| md | 500px | Standard forms |
| lg | 600px | Complex content |
| xl | 800px | Large forms, previews |
| full | 90vw | Immersive content |

### Parts

| Part | Required | Description |
|------|----------|-------------|
| Header | Yes | Title + close button |
| Content | Yes | Main body |
| Footer | No | Action buttons |
| Backdrop | Yes | Overlay behind modal |

### Behavior

- Opens with fade + scale animation
- Closes on: X button, backdrop click, Escape key
- Traps focus inside modal
- Returns focus to trigger on close
- Prevents body scroll when open

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| open | boolean | false | Controls visibility |
| onClose | function | - | Close handler |
| title | string | - | Header title |
| size | 'sm' \| 'md' \| 'lg' \| 'xl' | 'md' | Width variant |
| closeOnBackdrop | boolean | true | Close on backdrop click |
| closeOnEscape | boolean | true | Close on Escape key |

### Accessibility

- Role: dialog
- aria-modal: true
- aria-labelledby: points to title
- Focus trap active when open
- Escape closes modal

### Guidelines

✅ **Do:**
- Use for focused tasks requiring attention
- Provide clear close mechanisms
- Keep content concise

❌ **Don't:**
- Nest modals inside modals
- Use for simple notifications (use toast)
- Block critical information
```

---

## Templates

**Definition:** Page-level layouts defining content structure.

### Core Templates

| Template | Usage |
|----------|-------|
| **Dashboard** | App main view with sidebar |
| **Auth** | Login, signup, reset password |
| **Settings** | Settings pages with navigation |
| **Marketing** | Landing pages, marketing |
| **Error** | 404, 500, error pages |
| **Empty State** | No content placeholder |

### Template Specification

```markdown
## Dashboard Layout

### Structure

```
┌──────────────────────────────────────────┐
│ Header (fixed)                           │
├──────────┬───────────────────────────────┤
│          │                               │
│ Sidebar  │ Main Content                  │
│ (fixed)  │ (scrollable)                  │
│          │                               │
│          │                               │
└──────────┴───────────────────────────────┘
```

### Responsive Behavior

| Breakpoint | Sidebar | Header |
|------------|---------|--------|
| Desktop (>1024px) | Visible, fixed | Full width |
| Tablet (768-1024px) | Collapsible | Full width |
| Mobile (<768px) | Hidden, drawer | Hamburger menu |

### Slots

| Slot | Content |
|------|---------|
| Header | Logo, search, user menu |
| Sidebar | Navigation items |
| Main | Page content |

### Spacing

- Sidebar width: 240px (desktop), 64px (collapsed)
- Header height: 64px
- Main padding: 24px (desktop), 16px (mobile)
```

---

## Component Inventory

Track what's included in the system:

### Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Complete | Fully specced and implemented |
| 🚧 In Progress | Being worked on |
| 📋 Planned | On the roadmap |
| ❌ Not Planned | Explicitly out of scope |

### Inventory Table

| Component | Type | Status | Priority |
|-----------|------|--------|----------|
| Button | Atom | ✅ | P0 |
| Input | Atom | ✅ | P0 |
| Select | Atom | 🚧 | P0 |
| Checkbox | Atom | 📋 | P1 |
| Form Field | Molecule | ✅ | P0 |
| Card | Molecule | ✅ | P0 |
| Modal | Organism | 🚧 | P1 |
| Data Table | Organism | 📋 | P2 |
| Dashboard Layout | Template | 📋 | P1 |

---

## Component Documentation Checklist

For each component, document:

- [ ] Purpose (one sentence)
- [ ] Anatomy (visual breakdown)
- [ ] Variants (all visual options)
- [ ] Sizes (if applicable)
- [ ] States (all interactive states)
- [ ] Props/API (all parameters)
- [ ] Spacing (internal and external)
- [ ] Accessibility (roles, aria, keyboard)
- [ ] Guidelines (do/don't)
- [ ] Code example

---

## Next Step

Once components are defined → Move to **documentation.md** for usage guidelines and exports.
