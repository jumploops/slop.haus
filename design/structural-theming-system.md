# Structural Theming System Design

**Status:** Architecture Proposed - Awaiting Review
**Created:** 2026-01-20
**Updated:** 2026-01-20

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Light/dark mode support | Every theme can **optionally** support light/dark modes |
| User-generated themes | Parse into **safe, templated CSS** |
| Utility approach | Build base theme with **Tailwind-like utilities** that compile to a **generic theme system** (not Tailwind-specific) |
| Migration strategy | **Big bang** - system isn't live yet |
| Feature visibility | Base theme includes visitor counters, webrings, etc. Themes can **hide them** |

---

## Problem Statement

The current theming system is designed for **color-only theming** via CSS custom properties. While this works well for palette switching (light/dark, accent colors), it cannot support "style themes" that change structural properties like:

- Border styles (solid vs 3D beveled outset/inset)
- Border widths (1px subtle vs 2px chunky)
- Border radius (modern rounded vs retro square)
- Shadow styles (soft diffused vs hard pixel-offset)
- Font families (system sans vs Comic Sans)
- Animation patterns (subtle transitions vs blinking/marquee)
- Background patterns (solid vs tiled imagery)
- Layout conventions (card-based vs panel-based)

### Target Theme Styles

1. **Early Web / Geocities** (reference-ui) - Comic Sans, beveled borders, tiled backgrounds, marquee, visitor counters
2. **Neobrutalist** - Bold borders, no shadows, stark contrasts, intentionally "ugly"
3. **Matrix** - Terminal aesthetic, monospace fonts, green-on-black, scanline effects
4. **Modern SaaS** - Current design, system fonts, subtle shadows, rounded corners
5. **[Future user-defined themes]**

---

## Current Architecture Analysis

### What Works Well

1. **Two-layer CSS variable pattern** - Base variables (`:root`) mapped to Tailwind utilities (`@theme inline`) allows runtime switching
2. **OKLCH color space** - Perceptually uniform, easy to adjust
3. **Semantic tokens** - `bg-bg`, `text-fg`, `border-border` abstracts intent from implementation
4. **CVA for component variants** - Type-safe, composable variant system

### What Doesn't Support Structural Theming

#### 1. CVA Variants Hardcode Structure

```typescript
// Current button-variants.ts
export const buttonVariants = cva(
  ["inline-flex items-center justify-center gap-2", /* ... */],
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground border border-accent",
        // ↑ This always uses `border` utility (solid 1px)
        // ↑ Cannot become `border-2 outset` for retro theme
      },
      size: {
        md: "px-4 py-2 text-sm rounded-md",
        // ↑ Always uses `rounded-md`
        // ↑ Cannot become `rounded-none` for retro theme
      },
    },
  }
);
```

CVA generates static class strings. There's no mechanism to make these classes theme-aware at runtime.

#### 2. Reference UI Uses Escape Hatches

The reference-ui solves this by using raw CSS classes:

```css
/* reference-ui/app/globals.css */
.retro-button {
  background: linear-gradient(180deg, #e0e0e0 0%, #c0c0c0 50%, #a0a0a0 100%);
  border: 2px outset #ffffff;
  box-shadow: inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080, 2px 2px 0 #000000;
  /* ... */
}
```

This works for a single theme but doesn't compose with the existing component system.

#### 3. Tailwind Utilities Are Atomic

Tailwind utilities represent single CSS properties. Structural theming requires groups of coordinated changes:

| Property Group | Modern SaaS | Retro 90s |
|----------------|-------------|-----------|
| Border style | `border border-border` | `border-2 outset` |
| Border radius | `rounded-md` | `rounded-none` |
| Shadow | `shadow-sm` | `shadow-[2px_2px_0_#000]` |
| Background | `bg-bg-secondary` | `bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400` |
| Font | `font-sans` | `font-[Comic_Sans_MS]` |

Switching themes requires changing all of these together, not individually.

---

## Architecture Options

### Option A: CSS-Variable-Driven Structural Tokens

Extend the CSS variable system to include structural values that can be swapped per theme.

**Implementation:**

```css
:root {
  /* Current color tokens... */

  /* NEW: Structural tokens */
  --btn-border-width: 1px;
  --btn-border-style: solid;
  --btn-shadow: var(--shadow-sm);
  --btn-radius: var(--radius-md);

  --card-border-width: 1px;
  --card-border-style: solid;
  --card-shadow: var(--shadow-md);
  --card-radius: var(--radius-lg);
}

:root[data-theme="retro"] {
  --btn-border-width: 2px;
  --btn-border-style: outset;
  --btn-shadow: 2px 2px 0 #000;
  --btn-radius: 0;

  --card-border-width: 2px;
  --card-border-style: outset;
  --card-shadow: inset 1px 1px 0 #fff, 2px 2px 0 #000;
  --card-radius: 0;
}
```

**Component usage:**

```tsx
// Button styles become variable-driven
const baseButton = `
  border-[length:var(--btn-border-width)]
  border-[style:var(--btn-border-style)]
  shadow-[var(--btn-shadow)]
  rounded-[var(--btn-radius)]
`;
```

**Pros:**
- Maintains Tailwind-first approach
- Single source of truth for theme values
- Runtime switchable
- Gradual migration possible

**Cons:**
- Complex CSS variable syntax in Tailwind classes
- Some values (like gradients) don't work in all CSS variable contexts
- Border style `outset/inset` renders differently across browsers
- Limited expressiveness for complex multi-value properties

---

### Option B: Theme-Scoped Utility Overrides

Define theme-specific CSS that overrides Tailwind utility output when a theme is active.

**Implementation:**

```css
/* Base Tailwind generates standard utilities */
/* Then override for retro theme: */

:root[data-theme="retro"] {
  /* Override rounded utilities */
  --radius-sm: 0;
  --radius-md: 0;
  --radius-lg: 0;

  /* Override font-sans */
  --font-sans: "Comic Sans MS", cursive;

  /* Override shadows to be hard-edged */
  --shadow-sm: 2px 2px 0 #000;
  --shadow-md: 3px 3px 0 #000;
}

/* Override border behavior in retro theme */
:root[data-theme="retro"] .border {
  border-style: outset !important;
  border-width: 2px !important;
}
```

**Pros:**
- Existing components work without code changes
- Clear separation of theme-specific overrides
- Easy to add new themes

**Cons:**
- `!important` wars and specificity issues
- Overriding utilities breaks their semantic meaning
- Hard to debug which styles are active
- Border overrides affect ALL borders (dividers, inputs, etc.)

---

### Option C: Compound Component Variants

Add a `theme` dimension to CVA variants that changes structural styles.

**Implementation:**

```typescript
export const buttonVariants = cva(
  ["inline-flex items-center justify-center gap-2"],
  {
    variants: {
      variant: { primary: "", secondary: "", ghost: "", danger: "" },
      size: { sm: "", md: "", lg: "" },
      theme: {
        modern: "",
        retro: "",
        matrix: "",
        neobrutalist: "",
      },
    },
    compoundVariants: [
      // Modern theme
      { theme: "modern", variant: "primary", class: "bg-accent text-accent-foreground border border-accent rounded-md shadow-sm" },
      { theme: "modern", size: "md", class: "px-4 py-2 text-sm" },

      // Retro theme
      { theme: "retro", variant: "primary", class: "retro-button-primary" },
      { theme: "retro", size: "md", class: "px-3 py-1 text-sm" },

      // Matrix theme
      { theme: "matrix", variant: "primary", class: "bg-green-900 text-green-400 border border-green-500 font-mono" },
      // ... etc
    ],
  }
);
```

**Usage with React Context:**

```tsx
const ThemeContext = createContext<{ theme: string }>({ theme: "modern" });

function Button({ variant, size, ...props }) {
  const { theme } = useContext(ThemeContext);
  return (
    <button className={buttonVariants({ variant, size, theme })} {...props} />
  );
}
```

**Pros:**
- Full control over every theme's styles
- Type-safe theme selection
- No CSS specificity issues
- Explicit mapping of theme → styles

**Cons:**
- Combinatorial explosion (variants × sizes × themes)
- Every component needs theme awareness
- Context access on every render
- Theme changes require code changes, not just CSS

---

### Option D: Theme-Specific Component Layers (CSS Cascade Layers)

Use CSS Cascade Layers (`@layer`) to define theme-specific component styles that override base styles cleanly.

**Implementation:**

```css
/* Define layer order - later layers win */
@layer base, components, themes.modern, themes.retro, themes.matrix;

@layer components {
  .btn {
    @apply inline-flex items-center justify-center gap-2 font-medium;
    @apply transition-colors duration-200;
  }
  .btn-primary {
    @apply bg-accent text-accent-foreground;
  }
  .btn-md {
    @apply px-4 py-2 text-sm;
  }
}

@layer themes.modern {
  :root[data-theme="modern"] .btn {
    @apply border border-border rounded-md shadow-sm;
  }
}

@layer themes.retro {
  :root[data-theme="retro"] .btn {
    border: 2px outset #c0c0c0;
    border-radius: 0;
    box-shadow: inset 1px 1px 0 #fff, 2px 2px 0 #000;
  }
  :root[data-theme="retro"] .btn-primary {
    background: linear-gradient(180deg, #90EE90 0%, #32CD32 50%, #228B22 100%);
    color: black;
  }
}

@layer themes.matrix {
  :root[data-theme="matrix"] .btn {
    @apply border border-green-500 rounded-none font-mono;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  }
}
```

**Pros:**
- Clean specificity management (layers, not `!important`)
- Component styles colocated by theme
- No JavaScript overhead for theme switching
- Can mix Tailwind utilities and raw CSS per theme
- Easy to add new themes without touching existing code

**Cons:**
- Abandons pure Tailwind utility approach
- Need to define custom component classes (`.btn`, `.card`, etc.)
- Some duplication across theme layers
- Requires understanding CSS Cascade Layers

---

### Option E: Hybrid Approach (Recommended)

Combine multiple strategies for different levels of theming:

1. **CSS Variables** for values that are simple tokens (colors, spacing, fonts, radius)
2. **CSS Cascade Layers** for complex structural overrides (borders, shadows, backgrounds)
3. **CVA variants** for semantic component states (variant: primary/secondary, size: sm/md/lg)

**Implementation:**

```css
/* theme.css - Token layer */
:root {
  /* Colors (current system, works well) */
  --background: oklch(0.98 0 0);
  --accent: oklch(0.55 0.3 145);

  /* Structural tokens - themeable */
  --font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  --radius-base: 0.5rem;
  --border-width: 1px;
  --border-style: solid;

  /* Body background */
  --body-bg-image: none;
}

:root[data-theme="retro"] {
  --font-family: "Comic Sans MS", cursive;
  --radius-base: 0;
  --border-width: 2px;
  --border-style: outset;
  --body-bg-image: url("data:image/svg+xml,..."); /* tiled pattern */
}

/* components.css - Base component layer */
@layer components {
  .btn {
    font-family: var(--font-family);
    border-radius: var(--radius-base);
    border-width: var(--border-width);
    border-style: var(--border-style);
  }
}

/* themes/retro.css - Theme-specific overrides */
@layer themes.retro {
  :root[data-theme="retro"] .btn {
    /* Complex styles that can't be tokenized */
    box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 #808080, 2px 2px 0 #000;
  }

  :root[data-theme="retro"] .btn:active {
    box-shadow: inset -1px -1px 0 #fff, inset 1px 1px 0 #808080;
  }
}
```

**Component with CVA:**

```typescript
// Button uses CVA for semantic variants, CSS handles structural theming
export const buttonVariants = cva(
  ["btn"], // Base class pulls in theme-aware styles
  {
    variants: {
      variant: {
        primary: "btn-primary",   // Semantic, themed via CSS
        secondary: "btn-secondary",
        ghost: "btn-ghost",
      },
      size: {
        sm: "btn-sm",
        md: "btn-md",
        lg: "btn-lg",
      },
    },
  }
);
```

**Pros:**
- Best of all worlds: tokens for simple values, CSS for complex styles
- CVA remains focused on semantic variants
- Clean separation: tokens vs structure vs variants
- Gradual migration path from current system

**Cons:**
- More files/concepts to understand
- Need to decide what's a token vs what's a layer override
- Component classes alongside Tailwind utilities (mixed model)

---

## Proposed Architecture (Based on Decisions)

Given the decisions above, we need a system that:

1. **Is not tied to Tailwind** - utilities compile to our own format
2. **Supports user-generated themes** - safe, templated, validated
3. **Handles feature visibility** - visitor counters, webrings, etc.
4. **Optional light/dark mode** per theme

### Theme Definition Format

Themes are defined as TypeScript/JSON objects that compile to CSS. This enables:
- Type safety for built-in themes
- Validation for user themes
- Safe CSS generation (no arbitrary CSS injection)

```typescript
// packages/shared/src/theme-schema.ts
import { z } from "zod";

// Color must be valid OKLCH or hex
const ColorSchema = z.string().regex(/^(oklch\(|#[0-9a-fA-F]{3,8}$)/);

// Allowed font stacks (whitelist for safety)
const FontStackSchema = z.enum([
  "system",           // -apple-system, BlinkMacSystemFont, sans-serif
  "comic-sans",       // "Comic Sans MS", cursive
  "mono",             // ui-monospace, Courier New, monospace
  "serif",            // Georgia, serif
  "retro-pixel",      // "Press Start 2P", monospace
]);

// Border style options
const BorderStyleSchema = z.enum(["solid", "outset", "inset", "double", "none"]);

// Animation presets (safe, predefined)
const AnimationPresetSchema = z.enum([
  "none",
  "subtle",           // subtle transitions only
  "playful",          // wobble, bounce
  "retro",            // blink, marquee
  "matrix",           // scanlines, glitch
]);

export const ThemeSchema = z.object({
  // === METADATA ===
  id: z.string().regex(/^[a-z0-9-]+$/),  // slug-safe
  name: z.string().max(50),
  description: z.string().max(200).optional(),
  author: z.string().max(100).optional(),

  // === COLOR MODE SUPPORT ===
  modes: z.object({
    light: z.boolean().default(true),
    dark: z.boolean().default(false),
  }),

  // === COLORS (per mode) ===
  colors: z.object({
    light: z.object({
      background: ColorSchema,
      backgroundSecondary: ColorSchema,
      foreground: ColorSchema,
      muted: ColorSchema,
      border: ColorSchema,
      accent: ColorSchema,
      accentForeground: ColorSchema,
      danger: ColorSchema,
      warning: ColorSchema,
      success: ColorSchema,
    }).optional(),
    dark: z.object({
      background: ColorSchema,
      backgroundSecondary: ColorSchema,
      foreground: ColorSchema,
      muted: ColorSchema,
      border: ColorSchema,
      accent: ColorSchema,
      accentForeground: ColorSchema,
      danger: ColorSchema,
      warning: ColorSchema,
      success: ColorSchema,
    }).optional(),
  }),

  // === TYPOGRAPHY ===
  typography: z.object({
    fontFamily: FontStackSchema,
    fontFamilyMono: FontStackSchema.default("mono"),
    baseFontSize: z.number().min(12).max(20).default(16),  // px
    lineHeight: z.number().min(1).max(2).default(1.6),
  }),

  // === STRUCTURAL ===
  structure: z.object({
    borderRadius: z.enum(["none", "sm", "md", "lg", "full"]),
    borderWidth: z.enum(["1", "2", "3"]),  // px
    borderStyle: BorderStyleSchema,
    shadowStyle: z.enum(["none", "soft", "hard", "glow"]),
  }),

  // === ANIMATIONS ===
  animations: z.object({
    preset: AnimationPresetSchema,
    reducedMotion: z.boolean().default(true),  // respect prefers-reduced-motion
  }),

  // === FEATURE VISIBILITY ===
  features: z.object({
    visitorCounter: z.boolean().default(true),
    webring: z.boolean().default(true),
    constructionBanner: z.boolean().default(true),
    retroBadges: z.boolean().default(true),
    marquee: z.boolean().default(true),
  }),

  // === BACKGROUNDS ===
  background: z.object({
    pattern: z.enum(["none", "dots", "grid", "checkerboard", "scanlines"]).optional(),
    patternOpacity: z.number().min(0).max(1).default(0.1),
  }).optional(),

  // === COMPONENT OVERRIDES (advanced) ===
  // These allow themes to provide specific CSS for components
  // Values are constrained to prevent injection
  components: z.object({
    button: z.object({
      gradient: z.boolean().default(false),
      gradientColors: z.array(ColorSchema).max(3).optional(),
      pressedEffect: z.enum(["none", "darken", "inset"]).default("darken"),
    }).optional(),
    card: z.object({
      elevated: z.boolean().default(true),
    }).optional(),
    link: z.object({
      underline: z.enum(["none", "hover", "always"]).default("hover"),
      hoverColor: ColorSchema.optional(),
    }).optional(),
  }).optional(),
});

export type Theme = z.infer<typeof ThemeSchema>;
```

### Example Theme Definitions

```typescript
// themes/retro.ts
export const retroTheme: Theme = {
  id: "retro-90s",
  name: "Retro 90s",
  description: "Geocities-inspired chaos",

  modes: { light: true, dark: false },

  colors: {
    light: {
      background: "oklch(0.95 0.02 250)",
      backgroundSecondary: "oklch(0.88 0.01 250)",
      foreground: "oklch(0.15 0.02 260)",
      muted: "oklch(0.45 0.02 260)",
      border: "oklch(0.7 0.05 260)",
      accent: "oklch(0.5 0.25 260)",      // bright blue
      accentForeground: "oklch(0.98 0 0)",
      danger: "oklch(0.6 0.25 25)",
      warning: "oklch(0.85 0.2 95)",
      success: "oklch(0.55 0.3 145)",
    },
  },

  typography: {
    fontFamily: "comic-sans",
    fontFamilyMono: "mono",
    baseFontSize: 14,
    lineHeight: 1.5,
  },

  structure: {
    borderRadius: "none",
    borderWidth: "2",
    borderStyle: "outset",
    shadowStyle: "hard",
  },

  animations: {
    preset: "retro",
    reducedMotion: true,
  },

  features: {
    visitorCounter: true,
    webring: true,
    constructionBanner: true,
    retroBadges: true,
    marquee: true,
  },

  background: {
    pattern: "checkerboard",
    patternOpacity: 0.08,
  },

  components: {
    button: {
      gradient: true,
      gradientColors: ["#e0e0e0", "#c0c0c0", "#a0a0a0"],
      pressedEffect: "inset",
    },
    link: {
      underline: "always",
      hoverColor: "oklch(0.55 0.3 25)",  // red on hover
    },
  },
};
```

```typescript
// themes/modern.ts
export const modernTheme: Theme = {
  id: "modern-saas",
  name: "Modern SaaS",
  description: "Clean, professional design",

  modes: { light: true, dark: true },

  colors: {
    light: {
      background: "oklch(0.98 0 0)",
      backgroundSecondary: "oklch(0.96 0 0)",
      foreground: "oklch(0.15 0 0)",
      muted: "oklch(0.55 0 0)",
      border: "oklch(0.85 0 0)",
      accent: "oklch(0.55 0.2 145)",
      accentForeground: "oklch(0.98 0 0)",
      danger: "oklch(0.55 0.25 25)",
      warning: "oklch(0.75 0.18 75)",
      success: "oklch(0.55 0.2 145)",
    },
    dark: {
      background: "oklch(0.07 0 0)",
      backgroundSecondary: "oklch(0.11 0 0)",
      foreground: "oklch(0.93 0 0)",
      muted: "oklch(0.55 0 0)",
      border: "oklch(0.25 0 0)",
      accent: "oklch(0.85 0.2 155)",
      accentForeground: "oklch(0.07 0 0)",
      danger: "oklch(0.65 0.25 25)",
      warning: "oklch(0.8 0.18 75)",
      success: "oklch(0.85 0.2 155)",
    },
  },

  typography: {
    fontFamily: "system",
    fontFamilyMono: "mono",
    baseFontSize: 16,
    lineHeight: 1.6,
  },

  structure: {
    borderRadius: "md",
    borderWidth: "1",
    borderStyle: "solid",
    shadowStyle: "soft",
  },

  animations: {
    preset: "subtle",
    reducedMotion: true,
  },

  features: {
    visitorCounter: false,  // Hidden in modern theme
    webring: false,
    constructionBanner: false,
    retroBadges: false,
    marquee: false,
  },

  components: {
    button: {
      gradient: false,
      pressedEffect: "darken",
    },
    link: {
      underline: "hover",
    },
  },
};
```

### Theme Compiler

The theme definition compiles to CSS at build time (for built-in themes) or runtime (for user themes).

```typescript
// packages/shared/src/theme-compiler.ts
import type { Theme } from "./theme-schema";

// Font stack mappings
const FONT_STACKS: Record<string, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  "comic-sans": '"Comic Sans MS", "Comic Sans", cursive',
  mono: 'ui-monospace, SFMono-Regular, "Courier New", monospace',
  serif: 'Georgia, "Times New Roman", serif',
  "retro-pixel": '"Press Start 2P", monospace',
};

// Border radius mappings
const BORDER_RADIUS: Record<string, string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  full: "9999px",
};

// Shadow style mappings
const SHADOWS: Record<string, Record<string, string>> = {
  none: { sm: "none", md: "none", lg: "none" },
  soft: {
    sm: "0 1px 3px oklch(0 0 0 / 0.1)",
    md: "0 4px 6px oklch(0 0 0 / 0.1)",
    lg: "0 10px 15px oklch(0 0 0 / 0.1)",
  },
  hard: {
    sm: "2px 2px 0 oklch(0 0 0)",
    md: "3px 3px 0 oklch(0 0 0)",
    lg: "4px 4px 0 oklch(0 0 0)",
  },
  glow: {
    sm: "0 0 5px currentColor",
    md: "0 0 10px currentColor",
    lg: "0 0 20px currentColor",
  },
};

export function compileTheme(theme: Theme): string {
  const lines: string[] = [];

  // Generate CSS for each supported mode
  const modes = [];
  if (theme.modes.light && theme.colors.light) modes.push({ name: "light", colors: theme.colors.light });
  if (theme.modes.dark && theme.colors.dark) modes.push({ name: "dark", colors: theme.colors.dark });

  for (const mode of modes) {
    const selector = mode.name === "light"
      ? `:root[data-theme="${theme.id}"]`
      : `:root[data-theme="${theme.id}"].dark, :root[data-theme="${theme.id}"][data-mode="dark"]`;

    lines.push(`${selector} {`);

    // Colors
    lines.push(`  --background: ${mode.colors.background};`);
    lines.push(`  --background-secondary: ${mode.colors.backgroundSecondary};`);
    lines.push(`  --foreground: ${mode.colors.foreground};`);
    lines.push(`  --muted: ${mode.colors.muted};`);
    lines.push(`  --border: ${mode.colors.border};`);
    lines.push(`  --accent: ${mode.colors.accent};`);
    lines.push(`  --accent-foreground: ${mode.colors.accentForeground};`);
    lines.push(`  --danger: ${mode.colors.danger};`);
    lines.push(`  --warning: ${mode.colors.warning};`);
    lines.push(`  --success: ${mode.colors.success};`);

    // Typography
    lines.push(`  --font-family: ${FONT_STACKS[theme.typography.fontFamily]};`);
    lines.push(`  --font-family-mono: ${FONT_STACKS[theme.typography.fontFamilyMono]};`);
    lines.push(`  --font-size-base: ${theme.typography.baseFontSize}px;`);
    lines.push(`  --line-height: ${theme.typography.lineHeight};`);

    // Structure
    lines.push(`  --border-radius: ${BORDER_RADIUS[theme.structure.borderRadius]};`);
    lines.push(`  --border-width: ${theme.structure.borderWidth}px;`);
    lines.push(`  --border-style: ${theme.structure.borderStyle};`);

    // Shadows
    const shadows = SHADOWS[theme.structure.shadowStyle];
    lines.push(`  --shadow-sm: ${shadows.sm};`);
    lines.push(`  --shadow-md: ${shadows.md};`);
    lines.push(`  --shadow-lg: ${shadows.lg};`);

    // Feature flags as CSS custom properties (for conditional rendering)
    lines.push(`  --feature-visitor-counter: ${theme.features.visitorCounter ? 1 : 0};`);
    lines.push(`  --feature-webring: ${theme.features.webring ? 1 : 0};`);
    lines.push(`  --feature-construction-banner: ${theme.features.constructionBanner ? 1 : 0};`);
    lines.push(`  --feature-retro-badges: ${theme.features.retroBadges ? 1 : 0};`);
    lines.push(`  --feature-marquee: ${theme.features.marquee ? 1 : 0};`);

    lines.push(`}`);
    lines.push("");
  }

  // Component-specific styles
  lines.push(...compileComponentStyles(theme));

  // Animation styles
  lines.push(...compileAnimationStyles(theme));

  return lines.join("\n");
}

function compileComponentStyles(theme: Theme): string[] {
  const lines: string[] = [];
  const selector = `:root[data-theme="${theme.id}"]`;

  // Button gradient
  if (theme.components?.button?.gradient && theme.components.button.gradientColors) {
    const colors = theme.components.button.gradientColors;
    lines.push(`${selector} .btn-primary {`);
    lines.push(`  background: linear-gradient(180deg, ${colors[0]} 0%, ${colors[1] || colors[0]} 50%, ${colors[2] || colors[1] || colors[0]} 100%);`);
    lines.push(`}`);
  }

  // Button pressed effect
  if (theme.components?.button?.pressedEffect === "inset") {
    lines.push(`${selector} .btn:active {`);
    lines.push(`  box-shadow: inset 2px 2px 4px oklch(0 0 0 / 0.3);`);
    lines.push(`}`);
  }

  // Link styles
  if (theme.components?.link) {
    const link = theme.components.link;
    if (link.underline === "always") {
      lines.push(`${selector} a { text-decoration: underline; }`);
    } else if (link.underline === "none") {
      lines.push(`${selector} a { text-decoration: none; }`);
      lines.push(`${selector} a:hover { text-decoration: none; }`);
    }
    if (link.hoverColor) {
      lines.push(`${selector} a:hover { color: ${link.hoverColor}; }`);
    }
  }

  return lines;
}

function compileAnimationStyles(theme: Theme): string[] {
  const lines: string[] = [];
  const selector = `:root[data-theme="${theme.id}"]`;

  if (theme.animations.preset === "retro") {
    // Blink animation
    lines.push(`${selector} .blink { animation: blink 1s step-end infinite; }`);
    // Marquee animation
    lines.push(`${selector} .marquee { animation: marquee 15s linear infinite; }`);
    // Wobble animation
    lines.push(`${selector} .wobble { animation: wobble 2s ease-in-out infinite; }`);
  } else if (theme.animations.preset === "none" || theme.animations.preset === "subtle") {
    // Disable chaotic animations
    lines.push(`${selector} .blink { animation: none; }`);
    lines.push(`${selector} .marquee { animation: none; }`);
    lines.push(`${selector} .wobble { animation: none; }`);
  }

  return lines;
}
```

### Feature Visibility in Components

Components check theme feature flags to conditionally render:

```tsx
// components/VisitorCounter.tsx
"use client";

import { useTheme } from "@/hooks/useTheme";

export function VisitorCounter() {
  const { theme } = useTheme();

  // Check if feature is enabled for current theme
  if (!theme.features.visitorCounter) {
    return null;
  }

  return (
    <div className="visitor-counter">
      {/* ... counter implementation ... */}
    </div>
  );
}
```

Or via CSS (for simpler cases):

```css
/* Hide elements when feature is disabled */
:root {
  --feature-visitor-counter: 1;
}

.visitor-counter {
  display: var(--feature-visitor-counter, 1) == 0 ? none : block;
}

/* Better approach - use data attributes */
[data-theme] .visitor-counter {
  display: block;
}
[data-theme][data-feature-visitor-counter="false"] .visitor-counter {
  display: none;
}
```

### User-Generated Theme Safety

User themes are validated against the schema, preventing:
- Arbitrary CSS injection
- XSS via CSS expressions
- Resource exhaustion (max lengths, limited options)

```typescript
// api/routes/themes.ts
import { ThemeSchema } from "@slop/shared/theme-schema";
import { compileTheme } from "@slop/shared/theme-compiler";

app.post("/api/v1/themes", requireAuth(), async (c) => {
  const body = await c.req.json();

  // Validate against schema - rejects invalid/dangerous input
  const parsed = ThemeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }

  const theme = parsed.data;

  // Compile to safe CSS
  const css = compileTheme(theme);

  // Store theme definition (not raw CSS)
  await db.insert(userThemes).values({
    userId: c.get("session").userId,
    themeId: theme.id,
    definition: theme,  // JSON, not CSS
    compiledCss: css,   // Pre-compiled for performance
  });

  return c.json({ id: theme.id });
});
```

### Runtime Theme Application

```typescript
// hooks/useTheme.ts
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Theme } from "@slop/shared/theme-schema";
import { builtInThemes } from "@/themes";

interface ThemeContextValue {
  themeId: string;
  theme: Theme;
  setTheme: (id: string) => void;
  mode: "light" | "dark";
  setMode: (mode: "light" | "dark") => void;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState("retro-90s");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [customThemes, setCustomThemes] = useState<Record<string, Theme>>({});

  const theme = customThemes[themeId] || builtInThemes[themeId];

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute("data-theme", themeId);
    document.documentElement.setAttribute("data-mode", mode);

    // Apply feature flags as data attributes
    Object.entries(theme.features).forEach(([key, value]) => {
      document.documentElement.setAttribute(
        `data-feature-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
        String(value)
      );
    });
  }, [themeId, mode, theme]);

  // ...
}
```

### Utility Abstraction Layer

Instead of Tailwind-specific utilities in components, use semantic classes that the theme system styles:

```tsx
// BEFORE: Tailwind-specific
<button className="px-4 py-2 bg-accent text-accent-foreground rounded-md border border-accent">
  Click me
</button>

// AFTER: Semantic classes
<button className="btn btn-primary btn-md">
  Click me
</button>
```

The theme system defines how `.btn`, `.btn-primary`, `.btn-md` look. Different themes can make these look completely different.

```css
/* Base component styles (theme-agnostic) */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  /* Themed properties use CSS variables */
  font-family: var(--font-family);
  border-radius: var(--border-radius);
  border-width: var(--border-width);
  border-style: var(--border-style);
}

.btn-primary {
  background: var(--accent);
  color: var(--accent-foreground);
  border-color: var(--accent);
}

.btn-md {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}
```

---

## Edge Cases & Issues

### 1. Third-Party Components

Components from libraries (shadcn/ui, etc.) hardcode Tailwind classes. Theme overrides won't affect them without:
- Forking/wrapping every component
- Global CSS overrides with high specificity
- Patching at build time

**Mitigation:** Audit all third-party components and either wrap them or replace with theme-aware versions.

### 2. Inline Styles

Any component using inline `style` props bypasses the theming system entirely.

**Mitigation:** Audit codebase for inline styles; convert to CSS variables or classes.

### 3. Animation Differences

Retro theme uses `blink`, `marquee`, `wobble` - animations that would look wrong in other themes.

**Solutions:**
- Theme-specific animation classes (`.theme-retro .blink { ... }`)
- Conditional rendering of animated elements
- CSS variable for `animation-play-state` to disable per theme

### 4. Background Images & Patterns

Retro uses tiled SVG background; Modern uses solid colors; Matrix might use scanlines.

**Solution:** `--body-bg-image` CSS variable set per theme.

### 5. Typography Scale

Comic Sans renders larger than system fonts at the same `font-size`. May need per-theme `--font-size-base` adjustments.

### 6. Form Controls

Native form controls (`<select>`, `<input type="checkbox">`) style differently. Retro theme may need custom-styled replacements.

### 7. Icons

Icon styles (stroke width, fill) may need theme-awareness. A chunky retro theme might want bolder icons.

### 8. Dark Mode × Theme

Currently two orthogonal axes:
- Light/Dark (color scheme)
- Theme style (retro/modern/matrix)

**Questions:**
- Does every theme support both light and dark?
- Is "Matrix" inherently dark-only?
- How to handle the 2×N matrix of combinations?

### 9. SSR / Flash of Unstyled Content

Theme must be known before first paint to avoid FOUC. Need to:
- Store preference in cookie (not just localStorage)
- Inject `data-theme` attribute in `<html>` before hydration
- Use `next-themes` or similar for SSR-safe switching

### 10. Performance

Loading multiple theme CSS files increases bundle size. Options:
- Single CSS file with all themes (simpler, larger)
- Dynamic CSS import per theme (smaller, adds latency on switch)
- CSS-in-JS with theme injection (runtime overhead)

### 11. User Customization

If users can create custom themes, they need:
- UI for selecting colors/fonts/etc.
- Validation that combinations are accessible (contrast ratios)
- Storage mechanism (database? localStorage?)
- Preview before applying

### 12. Pseudo-Elements & States

`:hover`, `:focus`, `:active`, `::before`, `::after` need theme-aware styles. Retro buttons have distinct `:active` state (pressed look).

---

## Implementation Plan (Big Bang)

Since the system isn't live yet, we can do a clean implementation without gradual migration concerns.

### Phase 1: Foundation
- [ ] Create `packages/shared/src/theme-schema.ts` with Zod schema
- [ ] Create `packages/shared/src/theme-compiler.ts`
- [ ] Define base CSS component classes (`.btn`, `.card`, `.input`, `.badge`, etc.)
- [ ] Set up CSS Cascade Layers infrastructure

### Phase 2: Built-in Themes
- [ ] Create `themes/retro-90s.ts` (primary theme, from reference-ui)
- [ ] Create `themes/modern-saas.ts` (clean fallback)
- [ ] Compile themes to CSS at build time
- [ ] Implement theme context and hooks

### Phase 3: Component Refactor
- [ ] Replace Tailwind utility classes with semantic component classes
- [ ] Update CVA variants to use semantic classes
- [ ] Add feature flag checks for conditional rendering (visitor counter, etc.)
- [ ] Test all components render correctly in both themes

### Phase 4: Theme Switching
- [ ] Implement theme picker UI
- [ ] SSR-safe theme persistence (cookies)
- [ ] Light/dark mode toggle (per-theme support)
- [ ] FOUC prevention

### Phase 5: User Themes
- [ ] API endpoint for theme creation/validation
- [ ] Theme editor UI (constrained to schema)
- [ ] Runtime CSS injection for user themes
- [ ] Theme preview before applying

### Phase 6: Polish
- [ ] Accessibility audit per theme (contrast, motion)
- [ ] Performance optimization (CSS bundle size)
- [ ] Documentation for creating new themes
- [ ] Add 1-2 more built-in themes (matrix, neobrutalist)

---

## Remaining Open Questions

### Answered (for reference)

| # | Question | Decision |
|---|----------|----------|
| 1 | Light/dark mode support? | Optional per theme |
| 2 | User-generated themes? | Safe, templated via schema |
| 3 | Utility approach? | Semantic classes, not Tailwind-specific |
| 4 | Migration strategy? | Big bang |
| 5 | Feature visibility? | Base includes all, themes can hide |

### Still Open

1. **What's the complete list of semantic component classes needed?**
   - Proposed: `.btn`, `.card`, `.input`, `.badge`, `.modal`, `.tabs`, `.avatar`
   - Are there others? What about layout primitives?

2. **How do we handle the existing Tailwind-based components during development?**
   - Keep both systems temporarily? Or hard switch?
   - What about reference-ui components - port them directly or build from scratch?

3. **Where does theme CSS live?**
   - Build-time compiled into main bundle?
   - Separate CSS files loaded dynamically?
   - Inline `<style>` tags for user themes?

4. **How granular should component overrides be?**
   - Current schema has `button.gradient`, `button.pressedEffect`
   - Should we allow per-variant overrides (primary vs secondary)?
   - How much complexity is too much?

5. **What's the font loading strategy?**
   - Comic Sans is usually system-installed
   - "Press Start 2P" and other retro fonts need loading
   - Web font loading can cause FOUC

6. **How do we handle theme-specific images/assets?**
   - Retro theme uses 88x31 badges, construction GIFs
   - Are these part of the theme definition or separate?
   - CDN vs bundled?

7. **What's the accessibility baseline?**
   - Minimum contrast ratios enforced in schema?
   - Are some themes allowed to be "intentionally hard to read" for aesthetic?
   - Focus indicators per theme?

8. **How does server rendering interact with themes?**
   - Theme from cookie for SSR
   - What if user has a custom theme stored in DB but we're doing SSR?
   - Cache invalidation when user changes theme?

9. **Should themes be able to add custom CSS beyond the schema?**
   - For power users / advanced customization
   - Security implications of arbitrary CSS
   - Could allow a "custom CSS" field with heavy sanitization

10. **What happens to components that don't have theme-aware styles yet?**
    - Fallback to base Tailwind styles?
    - Visible warning in dev mode?
    - Required coverage before launch?

---

## Appendix: Reference UI Key Patterns

### Retro Button (for reference)
```css
.retro-button {
  background: linear-gradient(180deg, #e0e0e0 0%, #c0c0c0 50%, #a0a0a0 100%);
  border: 2px outset #ffffff;
  box-shadow: inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080, 2px 2px 0 #000000;
  padding: 4px 12px;
  font-weight: bold;
  font-family: "Comic Sans MS", cursive;
  border-radius: 0;
}

.retro-button:active {
  border: 2px inset #ffffff;
  box-shadow: inset -1px -1px 0 #ffffff, inset 1px 1px 0 #808080;
}
```

### Retro Panels
```css
.retro-inset {
  border: 2px inset #c0c0c0;
  background: white;
  box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.2);
}

.retro-outset {
  border: 2px outset #c0c0c0;
  background: #e0e0e0;
}
```

### Key Visual Differences

| Element | Modern SaaS | Retro 90s |
|---------|-------------|-----------|
| Border radius | 4-8px | 0px |
| Border style | solid 1px | outset/inset 2px |
| Shadows | soft, diffused | hard, pixel-offset |
| Fonts | System sans | Comic Sans |
| Backgrounds | solid colors | tiled patterns |
| Animations | subtle ease | blink, marquee, wobble |
| Links | no underline, colored | underlined, blue→red hover |
| Form inputs | modern rounded | inset beveled |

---

## Next Steps

1. **Review this document** - Validate the proposed architecture
2. **Answer remaining open questions** - Especially #1-4 to unblock implementation
3. **Create the theme schema** - `packages/shared/src/theme-schema.ts`
4. **Prototype the retro theme** - Compile reference-ui styles to new format
5. **Build one component end-to-end** - Button with full theme switching to validate approach
6. **Decide on semantic class inventory** - Full list of `.btn`, `.card`, etc. needed
