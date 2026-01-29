# Discovery Framework

Collect all necessary inputs before generating a design system.

---

## Quick Discovery (5 questions)

For fast projects, ask these essentials:

1. **Brand colors?** — Existing colors or starting from scratch?
2. **Product type?** — SaaS, app, e-commerce, dashboard, marketing site?
3. **Personality?** — 3 adjectives (e.g., professional, bold, friendly)
4. **Tech stack?** — React, Vue, vanilla CSS, Tailwind?
5. **Dark mode?** — Required, optional, or not needed?

---

## Full Discovery

### Brand & Identity

| Question | Why It Matters |
|----------|----------------|
| Do you have existing brand colors? | Defines if we adapt or create |
| Logo and visual assets? | Extracts color/style cues |
| Brand personality in 3-5 words? | Guides tone of the system |
| Competitors to differentiate from? | Avoids looking like them |
| Any colors to avoid? | Prevents brand conflicts |

**Output needed:**
- Primary color (or direction)
- Secondary color (optional)
- Personality keywords
- Anti-references (what NOT to look like)

### Product & Users

| Question | Why It Matters |
|----------|----------------|
| What type of product? | Dashboard vs marketing = different needs |
| Who are the users? | B2B = professional, B2C = approachable |
| Primary user action? | Defines what needs most emphasis |
| Mobile-first or desktop-first? | Affects spacing, touch targets |
| Content-heavy or action-heavy? | Typography vs components focus |

**Output needed:**
- Product category
- User profile
- Primary CTA type
- Device priority

### Technical Constraints

| Question | Why It Matters |
|----------|----------------|
| Tech stack? | Export format (Tailwind, CSS, etc.) |
| Existing codebase? | Integration constraints |
| Accessibility level? | WCAG AA, AAA, or basic |
| Dark mode required? | Doubles color work |
| Design tool? | Figma tokens, Sketch, etc. |

**Output needed:**
- Export formats required
- Accessibility standard
- Dark mode yes/no
- Integration notes

### Team & Scale

| Question | Why It Matters |
|----------|----------------|
| Team size (designers + devs)? | Documentation depth |
| Skill level? | How detailed guidelines need to be |
| Who maintains the system? | Ownership model |
| How often will it evolve? | Versioning needs |

**Output needed:**
- Documentation level (basic/detailed)
- Maintenance owner

---

## Discovery Summary Template

After collecting inputs, summarize:

```markdown
## Design System Brief

**Client:** [Name]
**Date:** [Date]

### Brand
- **Primary color:** [#hex or "to define"]
- **Secondary color:** [#hex or "none"]
- **Personality:** [adjective], [adjective], [adjective]
- **Avoid:** [competitors, colors, styles to avoid]

### Product
- **Type:** [SaaS / App / E-commerce / Dashboard / Marketing]
- **Users:** [B2B / B2C / Internal] — [description]
- **Primary action:** [Sign up / Purchase / Create / etc.]
- **Device priority:** [Mobile-first / Desktop-first / Equal]

### Technical
- **Stack:** [React + Tailwind / Vue / Vanilla / etc.]
- **Exports needed:** [CSS variables / Tailwind config / JSON / Figma]
- **Accessibility:** [WCAG AA / AAA / Basic]
- **Dark mode:** [Yes / No / Later]

### Team
- **Size:** [X designers, Y developers]
- **Documentation level:** [Basic / Detailed / Extensive]
- **Maintainer:** [Role or person]

### Notes
[Any specific requests, constraints, or context]
```

---

## Discovery Shortcuts

### "I don't have brand colors yet"

→ Ask for:
- Industry/category
- 3 personality words
- 2-3 reference sites they like
- Colors they hate

Then generate a palette proposal.

### "Just make it look modern"

→ Push back gently:
- "Modern can mean minimal (Apple) or bold (Stripe) or playful (Notion) — which direction?"
- Show 3 quick references, ask which resonates

### "Copy [competitor]"

→ Redirect:
- "Let's use [competitor] as a starting point but differentiate on [X]"
- Identify what specifically they like (colors? spacing? vibe?)

### "We need everything"

→ Prioritize:
- "Let's start with foundations (tokens) + 5 core components"
- Phase 2 can add more components
- Avoid scope creep

---

## Red Flags

Watch for these during discovery:

| Red Flag | Risk | Response |
|----------|------|----------|
| No clear brand direction | System will feel generic | Push for personality definition |
| "We'll figure it out later" | Rework guaranteed | Lock in foundations first |
| Too many stakeholders | Decision paralysis | Identify single decision-maker |
| "Make it pop" | Vague feedback loop | Get specific references |
| No tech constraints given | Wrong export format | Confirm stack before starting |

---

## Next Step

Once discovery is complete → Move to **tokens.md** to define foundations.
