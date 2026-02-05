# CLAUDE.md - Master Project Configuration

> **This file is loaded automatically by Claude Code at the start of every session.**
> Treat this as the authoritative source for project standards, workflows, and design systems.

---

## SECTION A: UNIVERSAL PROJECT STANDARDS

This section applies to ALL projects. Project-specific details go in Section B.

---

### 1. PROJECT MANAGEMENT & AGENT ORCHESTRATION

#### 1.1 Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    PM AGENT (Orchestrator)                      │
│  - Owns overall project vision and task decomposition           │
│  - Maintains project state and progress tracking                │
│  - Delegates to specialized subagents                           │
│  - Reviews and integrates subagent outputs                      │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  ARCHITECT    │   │   FRONTEND    │   │   BACKEND     │
│  SUBAGENT     │   │   SUBAGENT    │   │   SUBAGENT    │
│               │   │               │   │               │
│ - System      │   │ - UI/UX impl  │   │ - API design  │
│   design      │   │ - Animations  │   │ - Database    │
│ - Tech        │   │ - Styling     │   │ - Auth/Logic  │
│   decisions   │   │ - Components  │   │ - Integrations│
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │   QA/TEST     │
                    │   SUBAGENT    │
                    │               │
                    │ - Testing     │
                    │ - Validation  │
                    │ - Deployment  │
                    └───────────────┘
```

#### 1.2 Subagent Usage Guidelines

**IMPORTANT:** Use subagents for tasks that require exploration or research to preserve main context.

```bash
# Spawn a subagent for research tasks
"Use a subagent to investigate [specific topic] and report back a summary"

# Example: Architecture research
"Use a subagent to analyze our current auth system and document how token refresh works"

# Example: Code exploration  
"Use a subagent to find all API endpoints and their response schemas"
```

**When to use subagents:**
- Codebase exploration (reading many files)
- Research tasks that don't require immediate action
- Parallel investigation of multiple approaches
- Complex refactoring analysis

**When NOT to use subagents:**
- Simple file edits
- Direct implementation tasks
- When you need immediate context continuity

#### 1.3 Task Decomposition Pattern

For any new feature or task:

1. **Define** - Clear acceptance criteria
2. **Design** - Architecture and approach
3. **Implement** - Code the solution
4. **Test** - Verify functionality
5. **Review** - Code quality check
6. **Deploy** - Ship to production

---

### 2. DESIGN SYSTEM: CROWE BRAND IDENTITY

> **CRITICAL:** All UI must align with Crowe's official digital brand guidelines. Crowe Indigo and Crowe Amber are the dominant primary colors. Secondary colors (Teal, Cyan, Blue, Violet, Coral) accent but never dominate. Designs should feel clean, professional, trustworthy, and modern.

> **Source of truth:** https://www.crowedigitalbrand.com

#### 2.1 Typography System

**Primary Font: Helvetica Now**
Crowe's brand typeface is **Helvetica Now**, transitioning from the legacy Helvetica family. It is optimized for digital platforms with superior legibility.

```css
/* ─────────────────────────────────────────────────
   CROWE TYPOGRAPHY SYSTEM
   Primary: Helvetica Now (licensed — must be self-hosted or loaded via Adobe Fonts)
   Fallback: Arial → Helvetica Neue → system-ui (web-safe chain)
   ───────────────────────────────────────────────── */

/* Headlines & Display — Helvetica Now Display Bold */
--font-display: 'Helvetica Now Display', 'Helvetica Neue', Arial, system-ui, sans-serif;

/* Subheadings — Helvetica Now Text Bold */
--font-subhead: 'Helvetica Now Text', 'Helvetica Neue', Arial, system-ui, sans-serif;

/* Body & UI — Helvetica Now Text Regular */
--font-body: 'Helvetica Now Text', 'Helvetica Neue', Arial, system-ui, sans-serif;

/* Monospace (Code/Data) — not part of Crowe brand, choose a clean mono */
--font-mono: 'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'Consolas', monospace;
```

**Type Styling Rules:**
- **Headlines:** Helvetica Now Display Bold — captures attention, sets the stage
- **Subheadings:** Helvetica Now Text Bold — mirrors body style, no paragraph space, underscores important info without disrupting flow
- **Body copy:** Helvetica Now Text Regular — comfortable reading experience
- **Captions/Labels:** Helvetica Now Text Regular at smaller sizes

**Type Scale (rem-based):**
```css
--text-xs: 0.75rem;    /* 12px - captions, labels */
--text-sm: 0.875rem;   /* 14px - secondary text */
--text-base: 1rem;     /* 16px - body text */
--text-lg: 1.125rem;   /* 18px - emphasized body */
--text-xl: 1.25rem;    /* 20px - small headings */
--text-2xl: 1.5rem;    /* 24px - section headings */
--text-3xl: 1.875rem;  /* 30px - page headings */
--text-4xl: 2.25rem;   /* 36px - hero headings */
--text-5xl: 3rem;      /* 48px - display text */
--text-6xl: 3.75rem;   /* 60px - large display */
```

**NEVER do:**
- Use non-brand-compliant fonts
- Neglect line spacing and letter spacing
- Compromise readability with excessively small font sizes
- Clutter designs with too many font weights or styles
- Use more than 2 font families per project (brand + mono for code only)

**Font Loading Strategy (Next.js):**
```tsx
// If self-hosting Helvetica Now (with license):
import localFont from 'next/font/local';

const helveticaNowDisplay = localFont({
  src: [
    { path: './fonts/HelveticaNowDisplay-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
});

const helveticaNowText = localFont({
  src: [
    { path: './fonts/HelveticaNowText-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/HelveticaNowText-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
});

// If NOT licensed, use the closest web-safe fallback stack:
// font-family: Arial, 'Helvetica Neue', Helvetica, system-ui, sans-serif;
```

#### 2.2 Color System — Crowe Official Brand Palette

> **Philosophy:** Crowe Indigo and Crowe Amber are the foundation. They must be dominant across digital assets. Secondary colors complement and accentuate — they should never overshadow the primaries. Crowe uses a **unified color approach** (no color-coding for departments or service lines).

**DO NOT:**
- Use secondary colors for text
- Use secondary colors for backgrounds
- Use gradients as backgrounds (only in SmartPath, data visuals, infographics)
- Use large areas of black for backgrounds or assets
- Let a secondary color dominate any application
- Choose low-contrast text/background combinations

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     CROWE PRIMARY COLORS
     These are the foundation — must dominate all digital assets
     ═══════════════════════════════════════════════════════════════ */
  --crowe-amber-bright: #FFD231;     /* RGB 255, 210, 49 */
  --crowe-amber-core: #F5A800;       /* RGB 245, 168, 0 — PRIMARY */
  --crowe-amber-dark: #D7761D;       /* RGB 215, 118, 29 */

  --crowe-indigo-bright: #003F9F;    /* RGB 0, 63, 159 */
  --crowe-indigo-core: #002E62;      /* RGB 0, 46, 98 */
  --crowe-indigo-dark: #011E41;      /* RGB 1, 30, 65 — PRIMARY */

  /* ═══════════════════════════════════════════════════════════════
     CROWE SECONDARY COLORS
     Complement primaries — never overshadow, never for text/backgrounds
     ═══════════════════════════════════════════════════════════════ */
  --crowe-teal-bright: #16D9BC;      /* RGB 22, 217, 188 */
  --crowe-teal-core: #05AB8C;        /* RGB 5, 171, 140 */
  --crowe-teal-dark: #0C7876;        /* RGB 12, 120, 118 */

  --crowe-cyan-light: #8FE1FF;       /* RGB 143, 225, 255 */
  --crowe-cyan-core: #54C0E8;        /* RGB 84, 192, 232 */
  --crowe-cyan-dark: #007DA3;        /* RGB 0, 125, 163 */

  --crowe-blue-light: #32A8FD;       /* RGB 50, 168, 253 */
  --crowe-blue-core: #0075C9;        /* RGB 0, 117, 201 */
  --crowe-blue-dark: #0050AD;        /* RGB 0, 80, 173 */

  --crowe-violet-bright: #EA80FF;    /* RGB 234, 128, 255 */
  --crowe-violet-core: #B14FC5;      /* RGB 177, 79, 197 */
  --crowe-violet-dark: #612080;      /* RGB 97, 32, 128 */

  --crowe-coral-bright: #FF526F;     /* RGB 255, 82, 111 */
  --crowe-coral-core: #E5376B;       /* RGB 229, 55, 107 */
  --crowe-coral-dark: #992A5C;       /* RGB 153, 42, 92 */

  /* ═══════════════════════════════════════════════════════════════
     NEUTRAL TINTS (UI-specific — for text, borders, backgrounds)
     ═══════════════════════════════════════════════════════════════ */
  --crowe-white: #FFFFFF;
  --crowe-black: #000000;
  --crowe-tint-900: #333333;         /* Primary text on light backgrounds */
  --crowe-tint-700: #4F4F4F;         /* Secondary text */
  --crowe-tint-500: #828282;         /* Muted/placeholder text */
  --crowe-tint-300: #BDBDBD;         /* Borders, dividers */
  --crowe-tint-100: #E0E0E0;         /* Subtle borders, hairlines */

  /* ═══════════════════════════════════════════════════════════════
     SEMANTIC TOKENS (map to brand colors for consistent usage)
     ═══════════════════════════════════════════════════════════════ */
  --color-text-primary: var(--crowe-tint-900);
  --color-text-secondary: var(--crowe-tint-700);
  --color-text-muted: var(--crowe-tint-500);
  --color-text-inverse: var(--crowe-white);
  --color-text-brand: var(--crowe-indigo-dark);

  --color-surface-primary: var(--crowe-white);
  --color-surface-secondary: #F7F7F7;
  --color-surface-elevated: var(--crowe-white);
  --color-surface-brand: var(--crowe-indigo-dark);
  --color-surface-accent: var(--crowe-amber-core);

  --color-accent-primary: var(--crowe-amber-core);
  --color-accent-primary-hover: var(--crowe-amber-dark);
  --color-accent-secondary: var(--crowe-indigo-core);

  --color-border: var(--crowe-tint-100);
  --color-border-strong: var(--crowe-tint-300);

  /* Functional colors (use sparingly, aligned to brand) */
  --color-success: #05AB8C;           /* Crowe Teal */
  --color-warning: var(--crowe-amber-core);
  --color-error: var(--crowe-coral-core);
  --color-info: var(--crowe-blue-core);
}
```

**Color Rules:**
1. **Indigo + Amber dominate:** 60% Indigo/neutral foundation, 30% white/light surfaces, 10% Amber accents
2. **Secondary colors are accents only:** Use for data visualization, infographics, icons, SmartPath elements — never for text, backgrounds, or dominant UI elements
3. **No gradient backgrounds:** Gradients are reserved for SmartPath device, data visuals, and infographics only
4. **No large black areas:** Avoid pure black (#000000) as a background. Use Crowe Indigo Dark (#011E41) for dark sections instead
5. **Accessibility first:** All text must meet WCAG 2.1 AA (4.5:1 ratio minimum). Test contrast between text and background
6. **Unified color approach:** Never assign colors to specific departments, service lines, or asset types. Brand consistency > differentiation

**Tailwind CSS Integration:**
```javascript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        crowe: {
          amber: {
            bright: '#FFD231',
            DEFAULT: '#F5A800',
            dark: '#D7761D',
          },
          indigo: {
            bright: '#003F9F',
            DEFAULT: '#002E62',
            dark: '#011E41',
          },
          teal: {
            bright: '#16D9BC',
            DEFAULT: '#05AB8C',
            dark: '#0C7876',
          },
          cyan: {
            light: '#8FE1FF',
            DEFAULT: '#54C0E8',
            dark: '#007DA3',
          },
          blue: {
            light: '#32A8FD',
            DEFAULT: '#0075C9',
            dark: '#0050AD',
          },
          violet: {
            bright: '#EA80FF',
            DEFAULT: '#B14FC5',
            dark: '#612080',
          },
          coral: {
            bright: '#FF526F',
            DEFAULT: '#E5376B',
            dark: '#992A5C',
          },
        },
        tint: {
          900: '#333333',
          700: '#4F4F4F',
          500: '#828282',
          300: '#BDBDBD',
          100: '#E0E0E0',
        },
      },
      fontFamily: {
        display: ['Helvetica Now Display', 'Helvetica Neue', 'Arial', 'system-ui', 'sans-serif'],
        body: ['Helvetica Now Text', 'Helvetica Neue', 'Arial', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'Consolas', 'monospace'],
      },
    },
  },
};
```

#### 2.3 Spacing & Layout

**8px Grid System:**
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

**Border Radius (clean and professional — avoid excessive rounding):**
```css
--radius-sm: 4px;     /* Buttons, inputs */
--radius-md: 8px;     /* Cards, containers */
--radius-lg: 12px;    /* Modals, large cards */
--radius-xl: 16px;    /* Feature sections */
--radius-full: 9999px; /* Pills, avatars only */
```

#### 2.4 Surface Treatments & Backgrounds

> **Crowe brand rule:** No gradient backgrounds. Clean, professional surfaces. White is an essential part of the design language — it offers contrast, clarity, and balance.

```css
/* Clean white surface — default for most layouts */
.bg-crowe-clean {
  background: var(--crowe-white);
}

/* Subtle off-white for secondary sections */
.bg-crowe-subtle {
  background: #F7F7F7;
}

/* Indigo brand surface — hero sections, footers, CTAs */
.bg-crowe-brand {
  background: var(--crowe-indigo-dark);
  color: var(--crowe-white);
}

/* Subtle grid pattern - neutral foundation */
.bg-grid {
  background:
    linear-gradient(to bottom, #FFFFFF 0%, #F7F7F7 100%),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 1px,
      rgba(0, 0, 0, 0.015) 1px,
      rgba(0, 0, 0, 0.015) 2px
    );
}

/* Glassmorphism for elevated surfaces (modals, popovers) */
.bg-glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

/* Dot pattern overlay (use sparingly for texture) */
.bg-dots {
  background-image: radial-gradient(
    circle,
    var(--crowe-tint-300) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
}
```

#### 2.5 Shadow System

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03);

/* Elevation on hover */
--shadow-hover: 0 12px 24px rgba(0, 0, 0, 0.12);
```

---

### 3. ANIMATION SYSTEM

> **Principle:** Animations serve UX purposes—they're not decoration. Every animation must have a functional reason. Keep the Crowe brand feeling polished, professional, and modern with smooth, intentional motion.

#### 3.1 Timing & Easing

```css
/* Duration tokens */
--duration-instant: 75ms;    /* Micro-feedback */
--duration-fast: 150ms;      /* Hover states, toggles */
--duration-normal: 250ms;    /* Standard transitions */
--duration-slow: 350ms;      /* Complex state changes */
--duration-slower: 500ms;    /* Page transitions, reveals */

/* Easing curves */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* Enter animations */
--ease-in: cubic-bezier(0.7, 0, 0.84, 0);       /* Exit animations */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* Symmetric animations */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy feel */
```

#### 3.2 Animation Library: Anime.js v4

**Installation:**
```bash
npm install animejs
```

**Basic Usage (React):**
```jsx
import { animate, stagger, createScope } from 'animejs';
import { useEffect, useRef } from 'react';

function AnimatedComponent() {
  const root = useRef(null);
  const scope = useRef(null);

  useEffect(() => {
    scope.current = createScope({ root }).add(self => {
      // Staggered entrance animation
      animate('.card', {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        delay: stagger(80, { from: 'first' }),
        ease: 'outQuint'
      });
    });

    return () => scope.current?.revert();
  }, []);

  return <div ref={root}>{/* content */}</div>;
}
```

**Common Animation Patterns:**

```javascript
// Page load reveal
animate('.hero-content', {
  opacity: [0, 1],
  translateY: [30, 0],
  duration: 800,
  delay: 200,
  ease: 'outQuint'
});

// Hover micro-interaction
animate(element, {
  scale: 1.02,
  duration: 200,
  ease: 'outQuad'
});

// Scroll-triggered animation
import { createScope, animate, onScroll } from 'animejs';

onScroll({
  target: '.section',
  enter: 'bottom 80%',
  onEnter: () => {
    animate('.section .content', {
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 700,
      ease: 'outQuint'
    });
  }
});

// Crowe Amber accent pulse (e.g., CTA button glow)
animate('.cta-button', {
  boxShadow: [
    '0 0 0 0 rgba(245, 168, 0, 0.4)',
    '0 0 0 12px rgba(245, 168, 0, 0)',
  ],
  duration: 1500,
  loop: true,
  ease: 'outQuad'
});

// Number counter (stats, metrics)
animate('.stat-number', {
  innerHTML: [0, 500],
  round: 1,
  duration: 2000,
  ease: 'outExpo'
});
```

#### 3.3 Alternative: Framer Motion (React-specific)

**When to use Motion over Anime.js:**
- React-only projects
- Gesture-heavy interfaces
- Layout animations
- AnimatePresence (mount/unmount animations)

```jsx
import { motion, AnimatePresence } from 'framer-motion';

// Basic animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
>
  Content
</motion.div>

// Staggered children
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => <motion.li key={i} variants={item}>{i}</motion.li>)}
</motion.ul>

// Crowe-branded page transition
const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.35, ease: [0.65, 0, 0.35, 1] }
};

// Scroll-triggered reveal with Crowe Indigo underline
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-100px' }}
  transition={{ duration: 0.6, ease: 'easeOut' }}
>
  <h2>Smart decisions today.</h2>
  <motion.div
    className="h-1 bg-crowe-amber"
    initial={{ width: 0 }}
    whileInView={{ width: '100%' }}
    transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
  />
</motion.div>
```

#### 3.4 Animation Rules

**DO:**
- Use animations to provide feedback (button press, form submission)
- Animate state changes to maintain context
- Use staggered animations for lists (50-100ms delay between items)
- Respect `prefers-reduced-motion`
- Use Crowe Amber for attention-drawing micro-animations (glows, underlines)
- Use smooth, professional easing — the brand is trustworthy and polished

**DON'T:**
- Add animation for decoration alone
- Use durations longer than 500ms for UI elements
- Animate multiple properties simultaneously (sequencing is better)
- Block user interaction during animations
- Use flashy/playful animations that undermine Crowe's professional tone

```css
/* Always respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 4. DEVELOPMENT STANDARDS

#### 4.1 Tech Stack (Default)

```
Framework:     Next.js 14+ (App Router)
Styling:       Tailwind CSS + CSS Variables (Crowe brand tokens)
Animation:     Anime.js v4 + Framer Motion
UI Components: shadcn/ui (themed to Crowe palette)
State:         React Context + Zustand (if needed)
Database:      Prisma + PostgreSQL (Vercel Postgres/Supabase)
Auth:          NextAuth.js or Clerk
Testing:       Vitest + React Testing Library
Deployment:    Vercel
```

#### 4.2 shadcn/ui — Crowe Theme Configuration

When initializing shadcn, override the default theme to match Crowe's brand:

```css
/* globals.css — shadcn theme overrides for Crowe brand */
@layer base {
  :root {
    --background: 0 0% 100%;              /* #FFFFFF */
    --foreground: 0 0% 20%;               /* #333333 */
    --card: 0 0% 100%;
    --card-foreground: 0 0% 20%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 20%;
    --primary: 215 100% 13%;              /* Crowe Indigo Dark #011E41 */
    --primary-foreground: 0 0% 100%;
    --secondary: 39 100% 48%;             /* Crowe Amber #F5A800 */
    --secondary-foreground: 215 100% 13%;
    --muted: 0 0% 97%;                    /* #F7F7F7 */
    --muted-foreground: 0 0% 31%;         /* #4F4F4F */
    --accent: 39 100% 48%;               /* Crowe Amber */
    --accent-foreground: 215 100% 13%;
    --destructive: 341 79% 56%;           /* Crowe Coral #E5376B */
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 88%;                   /* #E0E0E0 */
    --input: 0 0% 88%;
    --ring: 215 100% 19%;                 /* Crowe Indigo Core #002E62 */
    --radius: 0.5rem;
  }
}
```

#### 4.3 Code Style

**TypeScript:**
```typescript
// ✅ Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Use type for unions/intersections
type Status = 'idle' | 'loading' | 'success' | 'error';

// ✅ Always type function parameters and returns
function getUser(id: string): Promise<User | null> {
  // implementation
}

// ❌ Never use `any`
// ❌ Avoid type assertions unless absolutely necessary
```

**React:**
```tsx
// ✅ Functional components with TypeScript
interface Props {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children }: Props) {
  return (
    <article className="card">
      <h2>{title}</h2>
      {children}
    </article>
  );
}

// ✅ Use named exports (not default)
// ✅ Colocate styles, tests, and components
```

**File Naming:**
```
components/
  Button/
    Button.tsx          # Component
    Button.test.tsx     # Tests
    Button.module.css   # Styles (if not using Tailwind)
    index.ts            # Re-export

# Use PascalCase for components, kebab-case for routes
app/
  dashboard/
    page.tsx
    layout.tsx
```

#### 4.4 Git Workflow

**Branch Naming:**
```
feature/[ticket-id]-short-description
bugfix/[ticket-id]-short-description
hotfix/[ticket-id]-short-description
refactor/short-description
```

**Commit Messages (Conventional Commits):**
```
feat: add user authentication flow
fix: resolve race condition in data fetching
docs: update API documentation
style: format code with prettier
refactor: simplify form validation logic
test: add unit tests for Button component
chore: update dependencies
```

**Before every commit:**
```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run test        # Run tests
```

**Pre-commit Hooks (Husky + lint-staged):**

```bash
# Install
npm install -D husky lint-staged
npx husky init
```

**`.husky/pre-commit`:**
```bash
#!/usr/bin/env sh
npx lint-staged
```

**`package.json` addition:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

---

### 5. DEPLOYMENT (VERCEL)

#### 5.1 Initial Setup

**Create new project with GitHub integration:**
```bash
# Initialize git if not already
git init
git add .
git commit -m "feat: initial project setup"

# Create GitHub repo and push
gh repo create [project-name] --public --source=. --remote=origin --push

# Link to Vercel (interactive)
vercel

# Or non-interactive
vercel --yes
```

#### 5.2 vercel.json Configuration

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-DNS-Prefetch-Control", "value": "on" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/fonts/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "env": {
    "NEXT_TELEMETRY_DISABLED": "1"
  }
}
```

#### 5.3 Environment Variables

**Required for all projects:**
```env
# .env.local (local development)
# .env.production (Vercel dashboard)

# Database
DATABASE_URL="postgresql://..."

# Authentication (if using NextAuth)
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="[generate with: openssl rand -base64 32]"

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID="..."
```

**Set via CLI:**
```bash
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
```

#### 5.4 Deployment Commands

```bash
# Preview deployment (from any branch)
vercel

# Production deployment
vercel --prod

# Deploy from CI/CD (GitHub Actions)
# See .github/workflows/deploy.yml
```

---

### 6. GITHUB REPOSITORY SETUP

#### 6.1 Create New Repository

**GitHub Username:** `achyuthrachur`

**One-liner for new projects:**
```bash
# From project root (after git init and initial commit)
gh repo create achyuthrachur/[project-name] --public --source=. --remote=origin --push
```

**With description and settings:**
```bash
gh repo create achyuthrachur/[project-name] \
  --public \
  --description "Brief project description" \
  --source=. \
  --remote=origin \
  --push
```

**Private repository:**
```bash
gh repo create achyuthrachur/[project-name] --private --source=. --remote=origin --push
```

#### 6.2 Repository Settings

**After creation, configure:**
```bash
# Enable branch protection (main)
gh api repos/achyuthrachur/[project-name]/branches/main/protection \
  -X PUT \
  -F "required_status_checks[strict]=true" \
  -F "required_status_checks[contexts][]=build" \
  -F "enforce_admins=false" \
  -F "required_pull_request_reviews[required_approving_review_count]=0"

# Add topics for discoverability
gh repo edit achyuthrachur/[project-name] \
  --add-topic nextjs \
  --add-topic typescript \
  --add-topic vercel
```

#### 6.3 CI/CD Workflows

**Create `.github/workflows/` directory structure:**
```
.github/
  workflows/
    ci.yml           # Lint, type-check, test on PRs
    deploy.yml       # Auto-deploy to Vercel
    lighthouse.yml   # Performance audits (optional)
```

**`.github/workflows/ci.yml` - Continuous Integration:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Run tests
        run: npm run test -- --coverage

      - name: Build
        run: npm run build
```

**`.github/workflows/deploy.yml` - Vercel Deployment:**
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    name: Deploy Production
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Required GitHub Secrets for Vercel deployment:**
```bash
# Get these from Vercel dashboard or CLI
VERCEL_TOKEN       # Account Settings > Tokens
VERCEL_ORG_ID      # From .vercel/project.json after `vercel link`
VERCEL_PROJECT_ID  # From .vercel/project.json after `vercel link`

# Add secrets via CLI
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
```

#### 6.4 Essential Files

**Always include:**
```
.gitignore          # Node, Next.js patterns
.env.example        # Template for environment variables
README.md           # Project documentation
LICENSE             # MIT or appropriate license
CLAUDE.md           # This file
```

**.gitignore (Next.js):**
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
.next/
out/
build/
dist/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/*
!.vscode/extensions.json

# OS
.DS_Store
Thumbs.db

# Vercel
.vercel

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

---

### 7. TERMINAL COMMANDS REFERENCE

```bash
# ─────────────────────────────────────────────────────────────────
# DEVELOPMENT
# ─────────────────────────────────────────────────────────────────
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
npm run lint:fix      # Run ESLint with auto-fix
npm run typecheck     # TypeScript check
npm run test          # Run tests
npm run test:watch    # Tests in watch mode
npm run test:coverage # Tests with coverage report

# ─────────────────────────────────────────────────────────────────
# DEPLOYMENT (VERCEL)
# ─────────────────────────────────────────────────────────────────
vercel                # Preview deployment
vercel --prod         # Production deployment
vercel env pull       # Sync env vars locally
vercel logs           # View deployment logs
vercel ls             # List all deployments
vercel rm [url]       # Remove a deployment

# ─────────────────────────────────────────────────────────────────
# GIT & GITHUB
# ─────────────────────────────────────────────────────────────────
# Repository
gh repo create achyuthrachur/[name] --public --source=. --remote=origin --push
gh repo view --web                    # Open repo in browser
gh repo clone achyuthrachur/[name]    # Clone a repo

# Branches
git checkout -b feature/[name]        # Create feature branch
git push -u origin feature/[name]     # Push and set upstream

# Pull Requests
gh pr create                          # Create PR (interactive)
gh pr create --fill                   # Create PR with commit info
gh pr list                            # List open PRs
gh pr view [number]                   # View PR details
gh pr merge [number]                  # Merge PR
gh pr checkout [number]               # Checkout PR locally

# Issues
gh issue create                       # Create issue
gh issue list                         # List issues
gh issue close [number]               # Close issue

# Actions/Workflows
gh run list                           # List workflow runs
gh run view [id]                      # View run details
gh run watch                          # Watch current run

# Secrets
gh secret set [NAME]                  # Set a secret (interactive)
gh secret list                        # List secrets

# ─────────────────────────────────────────────────────────────────
# DATABASE (PRISMA - if applicable)
# ─────────────────────────────────────────────────────────────────
npx prisma generate                   # Generate Prisma Client
npx prisma db push                    # Push schema to database
npx prisma db pull                    # Pull schema from database
npx prisma migrate dev                # Create migration
npx prisma migrate deploy             # Deploy migrations (prod)
npx prisma studio                     # Open database GUI
npx prisma format                     # Format schema file

# ─────────────────────────────────────────────────────────────────
# UTILITIES
# ─────────────────────────────────────────────────────────────────
npx create-next-app@latest [name]     # Create new Next.js project
npx shadcn@latest init                # Initialize shadcn/ui
npx shadcn@latest add [component]     # Add shadcn component
npm outdated                          # Check for outdated packages
npm update                            # Update packages
```

---

### 8. NEW PROJECT INITIALIZATION WORKFLOW

**Complete checklist for starting a new project:**

```bash
# ─────────────────────────────────────────────────────────────────
# STEP 1: CREATE PROJECT
# ─────────────────────────────────────────────────────────────────
npx create-next-app@latest [project-name] \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd [project-name]

# ─────────────────────────────────────────────────────────────────
# STEP 2: INSTALL CORE DEPENDENCIES
# ─────────────────────────────────────────────────────────────────
# UI Components (themed to Crowe palette)
npx shadcn@latest init

# Animation (both recommended for full flexibility)
npm install animejs                    # Anime.js v4
npm install framer-motion              # Framer Motion

# Dev tools
npm install -D husky lint-staged prettier

# ─────────────────────────────────────────────────────────────────
# STEP 3: SETUP CROWE BRAND FONTS
# ─────────────────────────────────────────────────────────────────
# If licensed: place Helvetica Now .woff2 files in src/fonts/
# If not licensed: configure Arial fallback stack in tailwind.config.ts
# Update globals.css with Crowe color tokens from Section 2.2

# ─────────────────────────────────────────────────────────────────
# STEP 4: SETUP LINTING & FORMATTING
# ─────────────────────────────────────────────────────────────────
# Initialize Husky
npx husky init
echo "npx lint-staged" > .husky/pre-commit

# Add to package.json:
# "lint-staged": { "*.{ts,tsx}": ["eslint --fix", "prettier --write"] }

# ─────────────────────────────────────────────────────────────────
# STEP 5: CREATE GITHUB REPO & PUSH
# ─────────────────────────────────────────────────────────────────
git add .
git commit -m "feat: initial project setup with Crowe brand system"
gh repo create achyuthrachur/[project-name] --public --source=. --remote=origin --push

# ─────────────────────────────────────────────────────────────────
# STEP 6: SETUP VERCEL
# ─────────────────────────────────────────────────────────────────
vercel link
vercel env pull .env.local             # If env vars exist

# ─────────────────────────────────────────────────────────────────
# STEP 7: CREATE CI/CD WORKFLOWS
# ─────────────────────────────────────────────────────────────────
mkdir -p .github/workflows
# Copy ci.yml and deploy.yml from Section 6.3

# Set GitHub secrets
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID

# ─────────────────────────────────────────────────────────────────
# STEP 8: COPY THIS CLAUDE.md TO PROJECT ROOT
# ─────────────────────────────────────────────────────────────────
# Update Section B with project-specific details
```

**Post-setup verification:**
```bash
npm run dev           # ✅ Dev server starts
npm run build         # ✅ Builds without errors
npm run lint          # ✅ No linting errors
npm run typecheck     # ✅ No type errors
vercel                # ✅ Preview deploys successfully
```

---

### 9. QUALITY GATES

**Before merging any PR:**

1. ✅ All tests pass (`npm run test`)
2. ✅ TypeScript has no errors (`npm run typecheck`)
3. ✅ ESLint has no errors (`npm run lint`)
4. ✅ Preview deployment works
5. ✅ Lighthouse score > 90 (Performance, Accessibility)
6. ✅ No console errors in browser
7. ✅ Responsive design verified (mobile, tablet, desktop)
8. ✅ Brand compliance: Crowe Indigo/Amber dominant, no off-brand colors

---

### 10. CONFIGURATION FILES REFERENCE

**`.prettierrc`:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**`eslint.config.mjs` (Next.js 15+ flat config):**
```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "prefer-const": "error",
    },
  },
];

export default eslintConfig;
```

**`tsconfig.json` paths (already set by create-next-app):**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## SECTION B: PROJECT-SPECIFIC CONFIGURATION

> **Fill this section when starting a new project. This overrides Section A where conflicts exist.**

---

### Project Overview

| Field | Value |
|-------|-------|
| **Name** | `[PROJECT_NAME]` |
| **Description** | [Brief description of what this project does] |
| **Type** | [SaaS / Marketing Site / Dashboard / E-commerce / Portfolio / Other] |
| **Repository** | `https://github.com/achyuthrachur/[PROJECT_NAME]` |
| **Production URL** | `https://[PROJECT_NAME].vercel.app` |
| **Started** | [DATE] |

---

### Tech Stack Deviations

> Only list if different from default stack in Section A

```
Framework:     [Default: Next.js 14+]
Styling:       [Default: Tailwind CSS + Crowe Brand Tokens]
Animation:     [Default: Anime.js v4 + Framer Motion]
UI Components: [Default: shadcn/ui (Crowe themed)]
Database:      [Default: Prisma + PostgreSQL]
Auth:          [Default: NextAuth.js / Clerk]
Other:         [Any additional libraries]
```

---

### Color Palette Override

> Only use if a specific project deviates from the core Crowe palette (requires brand approval)

```css
:root {
  /* Primary brand color override (if approved) */
  --color-brand: #______;
  
  /* Accent palette override */
  --color-accent-primary: #______;
  --color-accent-secondary: #______;
}
```

---

### Project-Specific Commands

```bash
# Add any project-specific commands here
npm run [command]     # Description
```

---

### Key Files & Architecture

```
src/
  app/
    (routes)/         # Route groups
    api/              # API routes
  components/
    ui/               # shadcn/ui components (Crowe themed)
    features/         # Feature-specific components
  lib/
    utils.ts          # Utility functions
    db.ts             # Database client
  fonts/              # Helvetica Now .woff2 files (if licensed)
  styles/
    globals.css       # Global styles & Crowe CSS variables
```

**Important architectural decisions:**
- [Decision 1]
- [Decision 2]

---

### Domain-Specific Terminology

| Term | Definition |
|------|------------|
| SmartPath | Crowe's dynamic brand device/graphic element — the only context where gradients are permitted |
| [Term] | [What it means in this project's context] |

---

### Environment Variables

```env
# Required for this project
DATABASE_URL=
NEXT_PUBLIC_[VAR]=

# Optional
[OTHER_VAR]=
```

---

### Known Issues & Workarounds

| Issue | Workaround | Status |
|-------|------------|--------|
| Helvetica Now requires license | Use Arial fallback stack if not licensed | 🟡 Check |
| [Description] | [How to handle it] | 🔴 Open / 🟢 Resolved |

---

### External Integrations

| Service | Purpose | Docs |
|---------|---------|------|
| Crowe Digital Brand Hub | Brand guidelines reference | https://www.crowedigitalbrand.com |
| [Service] | [What it's used for] | [Link to docs] |

---

## APPENDIX: DESIGN INSPIRATION RESOURCES

**Crowe Brand:**
- [Crowe Digital Brand Hub](https://www.crowedigitalbrand.com/) - Official digital brand guidelines
- [Crowe Color Guidelines](https://www.crowedigitalbrand.com/color) - Full palette with hex/RGB values
- [Crowe Typography](https://www.crowedigitalbrand.com/typography) - Helvetica Now usage rules

**Typography:**
- [Typewolf](https://www.typewolf.com/) - Font pairing inspiration
- [Fonts In Use](https://fontsinuse.com/) - Real-world typography examples
- [Google Fonts](https://fonts.google.com/) - Free fonts (filter by: Variable, Display, Modern)

**Color:**
- [Realtime Colors](https://www.realtimecolors.com/) - Test palettes on real UI
- [Coolors](https://coolors.co/) - Palette generator (use "Explore" for human-made palettes)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - WCAG compliance

**Animation:**
- [Anime.js Docs](https://animejs.com/documentation/)
- [Motion Dev](https://motion.dev/) - Framer Motion
- [GSAP](https://gsap.com/) - For complex timeline animations

**Design Systems:**
- [Tailwind UI](https://tailwindui.com/)
- [Radix Primitives](https://www.radix-ui.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

*Last updated: [DATE]*
*Maintained by: [YOUR NAME/TEAM]*
*Brand reference: Crowe Digital Brand Hub v2023*
