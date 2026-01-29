# Signature Effects - Santos Studio UI Components

Glassmorphism, glow effects, and contextual skeuomorphism for distinctive interfaces.

## Philosophy

Santos Studio uses **effects intentionally**, not decoratively:
- **Glassmorphism** for premium feel and layered UI
- **Glow effects** for tech/electronic products and emphasis
- **Skeuomorphism** only when context supports it (mechanical products)

**Core belief:** Effects should enhance usability and personality, not just look cool.

---

## Glassmorphism

**What it is:** Semi-transparent backgrounds with backdrop blur, creating "frosted glass" effect.

**When to use:**
- ✅ Overlays on images or gradients
- ✅ Premium features or paid content
- ✅ Modern/tech-forward products (Opal, Revolut style)
- ✅ Layered UI where depth matters

**When NOT to use:**
- ❌ On plain white/gray backgrounds (defeats the purpose)
- ❌ For dense text content (reduces readability)
- ❌ When accessibility is critical (contrast challenges)

### Implementation

#### Glassmorphism on Colored Backgrounds

**When background is colorful** (blue gradient, purple, vibrant):

**RULE:** Keep UI elements light/white to maintain contrast.

```jsx
<div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-8">
  <div className="
    backdrop-blur-xl
    bg-white/10
    border border-white/20
    rounded-2xl p-6
  ">
    {/* Icons: WHITE */}
    <UserIcon className="w-12 h-12 text-white" />
    
    {/* Text: WHITE */}
    <h2 className="text-white text-2xl font-bold">Good Afternoon</h2>
    <p className="text-white/80 text-sm">Here's your activity summary</p>
    
    {/* Stats cards: Subtle, same color family */}
    <div className="grid grid-cols-2 gap-3 mt-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <p className="text-3xl font-bold text-white">2,847</p>
        <p className="text-sm text-white/60">TOTAL VIEWS</p>
      </div>
    </div>
    
    {/* Button: WHITE solid (high contrast) */}
    <button className="
      w-full mt-6
      bg-white text-blue-700
      px-6 py-4 rounded-2xl
      font-semibold
      hover:bg-white/90
    ">
      View Full Report
    </button>
  </div>
</div>
```

**Key points:**
- ✅ Icons: White
- ✅ Text: White (primary) and white/80 (secondary)
- ✅ Stats cards: Same background color family (white/5, not colored)
- ✅ Button: White solid (NOT gradient with multiple colors)
- ✅ Progress bar: Mono-color gradient (blue-400 to blue-600, NOT blue to purple)

#### Glassmorphism on Dark Backgrounds

**When background is dark/midnight** (black, gray-900, navy):

**RULE:** Subtle glassmorphism with light accent colors.

```jsx
<div className="min-h-screen bg-gray-900 p-8">
  <div className="
    backdrop-blur-xl
    bg-white/5
    border border-white/10
    rounded-2xl p-6
  ">
    {/* Icons: Lightly colored */}
    <UserIcon className="w-12 h-12 text-blue-400" />
    
    {/* Text: WHITE */}
    <h2 className="text-white text-2xl font-bold">Good Afternoon</h2>
    <p className="text-gray-400 text-sm">Here's your activity summary</p>
    
    {/* Stats cards: Very subtle */}
    <div className="grid grid-cols-2 gap-3 mt-6">
      <div className="bg-white/3 rounded-xl p-4 border border-white/5">
        <p className="text-3xl font-bold text-white">2,847</p>
        <p className="text-sm text-gray-500">TOTAL VIEWS</p>
      </div>
    </div>
    
    {/* Button: Colored (blue-500, green-500, etc.) */}
    <button className="
      w-full mt-6
      bg-blue-500 text-white
      px-6 py-4 rounded-2xl
      font-semibold
      hover:bg-blue-600
    ">
      View Full Report
    </button>
  </div>
</div>
```

**Key points:**
- ✅ Icons: Light accent color (blue-400, green-400)
- ✅ Text: White primary, gray-400 secondary
- ✅ Cards: Very subtle (white/3)
- ✅ Button: Solid primary color (blue-500), NOT multi-color gradient

#### Progress Bars on Glassmorphism

**NEVER use multi-color gradients** (blue to purple, pink to orange):

```jsx
{/* ❌ BAD: Multi-color gradient */}
<div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" />

{/* ✅ GOOD: Mono-palette gradient */}
<div className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />

{/* ✅ BETTER: Solid color */}
<div className="h-2 rounded-full bg-blue-500" />
```

#### Basic Glassmorphism

```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px); /* Safari */
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

**Opacity guidelines:**
- Light backgrounds: `rgba(255, 255, 255, 0.05-0.15)`
- Dark backgrounds: `rgba(0, 0, 0, 0.2-0.4)` or `rgba(255, 255, 255, 0.03-0.08)`

**Blur amount:**
- Subtle: `blur(10px)`
- Standard: `blur(20px)`
- Heavy: `blur(30px)`

#### Santos Studio Signature: Gradient Border

**The trick:** White border with gradient opacity (20% top → 10% bottom)

```css
.glass-santos {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid;
  border-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.2),  /* 20% at top */
    rgba(255, 255, 255, 0.1)   /* 10% at bottom */
  ) 1;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

**Why this works:** Creates subtle white rim at top that's still visible at bottom — adds premium feel.

**Inspired by:** Opal's sleep tracking cards

#### Dark Background Variant

```css
.glass-dark {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

### React Component Example

```jsx
const GlassCard = ({ children, dark = false }) => (
  <div 
    className={`
      backdrop-blur-xl rounded-2xl p-6
      shadow-[0_8px_32px_rgba(0,0,0,0.1)]
      ${dark 
        ? 'bg-black/30 border border-white/15' 
        : 'bg-white/10 border border-white/20'
      }
    `}
    style={{
      borderImage: 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.1)) 1'
    }}
  >
    {children}
  </div>
);
```

### Real-World Examples

**Opal-style (deep blue background):**
```jsx
<div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-8">
  <div className="
    backdrop-blur-xl
    bg-white/10
    border border-white/20
    rounded-2xl p-6
  ">
    <h2 className="text-white text-2xl font-bold">Good Afternoon</h2>
    <p className="text-white/80 mt-2">Your daily summary</p>
  </div>
</div>
```

**Revolut-style (purple gradient background):**
```jsx
<div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-8">
  <div className="
    backdrop-blur-2xl
    bg-black/30
    border border-white/10
    rounded-3xl p-8
  ">
    <h2 className="text-white text-3xl font-bold">$19.98</h2>
    <p className="text-white/70 mt-1">Personal · All accounts</p>
  </div>
</div>
```

---

## Glow Effects

**What it is:** Colored shadows or radial gradients that create "glow" or "light emission" effect.

**When to use:**
- ✅ Tech/electronic products (Odisei saxophone example)
- ✅ Premium badges, achievements
- ✅ Highlighting important elements
- ✅ Creating light source effects

**When NOT to use:**
- ❌ On every element (loses impact)
- ❌ In formal/professional contexts (may look gimmicky)
- ❌ With low-contrast color schemes

### Colored Shadow Glow

**Basic technique:** Use colored shadows matching the element.

```css
.glow-button {
  background: #3b82f6;
  box-shadow: 
    0 0 20px rgba(59, 130, 246, 0.4),
    0 0 40px rgba(59, 130, 246, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.2);
}
```

**Multiple layers create depth:**
1. Inner glow (smaller, more intense)
2. Outer glow (larger, more diffuse)
3. Standard shadow (for grounding)

#### Color-Specific Glows

**Blue glow:**
```css
box-shadow: 
  0 0 20px rgba(59, 130, 246, 0.5),
  0 0 40px rgba(59, 130, 246, 0.3);
```

**Green glow:**
```css
box-shadow: 
  0 0 20px rgba(16, 185, 129, 0.5),
  0 0 40px rgba(16, 185, 129, 0.3);
```

**Orange glow (Odisei style):**
```css
box-shadow: 
  0 0 20px rgba(249, 115, 22, 0.6),
  0 0 40px rgba(249, 115, 22, 0.4);
```

**Gold glow (achievements):**
```css
box-shadow: 
  0 0 20px rgba(251, 191, 36, 0.6),
  0 0 40px rgba(251, 191, 36, 0.4);
```

### Radial Gradient Glow (Background)

**For creating "light source" behind elements:**

```css
.glow-background {
  position: relative;
}

.glow-background::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    rgba(59, 130, 246, 0.3) 0%,
    transparent 70%
  );
  z-index: -1;
  filter: blur(40px);
}
```

**Inspired by:** Opal's holographic egg glow

### Hover Glow Effect

```css
.glow-on-hover {
  transition: box-shadow 300ms ease;
}

.glow-on-hover:hover {
  box-shadow: 
    0 0 30px rgba(59, 130, 246, 0.6),
    0 0 60px rgba(59, 130, 246, 0.4);
}
```

### React Component Example

```jsx
const GlowButton = ({ color = 'blue', children }) => {
  const glowColors = {
    blue: 'rgba(59, 130, 246, 0.5)',
    green: 'rgba(16, 185, 129, 0.5)',
    orange: 'rgba(249, 115, 22, 0.6)',
    gold: 'rgba(251, 191, 36, 0.6)'
  };
  
  return (
    <button 
      className="px-6 py-3 rounded-xl font-semibold"
      style={{
        background: color === 'blue' ? '#3b82f6' : /* other colors */,
        boxShadow: `
          0 0 20px ${glowColors[color]},
          0 0 40px ${glowColors[color].replace('0.5', '0.3')},
          0 4px 8px rgba(0, 0, 0, 0.2)
        `
      }}
    >
      {children}
    </button>
  );
};
```

### Real-World Examples

**Opal-style holographic glow:**
```jsx
<div className="relative">
  {/* Glow background */}
  <div className="
    absolute inset-0 -z-10
    bg-gradient-radial from-cyan-500/30 to-transparent
    blur-3xl
  " />
  
  {/* Element */}
  <div className="
    w-40 h-40 rounded-full
    bg-gradient-to-br from-cyan-400 to-purple-600
    shadow-[0_0_40px_rgba(6,182,212,0.6)]
  " />
</div>
```

**Achievement badge with gold glow:**
```jsx
<div className="
  inline-flex items-center gap-2
  px-4 py-2 rounded-full
  bg-gradient-to-r from-yellow-400 to-orange-500
  text-white font-bold
  shadow-[0_0_20px_rgba(251,191,36,0.6),0_0_40px_rgba(251,191,36,0.4)]
">
  🔥 74 Day Streak
</div>
```

---

## Skeuomorphism (Contextual)

**What it is:** Designs that mimic real-world objects or textures.

**When to use:**
- ✅ Mechanical/tangible products (Odisei electronic saxophone)
- ✅ Retro/vintage aesthetics
- ✅ When physical metaphor adds clarity
- ✅ Specific brand requirements

**When NOT to use:**
- ❌ Modern/minimal products (conflicts with aesthetic)
- ❌ Everywhere (looks dated)
- ❌ Without clear purpose

### Inset/Carved Effect

**For "pressed in" surfaces:**

```css
.inset {
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 -1px 2px rgba(255, 255, 255, 0.1);
  background: linear-gradient(to bottom, #e0e0e0, #f5f5f5);
}
```

**Use case:** Progress bars, input fields in skeuomorphic interfaces

### Raised/Embossed Effect

**For "raised" surfaces:**

```css
.raised {
  box-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.5) inset,
    0 -1px 0 rgba(0, 0, 0, 0.1) inset,
    0 2px 4px rgba(0, 0, 0, 0.2);
  background: linear-gradient(to bottom, #f5f5f5, #e0e0e0);
}
```

**Use case:** Buttons in skeuomorphic interfaces

### Textured Background

```css
.textured {
  background: 
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}
```

### Real-World Example (Odisei)

**Progress bar for saxophone app:**

```jsx
<div className="
  w-full h-3 rounded-full
  bg-gradient-to-b from-gray-200 to-gray-300
  shadow-inner
  overflow-hidden
">
  <div 
    className="
      h-full rounded-full
      bg-gradient-to-b from-orange-400 to-orange-600
      shadow-[0_0_10px_rgba(249,115,22,0.5)]
    "
    style={{ width: '60%' }}
  />
</div>
```

**Combines:**
- Inset shadow (carved container)
- Gradient fill (depth)
- Glow effect (electronic/tech feel)

---

## Combining Effects

### Glassmorphism + Glow

**For premium, tech-forward UI:**

```jsx
<div className="
  backdrop-blur-xl
  bg-white/10
  border border-white/20
  rounded-2xl p-6
  shadow-[0_8px_32px_rgba(0,0,0,0.1),0_0_40px_rgba(59,130,246,0.2)]
">
  <h3 className="text-white text-xl font-bold">Premium Feature</h3>
</div>
```

**Inspired by:** Revolut premium cards

### Glassmorphism + Gradient Border + Glow

**Santos Studio premium combo:**

```css
.premium-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid;
  border-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.1)
  ) 1;
  border-radius: 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 0 40px rgba(59, 130, 246, 0.2);
}
```

---

## Best Practices

### Do's ✅
- Use glassmorphism on colored/image backgrounds
- Apply glow effects to tech/premium elements
- Use skeuomorphism when context supports it
- Test effects in light and dark modes
- Ensure text remains readable with effects
- Combine effects intentionally (glassmorphism + glow works well)

### Don'ts ❌
- Don't use glassmorphism on plain white/gray
- Don't apply glow to every element
- Don't use skeuomorphism in modern/minimal designs
- Don't sacrifice readability for effects
- Don't combine too many effects (overwhelming)
- Don't forget browser support (`-webkit-` prefix for Safari)

---

## Browser Support

### Backdrop Filter

```css
/* Standard */
backdrop-filter: blur(20px);

/* Safari */
-webkit-backdrop-filter: blur(20px);
```

**Fallback for unsupported browsers:**

```css
@supports not (backdrop-filter: blur(20px)) {
  .glass {
    background: rgba(255, 255, 255, 0.8); /* More opaque */
  }
}
```

---

## Performance Considerations

**Backdrop-filter is GPU-intensive:**
- Limit use to critical UI elements
- Avoid on rapidly scrolling content
- Test on lower-end devices

**Glow effects:**
- Multiple box-shadows can impact performance
- Use sparingly on mobile
- Avoid animating glows (use opacity instead)

---

## Inspiration Sources

**Opal:**
- Glassmorphism on deep blue gradients
- Holographic glows with radial gradients
- Colored shadows on important elements

**Revolut:**
- Glassmorphism on purple/blue gradients
- Premium 3D card renderings with glow
- Layered UI with backdrop blur

**Odisei (Skeuomorphism):**
- Inset progress bars
- Glow effects on electronic elements
- Contextual use for mechanical product

**Santos Studio combines:**
- Opal's glassmorphism mastery
- Revolut's premium glow effects
- Contextual skeuomorphism (Odisei style)
- Signature gradient borders

**Result:** Distinctive, modern, premium interfaces.
