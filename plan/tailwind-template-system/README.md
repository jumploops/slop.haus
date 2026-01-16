# Tailwind v4 + Dynamic Theming Migration Plan

## Overview

Migrate slop.haus frontend from vanilla CSS to Tailwind CSS v4 with a dynamic theming system that supports:
1. **Default theme** - Current design preserved exactly
2. **Curated preset themes** - Shipped with the app
3. **User/LLM-generated themes** - Runtime CSS variable overrides

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Class merging** | `tailwind-merge` + `clsx` | Proper handling of Tailwind class conflicts |
| **Component variants** | `class-variance-authority` (CVA) | Type-safe variants with cleaner code |
| **Theme switching** | `next-themes` | Battle-tested SSR-safe theme management |
| **Color space** | OKLCH | Perceptually uniform, better gradients |
| **Variable pattern** | Two-layer (`@theme inline`) | Enables runtime theme switching |

## Phase Documents

| Phase | Document | Description |
|-------|----------|-------------|
| 1 | [phase-1-installation.md](./phase-1-installation.md) | Tailwind v4, PostCSS, CVA, next-themes, cn() |
| 2 | [phase-2-token-contract.md](./phase-2-token-contract.md) | `@theme inline` tokens, OKLCH colors, animations |
| 3 | [phase-3-ui-primitives.md](./phase-3-ui-primitives.md) | Button (CVA), Input, Badge (CVA), etc. |
| 4 | [phase-4-layout-components.md](./phase-4-layout-components.md) | Header, MobileNav, containers |
| 5 | [phase-5-feature-components.md](./phase-5-feature-components.md) | ProjectCard, Comments, Forms, etc. |
| 6 | [phase-6-preset-themes.md](./phase-6-preset-themes.md) | Curated theme definitions (OKLCH) |
| 7 | [phase-7-runtime-theming.md](./phase-7-runtime-theming.md) | next-themes integration |
| 8 | [phase-8-llm-generation.md](./phase-8-llm-generation.md) | Backend theme generation API |
| 9 | [phase-9-cleanup.md](./phase-9-cleanup.md) | Remove legacy CSS, documentation |

---

## Dependencies

```bash
pnpm -F @slop/web add tailwindcss @tailwindcss/postcss postcss tailwind-merge clsx class-variance-authority next-themes
```

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^4.x | Core Tailwind CSS |
| `@tailwindcss/postcss` | ^4.x | PostCSS plugin (v4 specific) |
| `postcss` | ^8.x | PostCSS processor |
| `tailwind-merge` | ^3.x | Resolves Tailwind class conflicts |
| `clsx` | ^2.x | Conditional class joining |
| `class-variance-authority` | ^0.7.x | Component variant management |
| `next-themes` | ^0.4.x | Theme switching with SSR support |

---

## Architecture

### Two-Layer Variable Pattern

The key to runtime theming with Tailwind v4:

```css
/* Layer 1: Base variables (overridden by theme presets) */
:root {
  --background: oklch(0.07 0 0);
}

/* Layer 2: @theme inline references them */
@theme inline {
  --color-bg: var(--background);  /* Creates: bg-bg utility */
}
```

**Why this works:**
- Without `inline`, Tailwind bakes literal values into CSS
- With `inline`, Tailwind preserves `var()` references
- Theme presets override `--background`, and `bg-bg` updates automatically

### CVA Component Pattern

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground hover:bg-accent-dim",
        secondary: "bg-transparent border border-border hover:bg-border",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        md: "px-4 py-2 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> { ... }

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

### Class Merging

```ts
// apps/web/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

---

## Current State Analysis

### Existing CSS Architecture

| Aspect | Current Implementation |
|--------|------------------------|
| **Styling approach** | Vanilla CSS in `globals.css` (~3500 lines) |
| **CSS Variables** | `:root` defines colors, spacing, radius |
| **Class naming** | Semantic component classes (`.btn`, `.project-card`) |
| **Class merging** | Simple `cn()` function (filter + join) |

### Migration: Current → Tailwind

| Current Variable | Tailwind Utility | OKLCH Value |
|-----------------|------------------|-------------|
| `var(--bg)` | `bg-bg` | `oklch(0.07 0 0)` |
| `var(--bg-secondary)` | `bg-bg-secondary` | `oklch(0.11 0 0)` |
| `var(--fg)` | `text-fg` | `oklch(0.93 0 0)` |
| `var(--muted)` | `text-muted` | `oklch(0.55 0 0)` |
| `var(--border)` | `border-border` | `oklch(0.25 0 0)` |
| `var(--accent)` | `bg-accent`, `text-accent` | `oklch(0.85 0.2 155)` |

---

## Migration Strategy

### Key Principles

1. **Semantic tokens over palette classes** - Use `bg-bg`, `text-fg`, NOT `bg-slate-900`
2. **Two-layer variables for theming** - Base in `:root`, mapped via `@theme inline`
3. **CVA for variant components** - Type-safe, cleaner than conditional `cn()` chains
4. **next-themes for switching** - Handles SSR flash, persistence, system preference
5. **OKLCH for colors** - Better perceptual uniformity
6. **Incremental migration** - Phase by phase, maintain working state

### Phase Overview

| Phase | Description | Risk | Effort |
|-------|-------------|------|--------|
| 1 | Install Tailwind v4 + all deps, update cn() | Low | Small |
| 2 | Create `@theme inline` tokens, OKLCH colors | Low | Medium |
| 3 | Migrate UI primitives with CVA | Medium | Medium |
| 4 | Migrate layout components | Medium | Medium |
| 5 | Migrate feature components | Medium | Large |
| 6 | Refine preset themes | Low | Small |
| 7 | Add next-themes integration | Low | Small |
| 8 | Add LLM theme generation (backend) | Medium | Medium |
| 9 | Polish + cleanup legacy CSS | Low | Medium |

---

## Final File Structure

```
apps/web/src/
├── app/
│   ├── app.css                    # Entry point
│   └── layout.tsx                 # suppressHydrationWarning
├── styles/
│   ├── theme.css                  # @theme inline tokens
│   ├── animations.css             # Keyframes
│   └── presets.css                # Theme overrides
├── lib/
│   └── utils.ts                   # cn() with tailwind-merge
├── hooks/
│   └── useThemePreset.ts          # Wrapper around next-themes
└── components/
    └── theme/
        ├── ThemeProvider.tsx      # next-themes provider
        └── ThemeSwitcher.tsx      # UI component
```

---

## Success Criteria

1. **No visual changes** - Default theme looks identical to current design
2. **Theme switching works** - Preset themes apply instantly (no flash)
3. **User themes work** - LLM-generated themes apply without refresh
4. **No palette classes** - All colors via semantic tokens
5. **Type-safe variants** - CVA provides autocomplete for component props
6. **Smaller CSS bundle** - Tailwind tree-shaking reduces output

---

## Risk Assessment

### Mitigated Risks

| Risk | Mitigation |
|------|------------|
| Flash of wrong theme | next-themes handles this automatically |
| Tailwind class conflicts | tailwind-merge resolves them |
| Visual regressions | Phase-by-phase migration with verification |
| Complex variant code | CVA simplifies variant definitions |

### Remaining Considerations

1. **Large Phase 5** - Feature components migration is extensive
2. **OKLCH browser support** - Widely supported, but test on target browsers
3. **User theme storage** - localStorage has size limits for CSS strings

---

## References

- [Tailwind v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind v4 Theme Variables](https://tailwindcss.com/docs/theme)
- [class-variance-authority](https://cva.style/docs)
- [next-themes](https://github.com/pacocoursey/next-themes)
- Local: `docs/libs/tailwind/tailwind-v4-migration-overview.md`
- Local: `design/tailwind-template-system.md`
- Local: `reference-ui/` (working Tailwind v4 example)
