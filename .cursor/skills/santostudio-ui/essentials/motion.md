# Motion & Interactivity - santostudio ui

**CRITICAL PRINCIPLE:** All Santos Studio components must feel ALIVE and responsive.

## Philosophy

**"Vivant raisonnablement"** - Components should be:
- ✅ **Responsive:** Immediate visual feedback on interaction
- ✅ **Smooth:** Transitions between states feel natural
- ✅ **Intentional:** Motion has purpose, not decoration
- ❌ **NOT static:** Fixed, unmoving UIs feel dead
- ❌ **NOT excessive:** Avoid distracting animations

**Inspiration:** Opal (smooth micro-interactions), Revolut (premium feel), Airbnb (polished responses)

---

## Mandatory Interactive States

### ALL Clickable Elements MUST Have

**1. Hover State**
- Visual change on mouse over
- Scale, shadow, background, or color change
- Duration: 150-200ms

**2. Active State**
- Visual change on click/press
- Usually slight reduction (scale-98)
- Duration: 100-150ms

**3. Focus State**
- Visible outline or ring for keyboard navigation
- Essential for accessibility
- Uses primary color

**4. Transition**
- Smooth animation between states
- No jarring instant changes
- Duration: 150-300ms

---

## Component-Specific Motion

### Buttons

**Required states:**
```jsx
<button className="
  /* Base */
  bg-blue-500 text-white
  px-4 py-3 rounded-xl
  
  /* Transition (REQUIRED) */
  transition-all duration-150 ease-out
  
  /* Hover (REQUIRED) */
  hover:scale-102
  hover:shadow-[0_6px_16px_rgba(59,130,246,0.4)]
  
  /* Active (REQUIRED) */
  active:scale-98
  active:shadow-[0_2px_6px_rgba(59,130,246,0.2)]
  
  /* Focus (REQUIRED for accessibility) */
  focus:outline-none
  focus:ring-3 focus:ring-blue-100
">
  Click Me
</button>
```

**Effect:**
- Hover: Button grows 2%, shadow increases
- Click: Button shrinks 2%, shadow decreases
- Focus: Blue ring appears (keyboard navigation)

**Duration:** 150ms (quick, responsive)

---

### Cards (Interactive)

**If card is clickable/hoverable:**

```jsx
<div className="
  /* Base */
  bg-white dark:bg-gray-800
  p-6 rounded-2xl
  border border-gray-200
  shadow-md
  
  /* Transition (REQUIRED) */
  transition-all duration-200 ease-out
  
  /* Hover (REQUIRED) */
  hover:-translate-y-1
  hover:shadow-xl
  hover:border-gray-300
  
  /* Active */
  active:-translate-y-0.5
  
  /* Cursor */
  cursor-pointer
">
  {/* Card content */}
</div>
```

**Effect:**
- Hover: Card lifts up 4px, shadow grows
- Click: Card slightly lowers (2px)
- Smooth elevation feel

**Duration:** 200ms (standard)

**Non-interactive cards** (no click action):
```jsx
className="
  transition-opacity duration-200
  hover:opacity-95
"
```

Subtle hover shows it's "alive" even if not clickable.

---

### Glassmorphism Cards

**On colored backgrounds, interactive glassmorphism cards:**

```jsx
<div className="
  /* Base glassmorphism */
  backdrop-blur-xl
  bg-white/10
  border border-white/20
  rounded-2xl p-6
  shadow-[0_8px_32px_rgba(0,0,0,0.1)]
  
  /* Transition (REQUIRED) */
  transition-all duration-200 ease-out
  
  /* Hover (REQUIRED) */
  hover:bg-white/15
  hover:-translate-y-1
  hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]
  
  /* Active */
  active:-translate-y-0.5
  
  /* Cursor */
  cursor-pointer
">
  {/* Content */}
</div>
```

**Effect:**
- Hover: Slightly more opaque, lifts, shadow increases
- Click: Slight reduction in elevation
- Premium, responsive feel

---

### Inputs

**Focus is CRITICAL for inputs:**

```jsx
<input className="
  /* Base */
  w-full px-5 py-4 rounded-2xl
  border border-gray-300
  bg-white
  
  /* Transition (REQUIRED) */
  transition-all duration-200
  
  /* Focus (REQUIRED) */
  focus:border-blue-500
  focus:outline-none
  focus:ring-3 focus:ring-blue-100
  
  /* Hover (optional but nice) */
  hover:border-gray-400
" />
```

**Effect:**
- Focus: Border turns primary color, ring appears
- Hover: Border slightly darkens
- Clear visual feedback

**Duration:** 200ms

---

### Icon Buttons

**Small interactive elements need clear hover:**

```jsx
<button className="
  /* Base */
  w-10 h-10
  flex items-center justify-center
  rounded-lg
  text-gray-600
  
  /* Transition (REQUIRED) */
  transition-all duration-150
  
  /* Hover (REQUIRED) */
  hover:bg-gray-100
  hover:text-gray-900
  hover:scale-110
  
  /* Active */
  active:scale-95
">
  <IconComponent />
</button>
```

**Effect:**
- Hover: Background appears, icon grows 10%, color darkens
- Click: Icon shrinks 5%
- Immediate tactile feedback

---

### Links

```jsx
<a className="
  text-blue-600
  transition-all duration-150
  hover:underline
  hover:text-blue-700
  active:text-blue-800
">
  Learn More
</a>
```

**Effect:**
- Hover: Underline appears, color darkens slightly
- Click: Color darkens more

---

### Modals & Bottom Sheets

**Enter animation:**
```css
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-enter {
  animation: modalEnter 200ms ease-out;
}
```

**Exit animation:**
```css
@keyframes modalExit {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

.modal-exit {
  animation: modalExit 150ms ease-in;
}
```

**Bottom sheet slide:**
```css
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.sheet-enter {
  animation: slideUp 300ms ease-out;
}
```

**Duration:** 200-300ms (slower for large elements)

---

## Transition Guidelines

### Duration Standards

| Element Type | Duration | Use Case |
|--------------|----------|----------|
| **Quick** | 100-150ms | Buttons, small icons, instant feedback |
| **Standard** | 200ms | Cards, inputs, most interactions |
| **Slow** | 300ms | Modals, page transitions, large movements |

**Rule:** Never exceed 400ms (feels sluggish)

### Easing Functions

**ease-out (default):**
```css
transition: all 200ms ease-out;
```
- Natural deceleration
- Use for: entrances, hover states, expansions

**ease-in:**
```css
transition: all 150ms ease-in;
```
- Acceleration
- Use for: exits, closing animations

**ease-in-out:**
```css
transition: all 200ms ease-in-out;
```
- Symmetrical
- Use for: two-way transforms, toggles

---

## Transform Guidelines

### Scale

**Hover enlargement:**
```css
hover:scale-102  /* Buttons, standard */
hover:scale-105  /* Icons, small elements */
hover:scale-110  /* Tiny icons (16px) */
```

**Active reduction:**
```css
active:scale-98  /* Buttons */
active:scale-95  /* Icons */
```

**Rule:** Never scale above 110% (looks exaggerated)

### Translate (Elevation)

**Hover lift (cards):**
```css
hover:-translate-y-1   /* 4px lift, subtle */
hover:-translate-y-2   /* 8px lift, pronounced */
```

**Active press:**
```css
active:-translate-y-0.5  /* 2px, subtle press */
```

**Bottom sheets:**
```css
/* Enter from bottom */
from: translateY(100%)
to: translateY(0)
```

---

## Micro-Interactions

### Loading States

**Spinner:**
```jsx
<div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500" />
```

**Pulse (subtle):**
```jsx
<div className="animate-pulse bg-gray-200 rounded-lg h-20" />
```

### Success/Error Feedback

**Success check animation:**
```css
@keyframes checkPop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.check-appear {
  animation: checkPop 300ms ease-out;
}
```

**Error shake:**
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.error-shake {
  animation: shake 300ms ease-in-out;
}
```

### Progress Indicators

**Indeterminate bar:**
```css
@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-bar {
  animation: indeterminate 1.5s ease-in-out infinite;
}
```

---

## Best Practices

### Do's ✅

- **Always add transitions** to interactive elements (150-300ms)
- **Always add hover states** to clickable elements
- **Use scale for buttons** (subtle, 102-105%)
- **Use translate for cards** (elevation effect)
- **Add focus rings** for accessibility
- **Keep animations smooth** (ease-out for most cases)
- **Use 200ms as default** transition duration
- **Test on mobile** (hover doesn't exist, focus on tap feedback)

### Don'ts ❌

- **Never create static buttons** (no hover = feels broken)
- **Never use instant changes** (always transition)
- **Don't overdo scale** (max 110%)
- **Don't use long durations** (> 400ms feels slow)
- **Don't animate too many properties** (all is fine for simple elements)
- **Don't forget active states** (click feedback is essential)
- **Don't skip focus states** (accessibility!)

---

## Real-World Examples

### Opal-Style Stat Card

```jsx
<div className="
  backdrop-blur-xl
  bg-white/10
  border border-white/20
  rounded-xl p-4
  
  transition-all duration-200 ease-out
  hover:bg-white/15 hover:-translate-y-0.5 hover:shadow-xl
  cursor-pointer
">
  <p className="text-3xl font-bold text-white">2,847</p>
  <p className="text-xs text-white/50 uppercase tracking-wide mt-1">
    Total Views
  </p>
</div>
```

### Airbnb-Style Image Card

```jsx
<div className="
  bg-white rounded-2xl
  border border-gray-200
  shadow-md
  overflow-hidden
  
  transition-all duration-200 ease-out
  hover:-translate-y-1 hover:shadow-xl hover:border-gray-300
  cursor-pointer
">
  <img src="/property.jpg" className="w-full h-48 object-cover" />
  <div className="p-4">
    <h3 className="font-bold text-lg">Apartment in Center City</h3>
    <p className="text-gray-600 text-sm mt-1">$228 for 2 nights</p>
  </div>
</div>
```

### Revolut-Style Button

```jsx
<button className="
  w-full
  bg-blue-500 text-white
  px-6 py-4 rounded-2xl
  font-semibold
  shadow-[0_4px_12px_rgba(59,130,246,0.3)]
  
  transition-all duration-150 ease-out
  hover:scale-102 hover:shadow-[0_6px_16px_rgba(59,130,246,0.4)]
  active:scale-98
  focus:outline-none focus:ring-3 focus:ring-blue-100
">
  View Full Report
</button>
```

---

## Quick Decision Tree

**Question: What motion should this element have?**

1. **Is it clickable?** → Add hover + active + focus states
2. **Is it a button?** → Scale on hover (102%), scale down on active (98%)
3. **Is it a card?** → Translate up on hover (-translate-y-1), shadow increase
4. **Is it an input?** → Border color + ring on focus
5. **Is it an icon?** → Background + scale on hover (110%)
6. **Is it a modal?** → Fade + scale animation on enter/exit
7. **Is it purely decorative?** → Subtle opacity change on hover (if any)

**Still unsure?** Add `transition-all duration-200 hover:opacity-90` — works 70% of the time.

---

**Remember:** Santos Studio UIs feel ALIVE. Every interaction should be smooth, responsive, and intentional. Static = dead.
