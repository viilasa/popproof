# ProofEdge Design System

A modern, premium design system for the ProofEdge dashboard built with Tailwind CSS and React.

## 🎨 Design Principles

1. **Clean & Minimal** - Reduce visual noise, focus on content
2. **Premium Feel** - Soft shadows, smooth animations, refined typography
3. **Consistent** - Unified spacing, colors, and component patterns
4. **Accessible** - WCAG compliant contrast ratios, keyboard navigation
5. **Responsive** - Mobile-first, works on all screen sizes

---

## 📝 Typography

### Font Family
- **Primary**: Satoshi (from Fontshare)
- **Fallback**: system-ui, -apple-system, sans-serif

### Font Weights
- Light: 300
- Regular: 400
- Medium: 500
- Bold: 700
- Black: 900

### Usage
```jsx
// Headings
<h1 className="text-3xl font-bold tracking-tight">Heading 1</h1>
<h2 className="text-2xl font-semibold">Heading 2</h2>
<h3 className="text-xl font-semibold">Heading 3</h3>

// Body
<p className="text-base text-surface-700">Body text</p>
<p className="text-sm text-surface-500">Secondary text</p>
<p className="text-xs text-surface-400">Caption text</p>
```

---

## 🎨 Color Palette

### Brand Colors (Primary)
| Token | Hex | Usage |
|-------|-----|-------|
| brand-50 | #eef2ff | Light backgrounds |
| brand-100 | #e0e7ff | Hover states |
| brand-500 | #6366f1 | Primary actions |
| brand-600 | #4f46e5 | Primary buttons |
| brand-700 | #4338ca | Hover states |
| brand-900 | #312e81 | Dark accents |

### Surface Colors (Neutrals)
| Token | Hex | Usage |
|-------|-----|-------|
| surface-50 | #fafafa | Page backgrounds |
| surface-100 | #f4f4f5 | Card backgrounds |
| surface-200 | #e4e4e7 | Borders |
| surface-500 | #71717a | Secondary text |
| surface-700 | #3f3f46 | Primary text |
| surface-900 | #18181b | Headings |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| success-500 | #10b981 | Success states |
| warning-500 | #f59e0b | Warning states |
| danger-500 | #ef4444 | Error states |

---

## 📐 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| 1 | 0.25rem (4px) | Tight spacing |
| 2 | 0.5rem (8px) | Small gaps |
| 3 | 0.75rem (12px) | Icon gaps |
| 4 | 1rem (16px) | Default spacing |
| 5 | 1.25rem (20px) | Medium spacing |
| 6 | 1.5rem (24px) | Section spacing |
| 8 | 2rem (32px) | Large spacing |
| 10 | 2.5rem (40px) | Extra large |
| 12 | 3rem (48px) | Section gaps |

---

## 🔲 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| rounded-md | 0.375rem | Small elements |
| rounded-lg | 0.5rem | Buttons, inputs |
| rounded-xl | 0.75rem | Cards |
| rounded-2xl | 1rem | Large cards |
| rounded-3xl | 1.5rem | Hero sections |
| rounded-full | 9999px | Avatars, badges |

---

## 🌑 Shadows

### Soft Shadow System
```css
shadow-soft-xs   /* Subtle, barely visible */
shadow-soft-sm   /* Light elevation */
shadow-soft      /* Default card shadow */
shadow-soft-md   /* Hover states */
shadow-soft-lg   /* Modals, dropdowns */
shadow-soft-xl   /* Floating elements */
```

### Glow Effects
```css
shadow-glow-brand   /* Brand color glow */
shadow-glow-success /* Success color glow */
```

---

## 🧩 Components

### Button
```jsx
import { Button } from '@/components/ui';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With icons
<Button leftIcon={<Plus />}>Add Item</Button>
<Button rightIcon={<ArrowRight />}>Continue</Button>

// Loading state
<Button isLoading>Saving...</Button>
```

### Card
```jsx
import { Card, StatCard, GlassCard } from '@/components/ui';

// Basic card
<Card>Content here</Card>

// Hoverable card
<Card hover>Hoverable content</Card>

// Stat card
<StatCard
  label="Total Views"
  value="12,543"
  change={12.5}
  icon={<Eye className="w-5 h-5 text-brand-600" />}
/>

// Glass card (blur effect)
<GlassCard>Glassmorphism content</GlassCard>
```

### Input
```jsx
import { Input, SearchInput } from '@/components/ui';

// Basic input
<Input label="Email" placeholder="Enter email" />

// With error
<Input label="Password" error="Password is required" />

// With icons
<Input leftIcon={<Mail />} placeholder="Email" />

// Search input
<SearchInput onSearch={(value) => console.log(value)} />
```

### Badge
```jsx
import { Badge, StatusBadge } from '@/components/ui';

// Variants
<Badge variant="brand">New</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Error</Badge>

// With dot
<Badge dot variant="success">Online</Badge>

// Status badge with pulse
<StatusBadge pulse>Live</StatusBadge>
```

### Avatar
```jsx
import { Avatar, AvatarGroup } from '@/components/ui';

// With image
<Avatar src="/user.jpg" alt="John Doe" />

// With initials
<Avatar name="John Doe" />

// With status
<Avatar name="John Doe" status="online" />

// Sizes
<Avatar size="xs" name="JD" />
<Avatar size="sm" name="JD" />
<Avatar size="md" name="JD" />
<Avatar size="lg" name="JD" />
<Avatar size="xl" name="JD" />

// Avatar group
<AvatarGroup
  avatars={[
    { name: 'John Doe' },
    { name: 'Jane Smith' },
    { name: 'Bob Wilson' },
  ]}
  max={3}
/>
```

### Loaders
```jsx
import { Spinner, LoadingDots, PulseLoader, PageLoader } from '@/components/ui';

// Spinner
<Spinner size="md" color="brand" />

// Loading dots
<LoadingDots />

// Pulse loader
<PulseLoader />

// Full page loader
<PageLoader message="Loading dashboard..." />
```

### Skeleton
```jsx
import { Skeleton, CardSkeleton, StatSkeleton } from '@/components/ui';

// Basic skeleton
<Skeleton width={200} height={20} />

// Card skeleton
<CardSkeleton />

// Stat skeleton
<StatSkeleton />
```

---

## ✨ Animations

### Built-in Animations
```css
animate-fade-in        /* Fade in */
animate-fade-in-up     /* Fade in from bottom */
animate-fade-in-down   /* Fade in from top */
animate-slide-in-right /* Slide from right */
animate-slide-in-left  /* Slide from left */
animate-scale-in       /* Scale up */
animate-pulse-soft     /* Gentle pulse */
animate-shimmer        /* Loading shimmer */
animate-bounce-soft    /* Gentle bounce */
```

### Stagger Animation
```jsx
// Children animate in sequence
<div className="stagger-children">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Transition Utilities
```css
transition-all duration-200 ease-smooth  /* Smooth transition */
transition-all duration-200 ease-bounce  /* Bouncy transition */
hover-lift                               /* Lift on hover */
```

---

## 🌙 Dark Mode

Dark mode is supported via the `dark` class on the HTML element.

```jsx
// Toggle dark mode
document.documentElement.classList.toggle('dark');
```

Components automatically adapt to dark mode when properly configured.

---

## 📱 Responsive Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablets |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |
| 2xl | 1536px | Extra large |

---

## 🔧 Usage

### Import Components
```jsx
import { 
  Button, 
  Card, 
  Input, 
  Badge, 
  Avatar,
  Spinner,
  Skeleton 
} from '@/components/ui';
```

### CSS Classes
All design system classes are available globally:
```jsx
// Cards
<div className="card">...</div>
<div className="card-hover">...</div>
<div className="card-glass">...</div>

// Buttons
<button className="btn btn-primary btn-md">...</button>

// Inputs
<input className="input" />

// Badges
<span className="badge badge-success">...</span>
```

---

## 📁 File Structure

```
src/
├── components/
│   └── ui/
│       ├── index.ts        # Export all components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Badge.tsx
│       ├── Avatar.tsx
│       ├── Skeleton.tsx
│       ├── Loaders.tsx
│       └── LiveIndicator.tsx
├── index.css               # Global styles & design tokens
└── ...
```

---

## 🚀 Best Practices

1. **Use semantic color tokens** - Use `brand-600` instead of hardcoded hex values
2. **Consistent spacing** - Use the spacing scale (4, 8, 12, 16, 24, 32...)
3. **Soft shadows** - Prefer `shadow-soft` variants for a premium feel
4. **Smooth transitions** - Add `transition-all duration-200` for interactions
5. **Accessible contrast** - Ensure text meets WCAG AA standards
6. **Mobile-first** - Design for mobile, enhance for desktop
