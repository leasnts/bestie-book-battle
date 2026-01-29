---
name: santostudio-ux
description: "Apply UX best practices with Léa Santos' philosophy - accessibility, responsive mobile-first, user flows, hierarchy, and feedback patterns that create intuitive, inclusive experiences"
---

# Santos Studio UX

User experience framework by Léa Santos (Santos Studio) for creating intuitive, accessible, and delightful digital products.

## Philosophy

**"Beautiful AND Functional"** — Great UX is invisible. Users should never think about how to use your product.

Core beliefs:
- **Mobile-first, always** — Design for constraints first, then expand
- **Accessibility is not optional** — If it's not accessible, it's not finished
- **Guide, don't confuse** — Clear hierarchy and feedback at every step
- **Anticipate failure** — Design for errors, edge cases, and empty states BEFORE the happy path feels done
- **Respect user time** — Every extra tap, scroll, or second of confusion is a failure

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
- Wants realistic content instead of lorem ipsum
- Needs help with tone, voice, or UX writing

## Structure

This skill is organized in two parts:

### 📐 Essentials (Foundational UX Knowledge)
Core UX principles that apply to ALL projects:
- `essentials/hierarchy.md` — Visual & content hierarchy, scanning patterns
- `essentials/accessibility.md` — WCAG guidelines, contrast, screen readers, motor
- `essentials/responsive.md` — Mobile-first approach, breakpoints, touch targets
- `essentials/navigation.md` — Patterns, mental models, wayfinding
- `essentials/ux-writing.md` — Microcopy, tone, realistic content, no lorem ipsum

### 🔄 Patterns (Interaction Recipes)
Specific UX patterns and flows:
- `patterns/user-flows.md` — Happy path, edge cases, error recovery
- `patterns/forms.md` — Validation, inline errors, multi-step forms
- `patterns/feedback.md` — Loading, success, errors, empty states
- `patterns/onboarding.md` — Progressive disclosure, first-run experience

## Quick Reference

```
HIERARCHY:    F-pattern (text) | Z-pattern (marketing) | Visual weight guides attention
ACCESSIBILITY: 4.5:1 contrast (text) | 3:1 (large/UI) | Focus visible | Alt text | ARIA
RESPONSIVE:   Mobile-first | 375px → 768px → 1024px → 1440px | Touch targets 44px min
NAVIGATION:   Max 5±2 items | Consistent placement | Clear current state
FEEDBACK:     Immediate (<100ms perceived) | Skeleton loaders | Contextual errors
FORMS:        Inline validation on blur | Error ABOVE field | One primary CTA
UX WRITING:   Human tone | No lorem ipsum | Specific > generic | Match user context
```

## Critical Rules

### Accessibility (NON-NEGOTIABLE)
- ✅ **Color contrast:** 4.5:1 for normal text, 3:1 for large text (18px+) and UI elements
- ✅ **Focus states:** Visible on ALL interactive elements (never `outline: none` without replacement)
- ✅ **Touch targets:** Minimum 44x44px on mobile
- ✅ **Alt text:** Descriptive for content images, empty (`alt=""`) for decorative
- ✅ **Semantic HTML:** Use proper heading hierarchy (h1→h2→h3), buttons for actions, links for navigation
- ✅ **Keyboard navigation:** Everything clickable must be focusable and operable via keyboard
- ❌ **NEVER rely on color alone** to convey information (add icons, text, patterns)

### Responsive (MOBILE-FIRST)
- ✅ **Design for 375px first**, then scale up
- ✅ **Touch targets:** 44px minimum height/width on mobile
- ✅ **Thumb zones:** Primary actions in bottom 1/3 of screen on mobile
- ✅ **Content priority:** Most important content first (it might be all users see)
- ❌ **NEVER hide critical features** in hamburger menus on mobile

### Hierarchy
- ✅ **One primary action per screen** — User should never wonder "what do I do?"
- ✅ **Visual weight = importance** — Size, color, contrast, whitespace all communicate priority
- ✅ **Consistent patterns** — Same actions should look the same everywhere
- ❌ **NEVER have competing CTAs** at the same visual weight

### Feedback
- ✅ **Immediate acknowledgment** — Something should happen within 100ms of any action
- ✅ **Progress indication** — For anything >1 second, show loading state
- ✅ **Contextual errors** — Show errors WHERE they happened, not in a distant toast
- ✅ **Recovery path** — Every error must tell users HOW to fix it
- ❌ **NEVER use only red for errors** — Add icons and text for colorblind users

## Santos Studio UX Principles

### The "5-Second Rule"
Users should understand:
1. **Where they are** (clear page/section title)
2. **What they can do** (visible primary action)
3. **How to go back** (clear navigation)

...within 5 seconds of landing on any screen.

### The "Drunk User Test"
If a slightly drunk person can't figure out your interface, it's too complicated. Design for:
- Low attention
- One-handed use
- Imperfect conditions (bright sunlight, noisy environment, distraction)

### Error-First Design
Before celebrating the happy path:
1. What if the API fails?
2. What if there's no data?
3. What if the user makes a mistake?
4. What if they're offline?

**Design these states FIRST.** The happy path is the easy part.

## Platform-Specific Guidance

### Web (Desktop + Tablet + Mobile)
- Responsive: 375px → 768px → 1024px → 1440px
- Navigation: Top nav (desktop), hamburger or bottom nav (mobile)
- Touch + mouse considerations

### Native Mobile App (iOS)
- Mobile only: Design for 375px-428px width range
- Navigation: Bottom tab bar (iOS pattern)
- Native gestures: Swipe back, pull to refresh, long press
- Respect iOS platform conventions

---

For detailed implementation, consult the specific files in `essentials/` and `patterns/` folders.
