# Santos Studio — Skills Guide

## What's Inside

Two core skills that work together:

| Skill | Role | Triggers On |
|-------|------|------------|
| **santostudio-ui** | Visual design system — spacing, colors, typography, effects, motion, components | "create a button", "style this", "make it look good", "design system" |
| **santostudio-ux** | UX framework — accessibility, responsive, forms, feedback, navigation, writing | "user flow", "make it accessible", "error handling", "responsive" |

They cross-reference each other. Use both for any serious UI work.

---

## Combos

### Combo A — Web Interface (most common)
```
Skills: santostudio-ui + santostudio-ux
Use:    Any web UI — landing page, dashboard, web app, component library
```

### Combo B — Mobile App (React Native / Expo)
```
Skills: santostudio-ui + santostudio-ux + react-native-skills (Vercel)
Use:    React Native / Expo apps
Why:    RN skills add FlashList, Reanimated, native navigator patterns
        Santos Studio adds design quality on top
```

### Combo C — Figma to Code
```
Skills: santostudio-ui + santostudio-ux + implement-design (Figma MCP)
Use:    Converting a Figma mockup to pixel-perfect code
Needs:  Figma MCP server connected
```

### Combo D — Design Review / Audit
```
Skills: santostudio-ui + santostudio-ux
Use:    "Review my UI", "audit the design", "check accessibility"
How:    Use the AI Slop Test (in santostudio-ui) + accessibility rules (in santostudio-ux)
```

### Combo E — Client Custom (service tier)
```
Skills: santostudio-ui + santostudio-ux + [client-design-system]
Use:    Custom project with specific brand tokens
How:    Client skill overrides santostudio-ui tokens where needed
        (see SmarTeen skill as example of cascade pattern)
```

---

## What Was Absorbed From Third-Party Skills

These skills were analyzed and their best techniques integrated into santostudio:

### From Impeccable Style (impeccable.style)
**Integrated into santostudio-ui:**
- Context Gathering Protocol (ask for audience/brand BEFORE designing)
- AI Slop Test with specific fingerprints checklist
- OKLCH color space for perceptually uniform palettes
- Tinted neutrals (never pure gray — add 0.01 chroma of brand hue)
- Professional easing curves: ease-out-quart/quint/expo (not bounce/elastic)
- "Don't wrap everything in cards" / "Don't nest cards in cards"
- Fluid typography with clamp() for web headings
- Font loading strategy (font-display: swap)
- Alpha transparency as design smell warning
- Expanded anti-patterns list

**Integrated into santostudio-ux:**
- Eight Interactive States model (default, hover, focus-visible, active, disabled, loading, error, success)
- Focus-visible vs focus (keyboard-only focus rings)
- Pointer/hover media queries (input detection, not just screen size)
- Safe areas with env() for modern devices
- Container queries for component-level responsiveness
- Button label formula: verb + object
- Error message formula: what + why + fix
- Empty states as onboarding opportunities
- Undo > confirm for destructive actions
- Optimistic UI > spinners
- Skeleton screens > spinners
- Expanded form validation patterns

### From Impeccable Action Skills (audit, polish, animate, bolder, critique)
**Techniques absorbed:**
- "Anti-Patterns Verdict" as first check in any review
- Systematic polish checklist approach
- Warning that "bolder" ≠ more AI effects
- Timing/easing reference table with specific cubic-bezier values
- Reduced motion as NON-NEGOTIABLE requirement
- "Only animate transform and opacity" rule
- Exit animations faster than entrance (75% duration)

### From OP Agent / Odisei Project
**Techniques absorbed:**
- Semantic color tokens (`--color-primary`) vs raw hex values
- Component tier concept (atoms → molecules → templates)
- Zero-mock rule principle for reusable components

### From React Native Skills (Vercel)
**Not integrated directly** (stays as separate combo skill), but informed:
- GPU-only animation properties reinforced in motion rules
- Touch target sizes (44px iOS / 48px Android) added to UX

### From Composition Patterns (Vercel)
**Techniques absorbed:**
- "Avoid boolean props, use composition" principle referenced in component design
- Compound component pattern awareness

### From SuperDesign
**Technique absorbed:**
- Concept of "faithful reproduction" before iteration — understand what exists before changing it

### From Web Design Guidelines (Vercel)
**Not integrated** (stays as separate audit tool) — it fetches fresh rules at runtime

### From Figma MCP Skills
**Not integrated** (stays as separate Figma workflow) — requires MCP connection

---

## What Was NOT Integrated (and why)

| Source | What | Why Not |
|--------|------|---------|
| SmarTeen design system | Client-specific tokens (Sky/Pink, Helvetica Neue, dark-only) | That's a service-tier deliverable, not the generic product |
| OP Agent full config | GSD workflow, BMAD agents, project planning | That's Odisei's project structure, not a design skill |
| Impeccable teach-impeccable | Their onboarding flow reads `.impeccable.md` | Specific to their product ecosystem |
| agent-skills-master utilities | git, github, tmux, convex, workflow | Not design-related |

---

## Cascade Pattern (for client projects)

When building for a specific client, skills form a priority cascade:

```
Priority 1 → Client Design System (e.g., smarteen-design-system)
             Specific tokens, colors, fonts, component overrides
             ALWAYS TAKES PRECEDENCE on conflicts

Priority 2 → santostudio-ux
             UX patterns, accessibility, forms, feedback
             FULLY COMPATIBLE — no conflicts expected

Priority 3 → santostudio-ui
             General visual philosophy, craft principles
             Client skill may override specific values
             (radius, fonts, glassmorphism recipe, etc.)
```

Document specific overrides in the client skill's SKILL.md (see SmarTeen skill as reference).
