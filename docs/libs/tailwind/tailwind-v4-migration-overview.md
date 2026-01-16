# Tailwind CSS v4 migration overview (from v3)

This doc is a **delta-focused** guide for upgrading a codebase from Tailwind CSS **v3 → v4**.  
It intentionally **does not** re-document unchanged Tailwind behavior.

---

## Executive summary (what changed in v4)

Tailwind v4 is a major release with a few “big rocks” that affect nearly every project:

- **Modern browser baseline:** v4 targets modern browsers (Safari 16.4+, Chrome 111+, Firefox 128+) and relies on features like `@property` and `color-mix()` — older browsers won’t work without a compatibility mode.  
- **Tooling split & new integrations:** Tailwind is no longer “just the PostCSS plugin”. PostCSS/CLI/Vite integration is now through dedicated packages.
- **CSS-first customization:** Theme tokens, custom utilities, and custom variants can live directly in CSS via directives like `@theme`, `@utility`, and `@custom-variant`.
- **Breaking changes at the utility level:** A handful of utilities were removed/renamed, some defaults changed, and a few selectors were redesigned for performance.

---

## Pre-flight checks (do these before you upgrade)

### 1) Browser support
If you must support browsers older than the v4 baseline, **don’t upgrade yet** (or test carefully with a compatibility strategy).

### 2) CSS preprocessors (Sass/Less/Stylus)
Tailwind v4 is designed as a CSS build tool and **does not support CSS preprocessors** in the same way v3 projects often did. Plan to migrate `*.scss`/`*.sass`/`*.less` entrypoints to plain CSS (or keep preprocessing separate from Tailwind, with careful boundaries).

### 3) Node/tooling
- The official automated upgrade tool requires **Node 20+**.
- v4 can be used with a standalone CLI binary too, but most teams will upgrade via Node-based tooling.

---

## Recommended migration path (pragmatic)

1. **Create a branch** (upgrade is wide-ranging).
2. Run the upgrade tool:
   ```bash
   npx @tailwindcss/upgrade
   ```
3. Update your build pipeline (PostCSS, Vite, or CLI — details below).
4. Replace legacy CSS entry directives (v3 `@tailwind` → v4 `@import`).
5. Decide how you’ll handle configuration:
   - **Short-term:** keep `tailwind.config.js` and load it explicitly with `@config`.
   - **Long-term:** migrate tokens/utilities/variants/plugins into CSS (`@theme`, `@utility`, `@custom-variant`, `@plugin`).
6. Run a full build + visual regression pass (expect minor UI diffs).

---

## Build pipeline changes (v3 → v4)

### A) PostCSS integration: plugin moved to `@tailwindcss/postcss`
**v3:** you probably had a PostCSS config that used `"tailwindcss"` as a plugin.  
**v4:** Tailwind’s PostCSS plugin is now **`@tailwindcss/postcss`**.

Example `postcss.config.mjs`:
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Install (typical):
```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

### B) Vite integration: first-party Vite plugin
If you’re using Vite, prefer the dedicated plugin:

```bash
npm install tailwindcss @tailwindcss/vite
```

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

Teams often remove their `postcss.config.*` when switching to the Vite plugin (depends on your stack).

### C) CLI integration: CLI moved to `@tailwindcss/cli`
**v3:** `npx tailwindcss ...`  
**v4:** `npx @tailwindcss/cli ...`

```bash
npm install tailwindcss @tailwindcss/cli
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch
```

---

## CSS entry file change: `@tailwind` directives removed

**v3 input.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**v4 input.css:**
```css
@import "tailwindcss";
```

> Note: `@import` must come before other rules, so move any custom CSS below it.

---

## Configuration & customization: from `tailwind.config.js` → CSS-first directives

Tailwind v4 supports a **CSS-first** approach for design tokens and extension points.

### Core directives you’ll see in v4
- `@theme` — define tokens (colors, fonts, breakpoints, etc.)
- `@utility` — define custom utilities that participate in variants/responsive
- `@variant` — apply a variant inside CSS
- `@custom-variant` — define a new variant
- `@source` — add/override content scanning sources
- `@reference` — import tokens/utilities/variants *for reference* (for CSS Modules, Vue/Svelte `<style>`, etc.)
- Compatibility-only:
  - `@config` — load a legacy JS config file
  - `@plugin` — load a legacy JS plugin

### Quick example: defining tokens with `@theme`
```css
@import "tailwindcss";

@theme {
  --font-display: "Satoshi", "sans-serif";
  --color-brand-500: oklch(0.72 0.18 255);
  --breakpoint-3xl: 120rem;
}
```

### Keeping `tailwind.config.js` temporarily (incremental migration)
v4 will **not automatically discover** your `tailwind.config.js` the way v3 did.
If you want to keep it, explicitly load it from your CSS entry file:

```css
@import "tailwindcss";
@config "./tailwind.config.js";
```

Important limitations when using `@config`:
- `corePlugins`, `safelist`, and `separator` options from JS config **are not supported** in v4.
- For safelisting, use `@source inline(...)` instead.

---

## Automatic content detection & scanning changes

v4 includes automatic content detection, so many projects can remove the v3 `content: [...]` globs entirely.

When you *do* need to add sources (monorepos, external UI packages, unusual templates), use:

```css
@source "../path/to/templates";
@source "../node_modules/@my-company/ui-lib";
```

For classes that cannot be detected statically, use `@source inline(...)` (see Tailwind docs for the exact syntax best suited to your codebase).

---

## Prefix changes

If you use prefixes:

- **v3:** prefix was configured in `tailwind.config.js` and the prefix was a raw string before utilities (not variant-like).
- **v4:** prefixes **look like variants** and are always at the start of the class list.

Example usage:
```html
<div class="tw:flex tw:bg-red-500 tw:hover:bg-red-600"></div>
```

Configure via your CSS entry file:
```css
@import "tailwindcss" prefix(tw);
@theme {
  --font-display: "Satoshi", "sans-serif";
}
```

Theme variables in `@theme` stay unprefixed, but Tailwind generates **prefixed CSS variables** (e.g. `--tw-color-*`) to avoid collisions.

---

## Important modifier change (`!`)

- **v3:** `hover:!bg-red-500` (important marker after variants, before utility)
- **v4:** put the `!` **at the end**: `hover:bg-red-500!`

Example:
```html
<div class="flex! bg-red-500! hover:bg-red-600/50!"></div>
```

The old v3 syntax is still supported for compatibility but is deprecated.

---

## Utility / behavior breaking changes (high-impact)

### 1) Deprecated opacity utilities removed
Removed:
- `bg-opacity-*`, `text-opacity-*`, `border-opacity-*`, `divide-opacity-*`, `ring-opacity-*`, `placeholder-opacity-*`

Replace with slash opacity modifiers:
- `bg-black/50`, `text-black/60`, etc.

### 2) Renamed utilities (shadow/radius/blur/outline/ring)
Renames for consistency:
- `shadow-sm` → `shadow-xs`
- `shadow` → `shadow-sm`
- `drop-shadow-sm` → `drop-shadow-xs`
- `drop-shadow` → `drop-shadow-sm`
- `blur-sm` → `blur-xs`
- `blur` → `blur-sm`
- `backdrop-blur-sm` → `backdrop-blur-xs`
- `backdrop-blur` → `backdrop-blur-sm`
- `rounded-sm` → `rounded-xs`
- `rounded` → `rounded-sm`
- `outline-none` → `outline-hidden` (**and** a new `outline-none` now truly removes outlines)
- `ring` → `ring-3` (because the default ring width changed)

Also note:
- `outline` now defaults to `outline-width: 1px` (more consistent with borders/rings).
- `ring` default width changed from 3px → 1px (hence the `ring-3` mapping).

### 3) Border/ring defaults changed
- Default `border-*` / `divide-*` color changed to **`currentColor`** (was a gray in v3).
- Default `ring` color changed to **`currentColor`** (was blue-ish in v3).
- Default `ring` width is now **1px** (was 3px in v3).

If you relied on the old defaults, you’ll need to specify colors explicitly (e.g. `border border-gray-200`, `ring-3 ring-blue-500`) or add compatibility variables/base styles.

### 4) `space-*` and `divide-*` selector changes
Selectors were changed to address performance issues on large pages:
- `space-*` now targets `:not(:last-child)` and uses margins differently.
- `divide-*` now targets `:not(:last-child)` and uses borders differently.

If you see layout diffs, consider migrating those areas to **flex/grid + `gap-*`**.

### 5) Gradients: behavior and naming
- v4 uses **linear gradient naming** (`bg-linear-to-*`) rather than `bg-gradient-to-*`.
- When overriding gradient parts with variants, v4 preserves other stops (more consistent).  
  If you need to “unset” `via-*` in a state, use `via-none`.

### 6) Preflight changes
Notable base-style differences:
- Placeholder color defaults to current text color at 50% opacity (instead of theme gray).
- Buttons default to `cursor: default` (instead of `pointer`).
- `<dialog>` margins reset (no default centering margins).
- `hidden` attribute takes priority over display utilities (e.g. `flex` no longer overrides `hidden`).

### 7) Hover variant now respects hover capability
In v4, `hover:` is wrapped in a `@media (hover: hover)` query by default.

If you need v3 behavior (always apply `:hover`), you can override by defining a custom hover variant, e.g.:
```css
@custom-variant hover (&:hover);
```

### 8) Transition default includes `outline-color`
`transition` now includes `outline-color` by default.  
If you see unexpected outline transitions, either use `transition-*` utilities explicitly, or restore the previous default transition property via theme variables.

### 9) Transform utilities use individual transform properties
Rotate/scale/translate utilities now use individual properties (`rotate`, `scale`, `translate`) instead of composing everything into a single `transform` value.

This is usually an improvement, but if you have custom CSS that assumes Tailwind sets or controls `transform` the old way, re-test those components.

### 10) Variant stacking order changed
- **v3:** variants effectively applied right-to-left
- **v4:** variants are applied left-to-right

If you have stacked variants that depended on the old order, re-check those selectors.

### 11) Arbitrary value syntax updates
- CSS variables in arbitrary values now use **parentheses**:
  - v3: `bg-[--my-var]`
  - v4: `bg-(--my-var)`
- Arbitrary values that contain spaces (notably for grid template and object-position) now use **underscores**:
  - v3: `grid-cols-[1fr 2fr]`
  - v4: `grid-cols-[1fr_2fr]`

### 12) `corePlugins` removed
The `corePlugins` option is no longer supported in v4.

---

## CSS authoring changes (common migration gotchas)

### Custom utilities: prefer `@utility` instead of `@layer utilities`
**v3 pattern:**
```css
@layer utilities {
  .content-auto { content-visibility: auto; }
}
```

**v4 pattern:**
```css
@utility content-auto {
  content-visibility: auto;
}
```

### Using `@apply` in CSS modules / component `<style>` blocks now needs `@reference`
If you use `@apply` (or `@variant`) inside CSS modules, Vue, or Svelte component style blocks, import your main stylesheet for reference:

```css
@reference "../../app.css";

.btn {
  @apply px-4 py-2 rounded bg-blue-600 text-white;
}
```

If you’re using only the default theme with no customizations, you can reference Tailwind directly:
```css
@reference "tailwindcss";
```

---

## New things you can optionally adopt in v4

These aren’t required for migration, but they’re useful “v4 wins”:

- **New build-time functions:**
  - `--alpha(color / percent)` for opacity using `color-mix()`
  - `--spacing(n)` for spacing based on the theme scale
- **Custom variants in CSS** using `@custom-variant`
- **Container queries built-in** (no plugin required)
- **Dynamic utilities and variants** (more “generate-on-demand” behavior)

---

## Migration checklist (copy/paste)

### Tooling
- [ ] Run `npx @tailwindcss/upgrade` (Node 20+)
- [ ] Update build integration:
  - [ ] PostCSS uses `@tailwindcss/postcss` (not `tailwindcss`)
  - [ ] Vite uses `@tailwindcss/vite` (if applicable)
  - [ ] CLI uses `@tailwindcss/cli` (if applicable)

### CSS entry + config
- [ ] Replace `@tailwind base/components/utilities` with `@import "tailwindcss";`
- [ ] If keeping JS config: add `@config "./tailwind.config.js";`
- [ ] If using plugins: migrate to `@plugin` where appropriate
- [ ] If using prefixes: migrate to `@import "tailwindcss" prefix(x);` and update classnames

### Codebase-wide changes
- [ ] Replace removed utilities (`bg-opacity-*`, etc.)
- [ ] Replace renamed utilities (shadow/radius/blur/outline/ring)
- [ ] Update important syntax (`bg-red-500!` style)
- [ ] Update arbitrary values:
  - [ ] CSS variables `[...]` → `(...)`
  - [ ] Space-separated arbitrary values use underscores

### Visual QA hotspots
- [ ] Borders/rings (defaults changed)
- [ ] Gradients (naming + variant behavior)
- [ ] `space-*` / `divide-*` layouts
- [ ] Hover behavior on touch devices
- [ ] Components with custom transforms/transitions
- [ ] Forms/buttons/preflight behavior

---

## References (official)

- Upgrade guide: `https://tailwindcss.com/docs/upgrade-guide`
- Functions & directives (v4): `https://tailwindcss.com/docs/functions-and-directives`
- Tailwind v4 announcement: `https://tailwindcss.com/blog/tailwindcss-v4`
