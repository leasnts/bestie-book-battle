# Motion & Interactivity — Santos Studio

**CRITICAL:** All Santos Studio components must feel ALIVE and responsive. Static UIs are dead UIs.

## Philosophy

**"Vivant raisonnablement"** — Motion has purpose. Every animation should enhance understanding, provide feedback, or create delight — never decoration.

**One well-orchestrated experience beats scattered animations everywhere.** Focus on high-impact moments.

---

## The Eight Interactive States

Every interactive element needs ALL of these designed:

| State | When | Visual Treatment |
|-------|------|------------------|
| **Default** | At rest | Base styling |
| **Hover** | Pointer over (desktop only) | Scale, shadow, color shift |
| **Focus-visible** | Keyboard focus | Visible ring (NOT on mouse click) |
| **Active** | Being pressed | Pressed-in, darker |
| **Disabled** | Not interactive | 50% opacity, no pointer events |
| **Loading** | Processing async action | Spinner or skeleton inside |
| **Error** | Invalid state | Red border + icon + message |
| **Success** | Completed action | Green check + confirmation |

**The common miss:** Designing hover without focus-visible, or vice versa. Keyboard users NEVER see hover states.

```css
/* ✅ Focus-visible — keyboard users only */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
/* Mouse/touch users don't see the ring */

/* ❌ NEVER do this */
button:focus { outline: none; } /* Accessibility violation */
```

---

## Timing

| Duration | Use Case | Examples |
|----------|----------|---------|
| **100-150ms** | Instant feedback | Button press, toggle, color change |
| **200-300ms** | State changes | Menu open, tooltip, hover effects |
| **300-500ms** | Layout changes | Accordion, modal, drawer |
| **500-800ms** | Entrance animations | Page load, hero reveals |

**Exit animations are FASTER than entrances** — use ~75% of enter duration.

**Rule:** Never exceed 600ms for UI feedback (feels sluggish).

---

## Easing Curves (USE THESE, not CSS defaults)

**Don't use `ease`.** It's a compromise that's rarely optimal.

```css
/* ✅ RECOMMENDED — Natural deceleration */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);    /* Smooth, refined (DEFAULT) */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);   /* Slightly snappier */
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);    /* Confident, decisive */

/* For exits */
--ease-in-quart: cubic-bezier(0.5, 0, 0.75, 0);     /* Elements leaving */

/* For toggles (there → back) */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

**❌ NEVER use bounce or elastic curves.** They were trendy in 2015 but feel dated and tacky. Real objects don't bounce when they stop — they decelerate smoothly.

```css
/* ❌ Dated, tacky — NEVER USE */
/* bounce: cubic-bezier(0.34, 1.56, 0.64, 1); */
/* elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6); */
```

---

## Performance: The Two Properties Rule

**Only animate `transform` and `opacity`.** Everything else triggers layout recalculation and kills performance.

```css
/* ✅ GPU-accelerated, smooth */
transform: scale(1.02);
transform: translateY(-4px);
opacity: 0.8;

/* ❌ Causes layout thrashing */
width: 200px;
height: auto;
padding: 20px;
margin-top: 8px;
top: 50px;
```

**For height animations** (accordions), use `grid-template-rows: 0fr → 1fr` instead of animating `height` directly.

Use `will-change` sparingly — only when animation is imminent (`:hover`, `.animating`), not preemptively.

---

## Reduced Motion (NON-NEGOTIABLE)

Vestibular disorders affect ~35% of adults over 40. This is NOT optional.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**What to PRESERVE in reduced motion:** Progress bars, loading spinners (slowed), focus indicators — just without spatial movement.

**Better approach — crossfade instead of slide:**
```css
@media (prefers-reduced-motion: reduce) {
  .modal { animation: fade-in 200ms ease-out; } /* Instead of slide-up */
}
```

---

## Component Motion Patterns

### Buttons

```jsx
className="
  transition-all duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]
  hover:scale-[1.02] hover:shadow-lg
  active:scale-[0.98]
  focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
  disabled:opacity-50 disabled:pointer-events-none
"
```

Duration: 150ms. Scale: hover +2%, active -2%.

### Cards (Interactive)

```jsx
className="
  transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
  hover:-translate-y-1 hover:shadow-xl
  active:-translate-y-0.5
  cursor-pointer
"
```

Duration: 200ms. Lift: 4px on hover.

### Glassmorphism Cards

```jsx
className="
  backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl
  transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
  hover:bg-white/15 hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]
  active:-translate-y-0.5
  cursor-pointer
"
```

### Inputs

```jsx
className="
  transition-colors duration-200
  border border-gray-300
  focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20
  hover:border-gray-400
"
```

### Icon Buttons

```jsx
className="
  w-10 h-10 flex items-center justify-center rounded-lg
  transition-all duration-150
  hover:bg-gray-100 hover:scale-110
  active:scale-95
  focus-visible:ring-2 focus-visible:ring-offset-2
"
```

---

## Entrance Animations

### Page Load Choreography

Stagger element reveals for a polished entrance:

```css
.card { animation: slide-up 400ms ease-[cubic-bezier(0.25,1,0.5,1)] both; }
.card:nth-child(1) { animation-delay: 0ms; }
.card:nth-child(2) { animation-delay: 75ms; }
.card:nth-child(3) { animation-delay: 150ms; }

@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Cap total stagger time** — 10 items at 75ms = 750ms total. For many items, reduce per-item delay.

### Modals

```css
/* Enter: 250ms ease-out */
@keyframes modal-enter {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
/* Exit: 180ms ease-in (75% of enter) */
@keyframes modal-exit {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.95); }
}
```

### Bottom Sheets

```css
@keyframes sheet-enter {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.sheet { animation: sheet-enter 300ms cubic-bezier(0.25, 1, 0.5, 1); }
```

---

## Micro-Interactions

### Loading Spinner
```jsx
<div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500" />
```

### Skeleton Pulse
```jsx
<div className="animate-pulse bg-gray-200 rounded-lg h-20" />
```

### Success Check
```css
@keyframes check-pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
```

### Error Shake
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
.error { animation: shake 300ms cubic-bezier(0.25, 1, 0.5, 1); }
```

---

## Scroll-Triggered Animations

Use Intersection Observer, not scroll events:

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
      observer.unobserve(entry.target); // Animate once only
    }
  });
}, { threshold: 0.1 });
```

---

## Motion Tokens (CSS Custom Properties)

```css
:root {
  /* Durations */
  --duration-instant: 150ms;
  --duration-standard: 200ms;
  --duration-slow: 300ms;
  --duration-entrance: 400ms;

  /* Easing */
  --ease-default: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-exit: cubic-bezier(0.5, 0, 0.75, 0);
  --ease-toggle: cubic-bezier(0.65, 0, 0.35, 1);
}
```

---

## Quick Decision Tree

1. **Is it clickable?** → Add hover + active + focus-visible + disabled states
2. **Is it a button?** → Scale hover +2%, active -2%, 150ms, ease-out-quart
3. **Is it a card?** → Translate-y hover -4px, shadow increase, 200ms
4. **Is it an input?** → Border color + ring on focus-visible, 200ms
5. **Is it an icon?** → Background + scale hover +10%, 150ms
6. **Is it a modal?** → Fade + scale entrance 250ms, exit 180ms
7. **Is it purely decorative?** → Maybe subtle opacity change, or nothing

---

**Remember:** Santos Studio UIs feel ALIVE. Every interaction is smooth, responsive, and intentional.
