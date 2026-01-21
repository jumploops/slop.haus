# Semantic Theming Pipeline (Tailwind Authored, Safe User Themes)

Status: draft
Created: 2026-01-20

## Decisions (Confirmed)

- User themes are untrusted and must be compiled from JSON into variable-only CSS overrides.
- Theme previews should work via `.theme-scope`; compiler must emit preview selectors.
- Prefer the simplest, most robust approach: enums + allowlists instead of freeform CSS.
- For user themes, show a lightweight loading screen that includes theme metadata (name, author, icon).

## Goals

- Keep TailwindCSS as the authoring surface for the base UI.
- Transform base components into semantic classes that can be safely themed.
- Allow user themes to change layout, spacing, borders, and typography without unsafe CSS.
- Make it obvious when a component change requires a semantic recipe update.

## Non-Goals

- Arbitrary user CSS or user-provided selectors.
- Full theme marketplace or moderation in v1.
- Perfect coverage of every edge case on day one.

## Core Principle

The app ships with a stable semantic layer. Themes only override tokens and a controlled set of preset styles. User themes never ship raw CSS, only validated variables and enums compiled into safe selectors.

## Proposed Architecture

### 1) Semantic Recipe Layer (Tailwind Authored)

- Define semantic classes in a dedicated stylesheet using Tailwind utilities and `@apply`.
- Components use only semantic classes, not raw utilities, for core primitives.
- This creates a single source of truth for how the base theme looks.

Example:

```css
/* apps/web/src/styles/recipes.css */
@layer components {
  .btn { @apply inline-flex items-center justify-center gap-2 font-medium; }
  .btn-primary { @apply bg-accent text-accent-foreground border border-border; }
  .btn-md { @apply px-4 py-2 text-sm rounded-md; }
  .card { @apply bg-bg-secondary border border-border rounded-md shadow-sm; }
  .input { @apply bg-bg-secondary border border-border rounded-md px-3 py-2 text-sm; }
}
```

### 2) Token Layer (Theme Variables)

- Keep `@theme inline` tokens in `apps/web/src/styles/theme.css`.
- Expand the token contract to include structural variables used by recipes.

Examples:

- `--spacing` for density
- `--radius-*` for shape
- `--shadow-*` for base shadows
- `--border-width` and `--border-style` for edge style
- `--app-container-max`, `--app-grid-cols` for layout knobs

### 3) Theme Sources

- Built-in themes can provide complex CSS in controlled theme layers.
- User themes provide only JSON and compile to variable overrides.

Definitions:

- Built-in theme CSS: `apps/web/src/styles/themes/*.css` (may include gradients, box-shadow stacks, patterns).
- User themes: `ThemeSpec` JSON validated and compiled to `:root[data-theme="custom:<id>"] { --var: value; }`.
- Theme previews: always emit `.theme-scope[data-theme="..."]` selectors for both built-in and user themes.

### 4) Runtime Application

- Apply `data-theme` and optional `data-mode` on `html`.
- For user themes, inject a single style tag containing variable overrides only.
- For previews, wrap preview blocks with `.theme-scope` and apply the same overrides.

## Current Implementation Snapshot (So We Target Reality)

- Tokens are defined in `apps/web/src/styles/theme.css` and mapped via `@theme inline`.
- Preset overrides live in `apps/web/src/styles/presets.css` using `data-theme` on `html`.
- Theme switching uses `next-themes` in `apps/web/src/components/theme/ThemeProvider.tsx` and `apps/web/src/hooks/useTheme.ts`.
- Components are utility-driven (CVA) in `apps/web/src/components/ui/*`.
- Raw palette usage exists in a few places (examples): `apps/web/src/components/project/RevisionStatusBanner.tsx`, `apps/web/src/components/ui/Modal.tsx`, `apps/web/src/components/ui/Badge.tsx`, `apps/web/src/components/layout/MobileNav.tsx`, `apps/web/src/components/form/ToolsSelector.tsx`.
- Theme previews use `.theme-scope` (`apps/web/src/components/theme/ThemePreview.tsx`), so compiled themes must emit preview selectors.

## Expanded ThemeSpec Schema (User Themes)

User themes should be constrained to a safe subset that compiles to CSS variables and data attributes only.

ThemeSpec v1 (user-safe subset):

```ts
type ThemeSpec = {
  id: string; // slug-safe
  name: string;
  description?: string;
  author?: string;

  modes: {
    light?: ThemeModeTokens;
    dark?: ThemeModeTokens;
  };

  typography: {
    fontFamily: "system" | "comic-sans" | "mono" | "serif" | "retro-pixel";
    fontFamilyMono?: "mono" | "retro-pixel";
    baseFontSize: 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;
    lineHeight: 1.2 | 1.3 | 1.4 | 1.5 | 1.6 | 1.7 | 1.8;
  };

  spacing: {
    scale: "tight" | "normal" | "relaxed"; // maps to --spacing
    cardPadding: "sm" | "md" | "lg"; // maps to --app-card-pad
    pageGutter: "sm" | "md" | "lg"; // maps to --app-page-gutter
  };

  structure: {
    borderWidth: 1 | 2 | 3;
    borderStyle: "solid" | "outset" | "inset" | "double";
    radius: "none" | "sm" | "md" | "lg" | "full";
    shadowStyle: "none" | "soft" | "hard" | "glow";
  };

  layout: {
    containerMax: "960" | "1120" | "1200" | "1360";
    gridCols: 1 | 2 | 3 | 4;
    layoutVariant: "feed" | "grid" | "split";
    sidebar: "none" | "left" | "right";
  };

  components: {
    button: {
      style: "flat" | "bevel" | "outline";
      pressedEffect: "none" | "inset" | "darken";
    };
    card: {
      style: "flat" | "inset" | "outset";
    };
    input: {
      style: "flat" | "inset";
    };
    link: {
      underline: "always" | "hover" | "none";
      hoverColor?: "accent" | "warning" | "danger";
    };
  };

  background: {
    pattern: "none" | "dots" | "grid" | "checkerboard" | "scanlines";
    patternOpacity: 0 | 0.05 | 0.1 | 0.15 | 0.2;
  };

  features: {
    visitorCounter: boolean;
    webring: boolean;
    constructionBanner: boolean;
    retroBadges: boolean;
    marquee: boolean;
  };
};

type ThemeModeTokens = {
  colors: {
    background: Color;
    backgroundSecondary: Color;
    foreground: Color;
    muted: Color;
    border: Color;
    accent: Color;
    accentDim: Color;
    accentForeground: Color;
    danger: Color;
    warning: Color;
    success: Color;
  };
};

type Color = string; // validated: oklch(...), rgb(...), or #RRGGBB/#RRGGBBAA
```

Mapping to current token names:

- `background` -> `--background`
- `backgroundSecondary` -> `--background-secondary`
- `foreground` -> `--foreground`
- `muted` -> `--muted`
- `border` -> `--border`
- `accent` -> `--accent`
- `accentDim` -> `--accent-dim`
- `accentForeground` -> `--accent-foreground`
- `danger` -> `--danger`
- `warning` -> `--warning`
- `success` -> `--success`

User themes must not allow:

- `url()` values.
- `@import` or arbitrary selectors.
- Unbounded strings or raw CSS fragments.

## Layout and Structure Controls (Safe)

To allow layout changes without unsafe CSS, prefer one of these patterns:

1) Tokenized layout knobs (safe values, small allowlist)

- `--app-container-max: 1024px | 1200px | 1360px`
- `--app-grid-cols: repeat(1|2|3|4, minmax(0, 1fr))`
- `--app-card-pad: 12px | 16px | 20px`

2) Layout variants (enum)

- `layout: "feed" | "grid" | "split"`
- compiler sets `data-layout="..."`
- CSS uses `[data-layout="grid"]` selectors to switch safely

This avoids arbitrary grid templates or `calc()` supplied by users.

## Layout Token Usage (Practical Compromise)

- Use `--app-page-gutter` for the global shell (header + main container).
- For internal sections, prefer dedicated tokens like `--app-card-pad` or `--app-section-pad`.
- Allow page-level wrapper classes to override padding when a screen needs a different layout.
- Avoid scattering raw spacing utilities in primitives; keep overrides scoped to page wrappers.

Example:

```tsx
// apps/web/src/app/example/page.tsx
export default function ExamplePage() {
  return (
    <div className="page-wrapper page-wrapper--dense">
      {/* Page content */}
    </div>
  );
}
```

```css
/* apps/web/src/styles/recipes.css */
@layer components {
  .page-wrapper {
    padding-inline: var(--app-page-gutter);
  }

  .page-wrapper--dense {
    padding-inline: calc(var(--app-page-gutter) * 0.75);
  }
}
```

## Enforcing Semantic Usage

To keep Tailwind authoring but prevent utility drift in components:

- Add a lint rule that forbids raw Tailwind utilities in component files except allowlisted paths.
- Enforce that primitives reference semantic classes only (e.g. `.btn`, `.card`, `.input`).
- Require updates to `recipes.css` when primitives change.
- Add a CI check that fails when non-semantic classes are introduced in component primitives.

### Lint Rule Spec

Rule name: `no-raw-tailwind-in-primitives`

Scope:

- Enforce in `apps/web/src/components/ui/**` and `apps/web/src/components/layout/**`.
- Allowlist for non-primitive routes can be added later (`apps/web/src/app/**`).

Behavior:

- Flag any `className` string literal or `cn()` call that includes Tailwind utility tokens.
- Require at least one semantic class from the semantic inventory (`.btn`, `.card`, `.input`, `.badge`, `.modal`, `.tabs`, `.avatar`, `.list`, `.header`, etc.).
- Allow a small allowlist of non-structural utilities (e.g. `sr-only`, `flex`, `gap-*`) only if a semantic class is present.
- Always block raw palette utilities (`bg-slate-*`, `text-gray-*`, `border-white/10`, etc.).

### Prototype Config (Script-Based)

If we do not want to add an ESLint plugin yet, start with a simple script and a regex allowlist:

```json
// package.json (root)
{
  "scripts": {
    "lint:semantic": "node scripts/lint-semantic.mjs"
  }
}
```

```js
// scripts/lint-semantic.mjs
import { readFileSync } from "node:fs";
import { globSync } from "glob";

const files = globSync([
  "apps/web/src/components/ui/**/*.tsx",
  "apps/web/src/components/layout/**/*.tsx"
]);

const disallowed = /\b(bg|text|border|from|via|to)-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|pink|rose)(-[0-9]{2,3})?(\/[0-9]{2,3})?\b/;
const semanticRequired = /\b(btn|card|input|badge|modal|tabs|avatar|header|list)\b/;

let failed = false;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  if (disallowed.test(src) && !semanticRequired.test(src)) {
    console.error(`Semantic lint failed: ${file}`);
    failed = true;
  }
}

if (failed) process.exit(1);
```

Notes:

- This is a stopgap. A real ESLint rule should parse JSX and `className` values.
- We can add a `semantic-allowlist.json` for class names and permitted utilities.

## Pipeline Summary

1) Author component recipes with Tailwind utilities.
2) Tailwind builds the semantic CSS layer.
3) Built-in themes add optional override layers.
4) User themes compile from validated JSON into variable overrides.
5) Runtime switches `data-theme` and injects safe user CSS.
6) Lint and CI enforce semantic usage and recipe updates.

## Compatibility With Existing Code

- Keep current Tailwind utilities for page layout while primitives migrate to semantic classes.
- Migrate one primitive at a time (Button, Card, Input, Modal, Tabs).
- Use `ThemePreview` with `.theme-scope` to validate built-in and user themes side-by-side.

## Migration Checklist (Concrete, Current Code)

- [ ] Add `apps/web/src/styles/recipes.css` and import it from `apps/web/src/app/app.css`.
- [ ] Update `apps/web/src/components/ui/button-variants.ts` to use `.btn` semantic classes.
- [ ] Update `apps/web/src/components/ui/Button.tsx` to rely on semantic variants only.
- [ ] Update `apps/web/src/components/ui/Badge.tsx` to use semantic classes and remove palette classes.
- [ ] Update `apps/web/src/components/ui/Input.tsx` and `apps/web/src/components/ui/Textarea.tsx` to use `.input` semantic class.
- [ ] Update `apps/web/src/components/ui/Modal.tsx` to use semantic classes and replace `bg-black/75` with tokenized overlay.
- [ ] Update `apps/web/src/components/layout/Header.tsx` and `apps/web/src/components/layout/MobileNav.tsx` to remove raw palette utilities.
- [ ] Update `apps/web/src/components/project/RevisionStatusBanner.tsx` to remove raw palette utilities.
- [ ] Update `apps/web/src/components/form/ToolsSelector.tsx` to remove raw palette utilities.
- [ ] Extend `apps/web/src/styles/theme.css` with new structural and layout tokens.
- [ ] Extend `apps/web/src/styles/presets.css` with new tokens for existing themes.
- [ ] Add `.theme-scope` selector outputs in the theme compiler.

## Risks and Edge Cases

- Component drift: new components might bypass recipes without lint enforcement.
- Theme preview mismatch if `.theme-scope` selectors are not emitted.
- Tokens that allow complex values can reintroduce unsafe CSS if not clamped.
- Layout changes may require component structure changes, not just tokens.
- Font loading can cause FOUC if a theme depends on non-system fonts.

## Open Questions

1) Which primitives are mandatory semantic classes in v1.
2) Which layout controls must be tokenized vs enum variants.
3) Whether user themes can modify shadows or be limited to colors and spacing.
4) How strict the lint rule should be for non-primitive components.
5) Where built-in theme CSS should live and how it is bundled.

## Next Steps

- Finalize the semantic class inventory and create `recipes.css`.
- Extend the token contract with structural and layout tokens.
- Define `ThemeSpec` schema for user themes and compile rules.
- Add lint/CI enforcement for semantic usage.
- Prototype a retro built-in theme using this pipeline.
