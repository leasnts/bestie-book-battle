# Onboarding UX

First impressions that convert and activate users.

## Core Principle

**Onboarding is seduction, not education.** Your goal isn't to teach everything—it's to get users to their first "aha moment" as fast as possible.

## The Aha Moment

Every product has an "aha moment"—the instant users understand the value.

**Examples:**
- **Spotify:** First song plays perfectly
- **Dropbox:** File syncs across devices
- **Slack:** First team message received
- **Airbnb:** First property bookmarked

**Your job:** Remove all friction between signup and this moment.

---

## Onboarding Types

### 1. Benefits-Focused (Value First)

Show what the product does before asking for anything.

```
┌───────────────────────────────────────┐
│                                       │
│         [Product Screenshot]          │
│                                       │
│     Organize your life in one app     │
│                                       │
│  Create tasks, set reminders, and     │
│  never forget anything important.     │
│                                       │
│         [Get Started Free]            │
│                                       │
│      ○ ○ ● ○    →                     │
└───────────────────────────────────────┘
```

**Best for:**
- Products needing explanation
- Competitive markets (differentiate)
- Complex value propositions

### 2. Action-First (Do Something Immediately)

Skip explanations, jump straight to using the product.

```
┌───────────────────────────────────────┐
│                                       │
│     What do you want to accomplish?   │
│                                       │
│   ┌─────────────────────────────┐     │
│   │ Plan my week                │     │
│   └─────────────────────────────┘     │
│                                       │
│             [Create Task]             │
│                                       │
│     Already have an account? Log in   │
│                                       │
└───────────────────────────────────────┘
```

**Best for:**
- Simple, intuitive products
- Users who "get it" immediately
- Products where doing > reading

### 3. Personalization-First

Customize the experience upfront for better retention.

```
┌───────────────────────────────────────┐
│                                       │
│     What brings you here?             │
│                                       │
│   [📱 Personal use        ]           │
│   [💼 Work projects       ]           │
│   [👥 Team collaboration  ]           │
│                                       │
│            [Continue]                 │
│                                       │
└───────────────────────────────────────┘
```

**Best for:**
- Products with multiple use cases
- Products that benefit from customization
- Higher-commitment products

---

## Progressive Disclosure

### The Iceberg Principle

Show 20% upfront, reveal 80% as users progress.

```
Day 1:    Core features only
Week 1:   Introduce shortcuts
Month 1:  Advanced features appear
Power user: Full feature access
```

**Don't:** Dump everything on new users
**Do:** Reveal complexity as users demonstrate readiness

### Contextual Education

Teach at the moment of relevance, not before.

```
❌ Upfront tutorial:
   "Here's how filtering works..."
   [User hasn't even seen a list yet]

✅ Contextual hint:
   User opens a long list for the first time
   💡 "Tip: Use filters to find items faster" [Got it]
```

### Feature Discovery Patterns

**Tooltips (One-time hints)**
```
┌─────────────────────────────────────┐
│  [+]                                │
│   ↓                                 │
│ ┌───────────────────────┐           │
│ │ Click here to create  │           │
│ │ your first project    │           │
│ │          [Got it]     │           │
│ └───────────────────────┘           │
```

**Spotlights (Focus attention)**
```
┌─────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░┌────────────────┐░░░░░░░░░░  │  ← Dim everything
│  ░░░░│  This button   │░░░░░░░░░░  │  ← Highlight one thing
│  ░░░░│  does X        │░░░░░░░░░░  │
│  ░░░░└────────────────┘░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└─────────────────────────────────────┘
```

**Checklists (Guided activation)**
```
┌─────────────────────────────────────┐
│  Getting Started                    │
│                                     │
│  ✓ Create your account              │
│  ✓ Set up your profile              │
│  ○ Invite a team member             │
│  ○ Create your first project        │
│                                     │
│  [━━━━━━━━━░░░░] 50% complete        │
└─────────────────────────────────────┘
```

**Empty State CTAs**
```
┌─────────────────────────────────────┐
│                                     │
│          📁                         │
│                                     │
│    No projects yet                  │
│                                     │
│    Create your first project to     │
│    start organizing your work.      │
│                                     │
│       [+ Create Project]            │
│                                     │
└─────────────────────────────────────┘
```

---

## Sign-Up Flow Optimization

### Reduce Friction

**Ask less upfront:**
```
❌ Sign-up form: 8 fields
   Name, email, password, company, role, team size, 
   phone, how did you hear about us?

✅ Sign-up form: 2 fields
   Email + Password
   (Everything else later, or derived)
```

**Social sign-in:**
```
[Continue with Google]
[Continue with Apple]
──────── or ────────
Email: [________________]
```

**Magic links (passwordless):**
```
Enter your email to sign in:
[________________]
[Send me a sign-in link]
```

### Defer Non-Essential Steps

```
Step 1: Account (email only)
Step 2: Core action (experience value)
Step 3: Profile (optional, later prompt)
```

Don't block users from value with non-essential data collection.

### Progressive Profiling

Collect info over time, not all at once:

```
Session 1: Email
Session 2: "Add your name for personalized experience"
Session 3: "What's your role? We'll customize your dashboard"
Session 4: "Enable notifications to never miss updates"
```

---

## Onboarding Screens (Mobile/App)

### Carousel Pattern

```
Screen 1          Screen 2          Screen 3
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Image   │      │  Image   │      │  Image   │
│          │      │          │      │          │
│ Benefit 1│      │ Benefit 2│      │ Benefit 3│
│          │      │          │      │          │
│ ● ○ ○    │  →   │ ○ ● ○    │  →   │ ○ ○ ●    │
│[Skip][→] │      │[Skip][→] │      │[Get Start]│
└──────────┘      └──────────┘      └──────────┘
```

**Rules:**
- Maximum 3-5 screens (fewer is better)
- Always allow skip
- Show progress dots
- Last screen has CTA (not "Next")
- Auto-advance with swipe support

### Single Screen (Recommended)

Often better than carousel:

```
┌───────────────────────────────────────┐
│                                       │
│         [App Icon/Illustration]       │
│                                       │
│     Welcome to [App Name]             │
│                                       │
│   One line explaining core value.     │
│                                       │
│         [Create Account]              │
│                                       │
│         Already have an account?      │
│              [Log In]                 │
│                                       │
└───────────────────────────────────────┘
```

Simpler, faster, less abandonment.

---

## Activation Metrics

### What to Track

**Completion rate:**
- % who complete signup
- % who complete each onboarding step
- Drop-off points

**Time to value:**
- Time from signup to first key action
- Time to "aha moment"

**Activation rate:**
- % who perform "activated user" action
- (Define what activation means for your product)

### Benchmark Questions

- What % of signups complete onboarding?
- Where do users drop off most?
- How long until first value?
- What do activated users do that churned users don't?

---

## Onboarding Anti-Patterns

### ❌ Feature Dumping

```
❌ "Here are 47 features of our product"
   [15-screen tutorial]
   
✅ "Let's get you started with the basics"
   [One action to value]
```

### ❌ Blocking Progress

```
❌ "Complete your profile to continue"
   [15 required fields before seeing the app]
   
✅ "Get started now, complete profile later"
   [See value immediately]
```

### ❌ Mandatory Tours

```
❌ "Before you begin, let us show you around"
   [Forced 12-step product tour]
   
✅ "Need help? [Quick Tour] or [Skip]"
   [Optional, user-initiated]
```

### ❌ Information Overload

```
❌ Screen with 200 words of explanation
   
✅ Screen with 20 words and a clear CTA
```

### ❌ No Escape

```
❌ Onboarding with no skip button
   
✅ [Skip] always available
```

---

## Re-Engagement for Incomplete Onboarding

### Email Nudges

```
Day 1: "Welcome! Here's how to get started"
Day 3: "You're almost there—just one step left"
Day 7: "We miss you—here's what you're missing"
```

### In-App Reminders

```
┌───────────────────────────────────────┐
│  Complete your setup                  │
│  [━━━━━━━━░░░░░] 75%                  │
│                                       │
│  Just one more step to unlock all     │
│  features.            [Continue]      │
└───────────────────────────────────────┘
```

---

## Checklist

### Before Building
- [ ] Defined the "aha moment"?
- [ ] Identified minimum viable signup?
- [ ] Planned what to defer vs. require?

### Onboarding Flow
- [ ] Can users skip everything?
- [ ] Maximum 3-5 screens?
- [ ] Clear value proposition on each screen?
- [ ] Progress indication visible?
- [ ] CTA clear on final screen?

### Post-Signup
- [ ] Empty states guide to first action?
- [ ] Tooltips for key features (one-time)?
- [ ] Checklist for guided activation?
- [ ] Re-engagement emails scheduled?

### Metrics
- [ ] Tracking signup completion rate?
- [ ] Tracking drop-off at each step?
- [ ] Defined "activated user" criteria?
- [ ] Monitoring time to first value?
