# Feedback Patterns

Communicating system status to users at every moment.

## Core Principle

**Users should never wonder "did it work?"** Every action needs acknowledgment. Silence creates anxiety and broken mental models.

## Response Time Thresholds

| Duration | User Perception | Required Feedback |
|----------|-----------------|-------------------|
| 0-100ms | Instant | None (perceived as immediate) |
| 100-300ms | Slight delay | Subtle transition/animation |
| 300ms-1s | Noticeable wait | Spinner or simple indicator |
| 1-10s | Long wait | Progress indicator + context |
| 10s+ | Very long | Progress bar + time estimate + cancel option |

---

## Loading States

### Spinner (Short Waits: 300ms-3s)

Use for:
- Button submissions
- Quick data fetches
- Simple operations

```
┌─────────────────────────────┐
│                             │
│           ◌                 │
│       Loading...            │
│                             │
└─────────────────────────────┘
```

**Rules:**
- Delay spinner appearance by 300ms (avoid flash for fast loads)
- Center in the area being loaded
- Keep simple (no elaborate animations)

### Skeleton Screens (Medium Waits: 1-5s)

Use for:
- Page loads
- List/card loading
- Content-heavy areas

```
┌─────────────────────────────┐
│ ░░░░░░░░░░░░░                │  ← Title placeholder
│                             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░        │  ← Content placeholder
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                             │
│ ░░░░░░  ░░░░░               │  ← Buttons placeholder
└─────────────────────────────┘
```

**Rules:**
- Match the layout of actual content
- Animate with subtle pulse (shows activity)
- Replace progressively as content loads

**Implementation:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    #e5e7eb 0%,
    #f3f4f6 50%,
    #e5e7eb 100%
  );
  background-size: 200% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
}

@keyframes skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Progress Bar (Long Waits: 5s+)

Use for:
- File uploads
- Complex processing
- Multi-step operations

```
Uploading document...

[████████████░░░░░░░░░] 65%

2.4 MB of 3.7 MB • About 12 seconds remaining

[Cancel]
```

**Rules:**
- Show percentage or step progress
- Estimate time remaining (if possible)
- Always allow cancel for long operations

### Optimistic UI

For fast, reliable operations, update UI immediately before server confirmation.

```
User clicks "Like":
1. Instantly show liked state (heart fills)
2. Send request to server in background
3. If fails: revert UI + show error

User doesn't wait, feels instant.
```

**Use when:**
- Operation almost always succeeds (>99%)
- Action is reversible
- Failure handling is graceful

---

## Success States

### Inline Confirmation (Momentary)

For quick actions, brief inline feedback:

```
[Save]
  ↓ click
[✓ Saved]  ← Shows for 2 seconds, then back to [Save]
```

### Toast Notification (Non-Blocking)

For actions that complete while user continues:

```
┌───────────────────────────────────────┐
│                                       │
│              Page Content             │
│                                       │
└───────────────────────────────────────┘

┌─────────────────────────────┐
│ ✓ Email sent successfully   │  ← Toast (auto-dismiss 4s)
└─────────────────────────────┘
```

**Rules:**
- Position: bottom-left or top-right
- Auto-dismiss: 3-5 seconds
- Include action if relevant: `Email sent. [Undo]`
- Max 1-2 toasts visible at once

### Success Page (Major Actions)

For significant completions (purchases, sign-ups):

```
┌───────────────────────────────────────┐
│                                       │
│               ✓                       │
│                                       │
│      Order Confirmed!                 │
│                                       │
│   Order #12345                        │
│   Confirmation sent to you@email.com  │
│                                       │
│   [Track Order]  [Continue Shopping]  │
│                                       │
└───────────────────────────────────────┘
```

**Include:**
- Clear success icon/animation
- What happened (order number, confirmation)
- What's next (email confirmation, delivery date)
- Clear next actions

---

## Error States

### Inline Field Errors

For form validation:

```
Email
┌─────────────────────────────┐
│ notvalid                    │  ← Red border
└─────────────────────────────┘
⚠️ Please enter a valid email address
```

**Rules:**
- Show immediately below the field
- Use red + icon (not color alone)
- Specific, actionable message

### Toast Errors (Recoverable)

For transient errors:

```
┌─────────────────────────────────┐
│ ⚠️ Couldn't save. [Try Again]  │
└─────────────────────────────────┘
```

**Rules:**
- Don't auto-dismiss (user might miss it)
- Include retry action when possible
- Keep message short

### Error Pages (System Failures)

For major failures:

```
┌───────────────────────────────────────┐
│                                       │
│              ⚠️                       │
│                                       │
│    Something went wrong               │
│                                       │
│    We couldn't process your request.  │
│    Please try again in a few minutes. │
│                                       │
│    Error code: 500-XYZ                │
│                                       │
│    [Try Again]  [Contact Support]     │
│                                       │
└───────────────────────────────────────┘
```

**Include:**
- Friendly message (not technical jargon)
- What user can do (retry, contact support)
- Error code for support reference
- Don't blame the user

### Offline State

```
┌───────────────────────────────────────┐
│ 📶 You're offline                     │
│    Some features may be unavailable.  │
│                         [Dismiss]     │
└───────────────────────────────────────┘
```

**Handle:**
- Show persistent banner
- Disable/gray out unavailable actions
- Queue actions for when back online
- Notify when connection restored

---

## Empty States

### First-Time / No Data

```
┌───────────────────────────────────────┐
│                                       │
│            📋                         │
│                                       │
│     No projects yet                   │
│                                       │
│   Create your first project to get    │
│   started organizing your work.       │
│                                       │
│        [+ Create Project]             │
│                                       │
└───────────────────────────────────────┘
```

**Include:**
- Relevant illustration or icon
- Clear explanation
- Primary action to create content
- Optional: tips or examples

### No Search Results

```
┌───────────────────────────────────────┐
│                                       │
│            🔍                         │
│                                       │
│  No results for "xyzabc"              │
│                                       │
│  Suggestions:                         │
│  • Check your spelling                │
│  • Try different keywords             │
│  • Use fewer filters                  │
│                                       │
│        [Clear Filters]                │
│                                       │
└───────────────────────────────────────┘
```

**Include:**
- Search term shown
- Suggestions to improve search
- Quick action (clear filters, browse all)

### Filtered to Zero

```
┌───────────────────────────────────────┐
│ Filters: Red, Size XL, Under $50      │
├───────────────────────────────────────┤
│                                       │
│       No items match your filters     │
│                                       │
│   [Remove "Under $50"]  [Clear All]   │
│                                       │
└───────────────────────────────────────┘
```

**Include:**
- Show active filters
- Suggest removing specific filter
- Option to clear all

---

## Confirmation Patterns

### Destructive Actions

```
┌───────────────────────────────────────┐
│  Delete "Project Name"?               │
│                                       │
│  This will permanently delete the     │
│  project and all 24 files inside.     │
│  This cannot be undone.               │
│                                       │
│       [Cancel]  [Delete]              │
│                     ↑                 │
│               Red button              │
└───────────────────────────────────────┘
```

**Rules:**
- Specific about what's being deleted
- Mention permanence
- Destructive button is red/danger color
- Cancel on left, action on right

### High-Stakes Actions

```
┌───────────────────────────────────────┐
│  Publish to 12,450 subscribers?       │
│                                       │
│  This newsletter will be sent         │
│  immediately and cannot be recalled.  │
│                                       │
│  Type "PUBLISH" to confirm:           │
│  ┌─────────────────────────────┐      │
│  │                             │      │
│  └─────────────────────────────┘      │
│                                       │
│       [Cancel]  [Send Newsletter]     │
└───────────────────────────────────────┘
```

**Use for:**
- Irreversible bulk actions
- Financial transactions
- Data deletion

---

## Notification Design

### Notification Levels

| Level | Use For | Color | Duration |
|-------|---------|-------|----------|
| Info | Neutral updates | Blue/Gray | Auto-dismiss 4s |
| Success | Completed actions | Green | Auto-dismiss 4s |
| Warning | Needs attention | Yellow/Orange | Persistent until action |
| Error | Failed actions | Red | Persistent until resolved |

### Notification Anatomy

```
┌─────────────────────────────────────────┐
│ [Icon]  Message text here        [✕]   │
│         Optional secondary line         │
│                           [Action]      │
└─────────────────────────────────────────┘
```

**Components:**
- Icon (conveys level)
- Primary message (short, clear)
- Secondary info (optional, details)
- Action button (optional, related action)
- Dismiss button (for persistent notifications)

---

## Motion in Feedback

### Timing Guidelines

| Context | Duration |
|---------|----------|
| Micro-interactions (button clicks) | 100-150ms |
| Component transitions (modals, dropdowns) | 200-300ms |
| Page transitions | 300-500ms |
| Complex animations (success celebration) | 500-1000ms |

### Easing

```css
/* Entrances - start slow, end fast */
transition-timing-function: ease-out;

/* Exits - start fast, end slow */
transition-timing-function: ease-in;

/* Movement - smooth throughout */
transition-timing-function: ease-in-out;
```

### Respect Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Feedback Checklist

### For Every Action
- [ ] Is there immediate visual feedback?
- [ ] Does loading state appear for >300ms waits?
- [ ] Is success clearly communicated?
- [ ] Are errors specific and actionable?
- [ ] Can user recover from failures?

### For Empty States
- [ ] Is there helpful guidance?
- [ ] Is there a clear action to resolve?
- [ ] Is the illustration/icon relevant?

### For Errors
- [ ] Does it explain what happened?
- [ ] Does it tell user how to fix?
- [ ] Is there an alternative path?
- [ ] Is error code available for support?

### Accessibility
- [ ] Are toasts announced to screen readers (aria-live)?
- [ ] Is color not the only indicator?
- [ ] Can keyboard users dismiss notifications?
