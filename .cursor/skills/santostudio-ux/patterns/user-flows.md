# User Flows

Designing complete journeys from start to finish, including when things go wrong.

## Core Principle

**A flow is not done until you've designed the failures.** The happy path is the easy part. Edge cases and errors separate good UX from great UX.

## Flow Anatomy

Every user flow has:

```
Entry Point → Steps → Decision Points → Success/Failure → Exit
```

### Complete Flow Checklist

Before a flow is "done," design:

1. **Happy Path** — Everything works perfectly
2. **Edge Cases** — Unusual but valid scenarios
3. **Error States** — Things go wrong
4. **Empty States** — No data yet
5. **Loading States** — Waiting for response
6. **Recovery Paths** — How to fix errors

---

## Happy Path Design

The ideal journey when everything works.

### Principles

**Minimize Steps**
Every extra step = drop-off. Question every screen.

```
❌ 7 steps to checkout
   Cart → Login → Shipping → Shipping Method → Payment → Review → Confirm

✅ 3 steps to checkout
   Cart → Shipping + Payment → Confirm
```

**One Task Per Screen**
Don't overload. Clear focus = faster completion.

**Progressive Commitment**
Get users invested before asking for commitment:
```
Step 1: See the value (browse products)
Step 2: Soft commitment (add to cart)
Step 3: Medium commitment (enter email)
Step 4: Hard commitment (enter payment)
```

**Show Progress**
For multi-step flows, show where users are:
```
Step 2 of 4: Shipping Address
[====|====|----|----|]
```

### Flow Documentation Template

```markdown
## Flow: [Name]

**Goal:** What the user wants to accomplish
**Entry Points:** Where users start this flow
**Success Criteria:** What defines completion

### Steps

1. **Screen/Step Name**
   - User sees: [description]
   - User does: [action]
   - System responds: [response]
   - Next: [where they go]

2. **Screen/Step Name**
   ...

### Branches
- If [condition], go to [step]
- If [condition], go to [step]

### Exit Points
- Success: [outcome]
- Abandonment: [where they land]
```

---

## Edge Cases

Unusual but valid scenarios that break assumptions.

### Common Edge Cases to Design

**Empty States**
- First-time user (no data)
- Filtered results = zero matches
- Deleted all items
- Account with no activity

**Boundary Conditions**
- Very long names/text
- Special characters (émojis, unicode)
- Maximum quantities
- Minimum values
- Zero values

**Timing Issues**
- Very slow connection
- Session timeout mid-flow
- Concurrent edits (another tab)
- Stale data

**Permission States**
- Logged out mid-flow
- Insufficient permissions
- Expired subscription
- Blocked/banned account

**Data Combinations**
- Guest vs. logged in
- Free vs. paid user
- New vs. returning user
- Mobile vs. desktop

### Edge Case Template

```markdown
## Edge Case: [Name]

**Scenario:** [When this happens]
**Likelihood:** High / Medium / Low
**Impact:** Critical / Major / Minor

**Design Response:**
- What user sees
- How to recover
- Prevention if possible
```

### Example: Long Username

```markdown
## Edge Case: Extremely Long Display Name

**Scenario:** User enters "Alexander Bartholomew Christopher Davidson III"
**Likelihood:** Low
**Impact:** Minor (visual only)

**Design Response:**
- Truncate with ellipsis: "Alexander Bartholomew Chris..."
- Show full name on hover/tap
- Set max-width with text-overflow: ellipsis
- Show full name in profile page (wrap allowed)
```

---

## Error States

When things go wrong, design must guide recovery.

### Error Categories

**User Errors (Preventable)**
- Invalid input (wrong email format)
- Missing required fields
- Out of range values

**System Errors (Not User's Fault)**
- Server down
- Network failure
- API timeout
- Payment processor failure

**Permission Errors**
- Unauthorized action
- Session expired
- Rate limited

### Error Message Formula

```
What happened + Why + How to fix
```

**Examples:**

```
❌ Bad: "Error 500"
❌ Bad: "Something went wrong"
❌ Bad: "Invalid input"

✅ Good: "We couldn't process your payment. Your card was declined. 
         Please try a different card or contact your bank."

✅ Good: "That email is already registered. Log in instead or use 
         a different email."

✅ Good: "This field is required. Please enter your phone number."
```

### Error Placement

**Inline Errors (Field-Level)**
For form validation, show error **adjacent to the field**:

```
Email Address
┌─────────────────────────────┐
│ not-an-email                │
└─────────────────────────────┘
⚠️ Please enter a valid email address

[Next]
```

**NOT:**
```
⚠️ Please enter a valid email address  ← Top of page

Email Address
┌─────────────────────────────┐
│ not-an-email                │  ← User has to scroll to find it
└─────────────────────────────┘
```

**Global Errors (Page-Level)**
For system errors or multi-field issues:

```
┌──────────────────────────────────────┐
│ ⚠️ We couldn't submit your form.     │
│    Please fix the 2 errors below.    │
└──────────────────────────────────────┘

[Form with highlighted error fields]
```

### Error Recovery Patterns

**Undo**
For destructive actions, allow undo:
```
┌──────────────────────────────────────┐
│ ✓ Email deleted.           [Undo]    │
└──────────────────────────────────────┘
```

**Retry**
For transient failures:
```
┌──────────────────────────────────────┐
│ ⚠️ Couldn't load. Check connection. │
│              [Try Again]             │
└──────────────────────────────────────┘
```

**Alternative Path**
When primary method fails:
```
Payment failed with Visa ending 4242.

[Try Again] [Use Different Card] [Use PayPal]
```

**Save Progress**
For form abandonment:
```
┌──────────────────────────────────────┐
│ Want to save your progress?          │
│ We'll email you a link to continue.  │
│                                      │
│ [Save Progress] [Discard]            │
└──────────────────────────────────────┘
```

---

## Flow States Matrix

For each flow, map all possible states:

```
| State          | What User Sees       | What User Can Do      |
|----------------|----------------------|-----------------------|
| Loading        | Skeleton/spinner     | Wait, maybe cancel    |
| Empty          | Illustration + CTA   | Create first item     |
| Success        | Confirmation         | Continue, share       |
| Partial Success| Mixed results        | Retry failed, continue|
| Error          | Error + recovery     | Retry, get help       |
| Offline        | Offline indicator    | Limited actions       |
| Timeout        | Session message      | Refresh, re-login     |
```

---

## Confirmation Patterns

### When to Confirm

**Always confirm:**
- Destructive actions (delete, remove)
- Irreversible actions (send, publish)
- Actions with consequences (purchase, cancel subscription)
- Bulk actions (delete all, update many)

**Don't confirm:**
- Low-risk, reversible actions (archive, edit, save draft)
- Frequent actions (would become annoying)

### Confirmation Types

**Inline Confirmation**
```
[Delete]
  ↓
[Are you sure? Delete | Cancel]
```

**Modal Confirmation**
```
┌──────────────────────────────────────┐
│ Delete this project?                 │
│                                      │
│ This will permanently delete         │
│ "Project Name" and all its files.    │
│ This action cannot be undone.        │
│                                      │
│      [Cancel]  [Delete Project]      │
└──────────────────────────────────────┘
```

**Rules:**
- Destructive button is NOT primary color (use red or gray)
- Cancel on left, confirm on right
- Be specific about what will be deleted
- Mention irreversibility

---

## Flow Testing

### Walkthrough Checklist

For every flow, walk through as if you're a user:

- [ ] Can I complete the happy path easily?
- [ ] What happens if I make a mistake?
- [ ] What if the server is slow/down?
- [ ] What if I'm interrupted and come back later?
- [ ] What if I'm a first-time user (no data)?
- [ ] What if I'm on a slow connection?
- [ ] Can I recover from every error state?
- [ ] Is it clear what happens next at every step?
- [ ] Can I go back without losing progress?

### Metrics to Track

- **Completion rate** — % who finish the flow
- **Drop-off points** — Where users abandon
- **Error rate** — % who encounter errors
- **Time to complete** — How long the flow takes
- **Retry rate** — How often users retry after error

---

## Example: Checkout Flow

### Happy Path
```
1. Cart Review
   - See items, quantities, subtotal
   - Edit quantities or remove items
   - Click "Checkout"

2. Shipping & Payment
   - Enter/select address
   - Enter payment method
   - See order summary
   - Click "Place Order"

3. Confirmation
   - See success message
   - Order number and summary
   - Email confirmation sent
   - Options: continue shopping, track order
```

### Edge Cases Designed
- Guest checkout vs. logged in
- Empty cart → redirect to shop
- Item out of stock after adding → show warning
- Coupon invalid → inline error with suggestion
- Address validation fails → allow override

### Error States Designed
- Payment declined → show reason + alternatives
- Network error → save progress + retry
- Session expired → re-auth without losing cart
- Server error → apologize + support contact

### Empty State
```
┌──────────────────────────────────────┐
│         🛒                           │
│    Your cart is empty               │
│                                      │
│    Start shopping to add items.      │
│                                      │
│         [Browse Products]            │
└──────────────────────────────────────┘
```
