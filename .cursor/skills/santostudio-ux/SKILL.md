---
name: santostudio-ux
description: "Santos Studio UX framework: accessibility-first, mobile-first, 8-state interactions, error-first design, optimistic UI, smart forms, UX writing formulas. Use when designing user flows, responsive layouts, forms, feedback, navigation, or any user experience pattern."
---

# Santos Studio UX — Framework

User experience framework by Léa Santos for creating intuitive, accessible, and delightful digital products.

## Principles

1. **Mobile-first, always** — Design for constraints first, then expand. If it works on mobile, it works everywhere.
2. **Accessibility is not optional** — If it's not accessible, it's not finished. Period.
3. **Error-first design** — Design for failures BEFORE the happy path. The happy path is the easy part.
4. **Respect user time** — Every extra tap, scroll, or second of confusion is a failure.

## When to Use This Skill

Trigger when the user:
- Designs user flows, journeys, or multi-step processes
- Needs responsive layouts (web or app)
- Wants accessibility guidance (WCAG, screen readers, contrast)
- Creates forms, validation, or error handling
- Works on navigation, information architecture, or hierarchy
- Mentions "UX", "user experience", "usability", or "intuitive"
- Needs feedback patterns (loading, success, errors, empty states)
- Writes microcopy, button labels, error messages, or UI text
- Needs realistic content (no lorem ipsum)

**For visual design** (colors, spacing, effects, components): see `santostudio-ui`

## Structure

### Essentials (Foundations)
- `essentials/hierarchy.md` — Visual & content hierarchy, squint test, scanning patterns
- `essentials/accessibility.md` — WCAG, contrast, focus-visible, ARIA, pointer queries
- `essentials/responsive.md` — Mobile-first, breakpoints, safe areas, container queries
- `essentials/navigation.md` — Patterns, mental models, wayfinding
- `essentials/ux-writing.md` — Microcopy formulas, tone, realistic content

### Patterns (Interaction Recipes)
- `patterns/user-flows.md` — Happy path, edge cases, error recovery
- `patterns/forms.md` — 8-state inputs, validation, multi-step forms
- `patterns/feedback.md` — Optimistic UI, skeletons, errors, empty states
- `patterns/onboarding.md` — Progressive disclosure, first-run experience

## Quick Reference

```
HIERARCHY:     Squint test | F-pattern (text) | Z-pattern (marketing)
ACCESSIBILITY: 4.5:1 contrast | Focus-visible | Touch 44px | ARIA | Pointer queries
RESPONSIVE:    Mobile-first | 375→768→1024→1440px | Safe areas | Container queries
NAVIGATION:    Max 5±2 items | Consistent placement | Clear current state
INTERACTIONS:  8 states per element | Optimistic UI | Skeleton > spinner
FORMS:         Validate on blur | Errors below field | One primary CTA | Verb+object labels
UX WRITING:    No lorem ipsum | Button = verb+object | Error = what+why+fix
```

## Critical Rules

### The Eight Interactive States

Every interactive element needs ALL of these designed:

| State | When | Visual Treatment |
|-------|------|------------------|
| **Default** | At rest | Base styling |
| **Hover** | Pointer over (desktop only) | Subtle lift, color shift, shadow |
| **Focus-visible** | Keyboard focus | Visible ring (NOT on mouse click) |
| **Active** | Being pressed | Pressed-in, darker |
| **Disabled** | Not interactive | 50% opacity, no pointer events |
| **Loading** | Processing async action | Spinner inside, or skeleton |
| **Error** | Invalid state | Red border + icon + message |
| **Success** | Completed action | Green check + confirmation |

**The common miss:** designing hover without focus, or vice versa. Keyboard users NEVER see hover states.

```css
/* ✅ CORRECT — Focus-visible for keyboard only */
button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
/* Mouse/touch users don't see the ring */

/* ❌ WRONG — Never do this */
button:focus { outline: none; }  /* Accessibility violation */
```

### Accessibility (NON-NEGOTIABLE)

**Contrast:**
- 4.5:1 for normal text, 3:1 for large text (18px+) and UI elements
- Placeholder text STILL needs 4.5:1 (that light gray placeholder? Usually fails)
- ❌ Never gray text on colored backgrounds — use a darker shade of that color

**Focus:**
- Use `:focus-visible` (not `:focus`) to show focus only for keyboard users
- Focus ring: 2-3px thick, high contrast (3:1 against adjacent colors), offset from element
- Consistent across ALL interactive elements

**Touch targets:**
- 44x44px minimum on mobile (48px on Android)
- Small visual elements can have expanded touch areas via padding or `::before`:
```css
.icon-button { width: 24px; height: 24px; position: relative; }
.icon-button::before { content: ''; position: absolute; inset: -10px; } /* 44px touch */
```

**Semantic HTML:**
- Proper heading hierarchy (h1→h2→h3, never skip)
- `<button>` for actions, `<a>` for navigation
- Keyboard navigation: everything clickable must be focusable and keyboard-operable
- ❌ Never rely on color alone — add icons, text, patterns

**Input detection — NOT just screen size:**
```css
/* Fine pointer (mouse, trackpad) */
@media (pointer: fine) { .button { padding: 8px 16px; } }
/* Coarse pointer (touch) */
@media (pointer: coarse) { .button { padding: 12px 20px; } }
/* Device supports hover */
@media (hover: hover) { .card:hover { transform: translateY(-2px); } }
/* Device doesn't support hover */
@media (hover: none) { /* Use active instead */ }
```

### Responsive (MOBILE-FIRST)

**Breakpoints:** 375px → 768px → 1024px → 1440px
Write base styles for mobile, use `min-width` to layer complexity.

**Thumb zones:** Primary actions in bottom 1/3 of screen on mobile.

**Content priority:** Most important content first — it might be ALL users see.

**Safe areas (modern devices):**
```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
.footer { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
```
Enable viewport-fit: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`

**Container queries for components:**
```css
.card-container { container-type: inline-size; }
@container (min-width: 400px) {
  .card { grid-template-columns: 120px 1fr; }
}
```
A card in a narrow sidebar stays compact; the same card in main content expands — automatically.

❌ **NEVER hide critical features** in hamburger menus on mobile — adapt, don't amputate.

### Hierarchy

**The Squint Test:** Blur your eyes (or blur a screenshot). Can you identify: (1) the most important element, (2) the second most important, (3) clear groupings? If everything looks the same weight, you have a hierarchy problem.

**Hierarchy through multiple dimensions:**

| Tool | Strong | Weak |
|------|--------|------|
| Size | 3:1+ ratio | <2:1 ratio |
| Weight | Bold vs Regular | Medium vs Regular |
| Color | High contrast | Similar tones |
| Position | Top/left | Bottom/right |
| Space | Surrounded by whitespace | Crowded |

Best hierarchy uses 2-3 dimensions at once (larger AND bolder AND more space).

**Rules:**
- ✅ One primary action per screen — user should never wonder "what do I do?"
- ✅ Visual weight = importance
- ✅ Consistent patterns — same actions look the same everywhere
- ❌ Never have competing CTAs at the same visual weight
- ❌ Not every button should be primary — use ghost buttons, text links, secondary styles

### UX Writing Formulas

**Button labels — VERB + OBJECT:**

| ❌ Bad | ✅ Good |
|--------|---------|
| OK | Save changes |
| Submit | Create account |
| Yes / No | Delete message / Keep message |
| Cancel | Keep editing |
| Click here | Download PDF |

For destructive actions, name the destruction: "Delete 5 items" not "Delete selected"

**Error messages — WHAT + WHY + FIX:**

| Situation | Template |
|-----------|----------|
| Format error | "[Field] needs to be [format]. Example: [example]" |
| Missing required | "Please enter [what's missing]" |
| Permission denied | "You don't have access to [thing]. [What to do instead]" |
| Network error | "We couldn't reach [thing]. Check your connection and [action]." |
| Server error | "Something went wrong on our end. We're looking into it." |

- ❌ Never blame the user ("You entered an invalid date")
- ✅ Reframe: "Please enter a date in DD/MM/YYYY format"
- ❌ Never use humor for errors — users are already frustrated

**Empty states are OPPORTUNITIES:**
```
❌ "No items"
✅ "No projects yet. Create your first one to get started." [+ CTA button]
```
An empty state should: acknowledge briefly, explain the value of filling it, provide a clear action.

**Terminology consistency — pick one term and STICK WITH IT:**

| ❌ Inconsistent | ✅ Consistent |
|----------------|---------------|
| Delete / Remove / Trash | Delete |
| Settings / Preferences / Options | Settings |
| Sign in / Log in / Enter | Sign in |
| Create / Add / New | Create |

**No lorem ipsum. Ever.** Use realistic content that matches the actual use case. Realistic content reveals layout issues that placeholder text hides.

### Feedback Patterns

**Speed hierarchy:**
- < 100ms: Feels instant — no feedback needed beyond state change
- 100ms–1s: Show immediate acknowledgment (button state change, optimistic update)
- 1s–10s: Show progress (spinner, skeleton, progress bar)
- 10s+: Show progress + allow background + notify when done

**Optimistic UI > Spinners:**
Update the UI immediately, sync with server in background, rollback on failure. Use for low-stakes actions (likes, toggles, moves). Don't use for payments or destructive actions.

**Skeleton screens > Spinners:**
Skeletons preview content shape and feel faster than generic spinners. They set expectations for what's coming.

**Contextual errors — show errors WHERE they happened:**
- ✅ Inline errors below the field with `aria-describedby`
- ❌ Distant toasts that don't tell you WHICH field has the problem

**Recovery path:** Every error MUST tell users HOW to fix it.

### Forms

**Validation timing:** Validate on blur (when user leaves the field), NOT on every keystroke. Exception: password strength meters.

**Error placement:** Below the field, connected via `aria-describedby`.

**One primary CTA per form.** Secondary actions (cancel, reset) should be visually lighter.

**Labels are NOT placeholders.** Placeholders disappear on input. Always use visible `<label>` elements.

### Destructive Actions: Undo > Confirm

Confirmation dialogs are a design failure — users click through them mindlessly.

**Better pattern:**
1. Remove from UI immediately
2. Show undo toast (5-10 seconds)
3. Actually delete after toast expires

Use confirmation dialogs ONLY for: truly irreversible actions (account deletion), high-cost actions, batch operations.

When you must confirm: name the action, explain consequences, use specific button labels ("Delete project" / "Keep project", NOT "Yes" / "No").

## Santos Studio UX Principles

### The 5-Second Rule
Users should understand within 5 seconds of landing on any screen:
1. **Where they are** (clear page/section title)
2. **What they can do** (visible primary action)
3. **How to go back** (clear navigation)

### The Drunk User Test
If a slightly drunk person can't figure out your interface, it's too complicated. Design for: low attention, one-handed use, bright sunlight, noisy environments, distraction.

### Error-First Design
Before celebrating the happy path, design these states FIRST:
1. What if the API fails?
2. What if there's no data? (empty state)
3. What if the user makes a mistake? (validation)
4. What if they're offline? (offline state)
5. What if content is extremely long? (overflow)
6. What if content is missing? (null/undefined)

### Progressive Disclosure
Start simple, reveal sophistication through interaction:
- Basic options first, advanced behind expandable sections
- Hover states that reveal secondary actions
- "Show more" rather than overwhelming upfront

## Navigation

- Max 5±2 items in primary navigation
- Consistent placement across all screens
- Clear "current" state on active item
- Bottom tab bar for mobile apps (thumb-friendly)
- ❌ Never more than 3 levels of nesting

## Platform-Specific Guidance

### Web (Desktop + Tablet + Mobile)
- Responsive: 375px → 768px → 1024px → 1440px
- Navigation: top nav (desktop), hamburger or bottom nav (mobile)
- Container queries for component-level responsiveness
- Touch + mouse + keyboard considerations

### Native Mobile App
- Mobile only: 375px-428px width range
- Navigation: bottom tab bar (iOS/Android pattern)
- Native gestures: swipe back, pull to refresh, long press
- Respect platform conventions (iOS vs Android)
- Touch targets: 44px (iOS) / 48px (Android) minimum
- Haptic feedback on key interactions

---

For detailed implementation, consult the specific files in `essentials/` and `patterns/` folders.
For visual design (colors, spacing, effects, components), see `santostudio-ui`.
