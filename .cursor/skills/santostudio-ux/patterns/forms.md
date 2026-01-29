# Forms UX

Designing forms that users actually complete.

## Core Principle

**Every field is a barrier to completion.** Question the necessity of every single input. If you can get the info another way (or don't really need it), remove the field.

## Form Fundamentals

### Field Reduction

```
❌ Checkout form with 15 fields
   First Name, Last Name, Email, Phone, Address Line 1, Address Line 2,
   City, State, ZIP, Country, Card Number, Expiry, CVV, Name on Card, Billing Address...

✅ Checkout form with 5 fields
   Email, Shipping Address (Google Places autocomplete), Card (Stripe Elements)
```

**Techniques:**
- Combine First + Last → "Full Name"
- Use address autocomplete → One field fills many
- Use payment processors → Secure embedded fields
- Defer optional fields → "Add later in settings"

### Field Order

Order by:
1. **Logic** — Group related fields
2. **Frequency** — Common inputs first
3. **Difficulty** — Easy before hard
4. **Sensitivity** — Build trust before asking sensitive info

```
✅ Good order:
Name → Email → Password → (optional: Phone) → Submit

❌ Bad order:
SSN → Name → Credit Card → Email → (why would anyone continue?)
```

---

## Labels & Placeholders

### Labels (Required)

Every input needs a visible label above it.

```html
<!-- ✅ Correct -->
<label for="email">Email address</label>
<input type="email" id="email">

<!-- ❌ Wrong: Placeholder as label -->
<input type="email" placeholder="Email address">
```

**Why placeholders fail as labels:**
- Disappear when typing → User forgets what field is
- Low contrast → Hard to read
- No reference when reviewing → "What did I put here?"

### Placeholder Usage

Use placeholders for:
- Format hints: `(555) 123-4567`
- Examples: `e.g., john@example.com`
- Never as the only label

```
Email
┌─────────────────────────────┐
│ e.g., you@company.com       │  ← Placeholder = example
└─────────────────────────────┘
```

### Help Text

For complex fields, add persistent help below:

```
Password
┌─────────────────────────────┐
│ ••••••••••                  │
└─────────────────────────────┘
Must be at least 8 characters with one number.  ← Help text
```

---

## Input Types

Use correct input types for better UX and mobile keyboards:

| Field | Type | Mobile Keyboard |
|-------|------|-----------------|
| Email | `email` | @ visible |
| Phone | `tel` | Number pad |
| Number | `number` or `inputmode="numeric"` | Number pad |
| URL | `url` | .com shortcut |
| Search | `search` | Search key |
| Password | `password` | Hidden, show toggle |

### Date Inputs

**Short-term dates (appointments):**
- Native date picker (good UX on mobile)
- Calendar widget on desktop

**Birthdates:**
- Three dropdowns (Month, Day, Year) or
- Text input with format hint (faster for known dates)

**Credit card expiry:**
- Single field: `MM/YY` with auto-formatting

### Select vs. Radio vs. Input

| Options | Pattern |
|---------|---------|
| 2-3 options | Radio buttons (all visible) |
| 4-7 options | Select dropdown |
| 8+ options | Searchable select or autocomplete |
| Open-ended | Text input |

```
Gender (3 options):
◉ Male  ○ Female  ○ Other

Country (200+ options):
┌─────────────────────────────┐
│ 🔍 Search countries...      │
└─────────────────────────────┘
```

---

## Validation

### Validation Timing

| Timing | When to Use | Pros | Cons |
|--------|-------------|------|------|
| On blur | Default for most fields | Immediate feedback | Can interrupt flow |
| On submit | Password fields, complex validation | Doesn't interrupt | Late feedback |
| Real-time | Search, username availability | Instant | Can be annoying/distracting |

**Recommendation:** Validate on blur (when user leaves field) for most cases.

### Validation States

```
Default:
┌─────────────────────────────┐
│                             │
└─────────────────────────────┘

Focused:
┌─────────────────────────────┐  ← Blue border
│ |                           │
└─────────────────────────────┘

Error:
┌─────────────────────────────┐  ← Red border
│ invalid-email               │
└─────────────────────────────┘
⚠️ Please enter a valid email    ← Error message below

Success (optional):
┌─────────────────────────────┐  ← Green border
│ valid@email.com         ✓   │  ← Checkmark
└─────────────────────────────┘
```

### Error Message Guidelines

**Be specific:**
```
❌ "Invalid input"
✅ "Email must include @ and a domain (e.g., name@example.com)"
```

**Be helpful:**
```
❌ "Password too weak"
✅ "Add at least one number to make your password stronger"
```

**Be human:**
```
❌ "Error: Field required"
✅ "Please enter your email so we can send your receipt"
```

### Inline Errors

Position error messages directly below the problematic field:

```
Email *
┌─────────────────────────────┐
│ notanemail                  │
└─────────────────────────────┘
⚠️ Please enter a valid email address

Phone
┌─────────────────────────────┐
│                             │
└─────────────────────────────┘
```

**NOT** at the top of the form where users have to hunt for which field is wrong.

### Error Summary (Multi-Error)

For forms with multiple errors, show a summary at the top:

```
┌──────────────────────────────────────────┐
│ ⚠️ Please fix 2 errors before submitting: │
│   • Email address is invalid             │
│   • Phone number is required             │
└──────────────────────────────────────────┘

[Form with highlighted fields below]
```

Click on error → jump to field.

---

## Required vs. Optional

### Marking Required Fields

**If most fields are required:**
Mark optional fields.
```
Email *
Phone (optional)
```

**If most fields are optional:**
Mark required fields.
```
Email (required)
Phone
```

### Best Practice

- Make everything required except truly optional
- If it's optional, question if you need it at all
- Use `*` or `(required)` — be consistent

```
* = required field

Name *
┌─────────────────────────────┐
│                             │
└─────────────────────────────┘

Company (optional)
┌─────────────────────────────┐
│                             │
└─────────────────────────────┘
```

---

## Multi-Step Forms

### When to Use

- **Use** for long forms (7+ fields)
- **Use** for complex processes (checkout, onboarding)
- **Don't use** for simple forms (login, contact)

### Progress Indication

Always show progress:

```
Step 2 of 4: Shipping

[1]──[2]──[3]──[4]
 ✓   ●    ○    ○

Basic Info → Shipping → Payment → Review
```

### Step Design

**One concern per step:**
```
Step 1: Account (email, password)
Step 2: Profile (name, photo)
Step 3: Preferences (notifications, settings)
```

**Enable going back:**
```
[← Back]                     [Continue]
```

**Save progress:**
- Auto-save when moving between steps
- Allow resuming later if abandoned

### Completion Summary

Before final submission, show summary:

```
Review Your Order

Shipping to:
John Doe
123 Main St, City, State 12345
[Edit]

Payment:
Visa ending 4242
[Edit]

Items:
- Product A × 2 ($50)
- Product B × 1 ($25)

Total: $75.00

[← Back]           [Place Order]
```

---

## Form Actions

### Button Hierarchy

**One primary action:**
```
[        Submit        ]  ← Primary (filled, prominent)
        Cancel            ← Secondary (text link)
```

**Two equal actions:**
```
[Save as Draft]  [Publish]
    ↑                ↑
 Outlined       Filled
```

### Button Labels

Be specific:
```
❌ "Submit"
✅ "Create Account"

❌ "Next"
✅ "Continue to Payment"

❌ "OK"
✅ "Confirm Order"
```

### Button States

```css
/* Default */
background: #2563eb;

/* Hover */
background: #1d4ed8;

/* Active (pressed) */
background: #1e40af;
transform: scale(0.98);

/* Disabled */
background: #9ca3af;
cursor: not-allowed;

/* Loading */
background: #2563eb;
/* Show spinner, disable clicks */
```

### Loading State

Disable button and show progress during submission:

```
[        Submit        ]
           ↓
[    ◌ Submitting...   ]  ← Spinner, disabled
           ↓
[    ✓ Submitted       ]  ← Brief success state
```

---

## Mobile Forms

### Keyboard Handling

- Use correct `type` for keyboard optimization
- Don't let keyboard cover the focused field (scroll into view)
- "Next" button on keyboard should move to next field
- "Done" on last field should submit or close keyboard

### Touch Targets

- Input height: minimum 44px
- Tap target: minimum 44×44px
- Spacing between inputs: 12-16px minimum

### Auto-Complete

Enable browser autocomplete for standard fields:

```html
<input type="text" autocomplete="name">
<input type="email" autocomplete="email">
<input type="tel" autocomplete="tel">
<input type="text" autocomplete="street-address">
```

---

## Checklist

### Before Building
- [ ] Removed all unnecessary fields?
- [ ] Grouped related fields logically?
- [ ] Chose correct input types?
- [ ] Decided validation timing?

### Design Review
- [ ] Every field has a visible label?
- [ ] Required/optional is clear?
- [ ] Error messages are specific and helpful?
- [ ] Button label describes the action?
- [ ] Multi-step shows progress?

### Mobile Testing
- [ ] Fields are 44px+ height?
- [ ] Correct keyboards appear?
- [ ] Keyboard doesn't cover focused field?
- [ ] Autocomplete works?

### Accessibility
- [ ] Labels connected to inputs (for/id)?
- [ ] Error messages announced (aria-invalid, aria-describedby)?
- [ ] Tab order is logical?
- [ ] Submit button is keyboard accessible?
