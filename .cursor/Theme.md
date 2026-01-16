# ProjectHub Theme Guidelines

## Overview
ProjectHub uses a minimalist, welcoming light theme optimized for creatives and new founders. The design emphasizes soft gradients, generous white space, and high-contrast text for accessibility.

## Core Design Philosophy
- **Approachable**: Soft colors and rounded corners create a friendly environment
- **Professional**: High contrast and clear hierarchy maintain credibility
- **Modern**: Glass morphism and subtle shadows add depth without distraction
- **Accessible**: WCAG AA compliant with 4.5:1 contrast ratios minimum

---

## Color System

### Primary Brand Colors
Use for CTAs, links, focus states, and brand elements:
- Primary: `indigo-500` (`#6366f1`)
- Primary Light: `indigo-50` (`#eef2ff`)
- Accent: `purple-600` (`#9333ea`)
- Accent Light: `purple-50` (`#faf5ff`)

### Surface Colors
Use for backgrounds and cards:
- Main Background: Gradient `from-indigo-50 via-blue-50 to-purple-50`
- Surface: `white` (`#ffffff`)
- Surface Alt: `slate-50` (`#f8fafc`)
- Surface Elevated: `slate-100` (`#f1f5f9`)

### Text Colors
Maintain hierarchy with these colors:
- Primary Text: `slate-900` (`#0f172a`) - Headings, important content
- Secondary Text: `slate-600` (`#475569`) - Body text, descriptions
- Tertiary Text: `slate-400` (`#94a3b8`) - Metadata, timestamps, placeholders

### Interactive States
- Border: `slate-200` (`#e2e8f0`)
- Border Focus: `indigo-500` with `ring-2` or `ring-4`
- Success: `green-500` (`#22c55e`)
- Warning: `orange-400` (`#fb923c`)
- Error: `red-500` (`#ef4444`)

---

## Tailwind Config Requirements

Extend `tailwind.config.js` with these semantic names:

```
theme: {
  extend: {
    colors: {
      brand: {
        50: '#eef2ff',
        100: '#e0e7ff',
        500: '#6366f1',
        600: '#4f46e5',
        900: '#312e81',
      },
      surface: {
        DEFAULT: '#ffffff',
        alt: '#f8fafc',
        elevated: '#f1f5f9',
      }
    },
    boxShadow: {
      'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07)',
      'soft-lg': '0 10px 40px -15px rgba(0, 0, 0, 0.1)',
    }
  }
}
```

## Component Styling Rules

### Buttons

Primary CTA
```
bg-slate-900 text-white rounded-full px-8 py-4 font-semibold 
hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl 
transform hover:-translate-y-0.5
```

Secondary Button
```
bg-white text-slate-900 rounded-full px-8 py-4 font-semibold 
hover:bg-slate-50 transition-all border-2 border-slate-200
```

Text Button
```
text-indigo-600 hover:text-indigo-700 font-semibold underline-offset-4
hover:underline transition-colors
```

### Cards

Standard Card
```
bg-white rounded-2xl p-6 border border-slate-200 
shadow-soft hover:shadow-soft-lg transition-all
```

Glass Overlay
```
bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-white/60
```

### Input Fields

Text Input:
```
w-full px-4 py-3 border border-slate-200 rounded-lg 
focus:outline-none focus:ring-2 focus:ring-indigo-500 
focus:border-transparent transition-all
```

Text Area
```
w-full px-4 py-3 border border-slate-200 rounded-lg 
focus:outline-none focus:ring-2 focus:ring-indigo-500 
focus:border-transparent resize-none transition-all
```

### Badges

Status Badge
``px-4 py-2 rounded-full text-sm font-semibold inline-block``
```
Info: bg-blue-100 text-blue-800
Success: bg-green-100 text-green-800
Warning: bg-orange-100 text-orange-800
Error: bg-red-100 text-red-800
```

### Layout Guidelines

Spacing
```
Section Padding: py-16 px-4 sm:px-6 lg:px-8
Card Padding: p-6 or p-8
Component Gaps: gap-4 (standard), gap-6 (generous), gap-8 (section breaks)
Max Width Container: max-w-7xl mx-auto
```

Border Radius
```
Small Elements: rounded-lg (0.5rem)
Cards: rounded-2xl (1rem) or rounded-3xl (1.5rem)
Buttons: rounded-full (9999px)
Input Fields: rounded-lg (0.5rem)
```

Shadows
```
Subtle Depth: shadow-sm or custom shadow-soft
Elevated Cards: shadow-lg or custom shadow-soft-lg
Hover States: Transition from shadow-md to shadow-lg
```

Transitions

All interactive elements should use:
``transition-all duration-200``
or
``transition-colors duration-200``

### Typography Scale

Headings
```
Hero (H1): text-5xl md:text-6xl font-bold text-slate-900
Section (H2): text-4xl font-bold text-slate-900
Subsection (H3): text-2xl font-semibold text-slate-900
Component (H4): text-xl font-semibold text-slate-900
```

Body Text
```
Large: text-lg text-slate-600
Base: text-base text-slate-700
Small: text-sm text-slate-600
Tiny: text-xs text-slate-500
```

Font Weights
```
Regular: font-normal (400)
Medium: font-medium (500)
Semibold: font-semibold (600)
Bold: font-bold (700)
```

### Accessibility Requirements

Text Contrast
✅ MUST achieve 4.5:1 contrast ratio minimum
✅ Use slate-900 for primary text on light backgrounds
✅ Use slate-600 minimum for secondary text

Focus States

All interactive elements MUST have visible focus states:
``focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2``

Touch Targets
```
Minimum size: 44x44px
Buttons should have adequate padding: px-6 py-3 minimum
```

Screen Readers
```
Use semantic HTML (<button>, <nav>, <main>, etc.)
Add aria-label for icon-only buttons
Ensure logical tab order
```

### Visual Effects

Glass Morphism

Use sparingly for hero sections or overlays:
``bg-white/30 backdrop-blur-sm``
or
``bg-white/50 backdrop-blur-md``

### Gradients

Background Gradient (Main):
``bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50``

Text Gradient (Accent):
``bg-gradient-to-r from-blue-400 via-blue-500 to-purple-400 bg-clip-text text-transparent``

Button Hover Gradient:
``hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600``

### Hover States
```
Buttons: hover:-translate-y-0.5 with transform
Cards: hover:shadow-lg transition
Links: hover:text-indigo-700 hover:underline
```

## What to AVOID
❌ Pure Grays: Use slate colors instead for warmth
❌ High Saturation Backgrounds: Tiring to read, unprofessional
❌ Multiple Accent Colors: Creates visual chaos - stick to blue/purple
❌ Thin Borders (< 1px): Looks cheap and hard to see
❌ All Caps Text: Harder to read, feels aggressive
❌ Sharp Corners on Cards: Use rounded-2xl minimum
❌ Low Contrast Text: Always check WCAG compliance
❌ Overuse of Animations: Keep transitions subtle and purposeful

## Implementation Checklist
When creating or modifying UI components:
[ ] Uses semantic color names from brand palette
[ ] Has appropriate hover/focus states
[ ] Meets WCAG AA contrast requirements
[ ] Includes smooth transitions (200ms)
[ ] Uses consistent border radius
[ ] Has generous padding/spacing
[ ] Works responsively (mobile-first)
[ ] Maintains visual hierarchy with text sizes
[ ] Uses rounded corners appropriately
[ ] Includes proper shadow depth

## Quick Class Reference

### Buttons
- `btn-primary` - Main CTA (slate-900, rounded-full with hover lift)
- `btn-secondary` - Secondary action (white with border)
- `btn-ghost` - Minimal button style
- `btn-danger` - Destructive actions (red)
- `btn-sm` - Small button variant (combine with above)
- `btn-lg` - Large button variant (combine with above)

**Usage Examples:**
```tsx
<button className="btn-primary">Sign Up</button>
<button className="btn-secondary btn-lg">Learn More</button>
<Link to="/login" className="btn-primary w-full">Get Started</Link>
```

### Forms
- `input-field` - Standard text input with focus ring
- `input-with-icon` - Input with left icon space (pl-10)
- `textarea-field` - Textarea with same styling as inputs
- `select-field` - Dropdown select

**Usage Examples:**
```tsx
<input type="email" className="input-field" placeholder="you@example.com" />
<input type="text" className="input-with-icon pr-4" /> {/* Icon positioned absolutely */}
<textarea className="textarea-field" rows={4} />
<select className="select-field">...</select>
```

### Links
- `link-primary` - Branded link (indigo with underline on hover)
- `link-secondary` - Subtle link (slate colors)

**Usage Examples:**
```tsx
<Link to="/login" className="link-primary">Sign in</Link>
<a href="/" className="link-secondary">Back to home</a>
```

### Cards
- `card` - Standard card with border and shadow
- `card-hover` - Hoverable card (adds lift effect)
- `card-glass` - Glass morphism effect
- `card-compact` - Smaller padding variant

**Usage Examples:**
```tsx
<div className="card">
  <h3>Card Title</h3>
  <p>Content here</p>
</div>

<Link to="/project/1" className="card-hover">
  ...clickable card content...
</Link>
```

### Badges
- `badge-info` - Blue badge
- `badge-success` - Green badge
- `badge-warning` - Orange badge
- `badge-error` - Red badge  
- `badge-neutral` - Gray badge

**Usage Examples:**
```tsx
<span className="badge-info">New</span>
<span className="badge-success">Active</span>
```

### Layout
- `page-gradient` - Brand gradient background for full pages
- `page-container` - Max-width container (max-w-7xl)
- `section` - Section spacing (py-16 + padding)

**Usage Examples:**
```tsx
<div className="page-gradient">
  <div className="page-container">
    <section className="section">
      ...content...
    </section>
  </div>
</div>
```

### Alerts
- `alert-success` - Success message
- `alert-error` - Error message
- `alert-warning` - Warning message
- `alert-info` - Info message

**Usage Examples:**
```tsx
{error && <div className="alert-error">{error}</div>}
{success && <div className="alert-success">{success}</div>}
```

### Typography
- `heading-hero` - Hero heading (text-5xl md:text-6xl)
- `heading-section` - Section heading (text-4xl)
- `heading-subsection` - Subsection heading (text-2xl)
- `heading-component` - Component heading (text-xl)
- `text-gradient-brand` - Gradient text effect

**Usage Examples:**
```tsx
<h1 className="heading-hero">Welcome to ProjectHub</h1>
<h2 className="heading-section">Featured Projects</h2>
<span className="text-gradient-brand">Startup Projects</span>
```

### Utilities
- `skeleton` - Loading skeleton animation
- `focus-ring` - Focus ring for custom elements
- `hover-scale` - Subtle scale on hover
- `hover-lift` - Lift effect on hover

**Usage Examples:**
```tsx
<div className="skeleton h-20 w-full"></div>
<button className="focus-ring">Custom Button</button>
```

---

## Examples from Existing Codebase

Reference src/pages/Landing.tsx for:
```
Hero section gradient backgrounds
Button styling patterns
Card glass morphism effects
Text gradient implementations
Proper spacing and layout
```

Last Updated: January 2026
Version: v0.1.3