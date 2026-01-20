# UI Theming Deep Dive (Codex)

Status: draft

## Scope

Review the current theming system, the 90s/early-2000s reference UI, and identify what must change to support "style themes" that alter more than colors (padding, borders, layout, typography, motion).

## Current System Summary (Observed)

- Theme tokens live in `apps/web/src/styles/theme.css` and are mapped into Tailwind utilities via `@theme inline`.
- Preset overrides exist in `apps/web/src/styles/presets.css` and are applied with `data-theme` on `html`.
- Theme switching is handled by `apps/web/src/components/theme/ThemeProvider.tsx` and `apps/web/src/hooks/useTheme.ts`, including runtime CSS injection for user themes.
- Layout knobs exist as CSS variables in `apps/web/src/styles/theme.css` (e.g. `--app-container-max`, `--app-header-height`) and are used in `apps/web/src/app/layout.tsx`.
- Component styling is mostly utility-driven with CVA (`apps/web/src/components/ui/button-variants.ts`, `apps/web/src/components/ui/Input.tsx`, `apps/web/src/components/ui/Badge.tsx`).
- A few components still rely on raw palette utilities or fixed values that are not theme-safe (e.g. `apps/web/src/components/project/RevisionStatusBanner.tsx`, `apps/web/src/components/ui/Modal.tsx`).

## Reference UI Summary (90s / Early 2000s)

Based on `reference-ui/DESIGN-LANGUAGE.md` and `reference-ui/app/globals.css`:

- Typography is part of the theme (Comic Sans, Courier).
- No rounded corners (`--radius: 0`), bevelled borders, inset/outset panels.
- Buttons are not just color changes; they use gradients, borders, and shadow stacks.
- Backgrounds are patterned (tiled SVG), links are underlined by default.
- Motion and decoration are theme-specific (blink, marquee, wobble, ASCII headings).
- Some components are unique to the theme (visitor counter, under-construction banner).

## Gap Analysis vs "Style Themes"

1. **Color theming works, structure does not.** Colors are driven by variables, but structural properties (border style/width, bevels, shadows, gradients) are hard-coded in utilities.
2. **Component spacing and shape are fixed.** Padding, radius, and sizes are currently expressed with utility classes; only the global spacing scale can be adjusted.
3. **Global base styles are not theme-aware.** Links, background patterns, and body-level styling are currently global and static.
4. **Theme-specific components are not modeled.** The reference UI introduces banner-like components and decorative elements that do not exist in the current layout system.
5. **Theming contracts are slightly out of sync.** `apps/web/src/styles/TOKEN-CONTRACT.md` references `globals.css`, which is not present in `apps/web/src/app`.

## Findings and Constraints

- `@theme inline` gives a strong foundation for tokenized colors, spacing, radius, and shadows, but it does not address border styles, multi-layer shadows, or gradient backgrounds.
- CVA variants are great for semantic variants (primary, secondary, sizes) but do not allow theme-driven structural changes without new tokens or theme-aware class layers.
- `useTheme` supports runtime user themes, but nothing enforces scoping to `:root[data-theme="user:..."]` or `.theme-scope`. User theme CSS could be too global if not validated.
- The "no raw CSS classes" guideline conflicts with the reference UI, which relies on custom classes like `.retro-button` and `.retro-outset`.

## Recommended Direction (High Level)

This aligns with the direction proposed in `design/structural-theming-system.md` and `design/tailwind-template-system.md`, with additional emphasis on retro needs.

1. **Expand the token contract for structure.**
   - Add tokens for border width and style, base shadow styles, and background patterns.
   - Add component-level tokens for padding and sizing (e.g. `--btn-pad-x`, `--card-pad`).
2. **Introduce a component-class layer for structural overrides.**
   - Define semantic classes (`.btn`, `.card`, `.panel`, `.input`) in a component layer.
   - Use CVA to apply semantic classes, not to encode all structure.
3. **Use theme layers for complex overrides.**
   - Each theme can override borders, gradients, and motion via cascade layers without breaking Tailwind utilities.
4. **Add theme-driven layout composition.**
   - Theme metadata should declare optional layout decorators (e.g. under-construction banner).
   - Keep core layout stable and allow themes to opt in to decorative elements.
5. **Make theme scoping explicit.**
   - Ensure generated user theme CSS always targets both `:root[data-theme="..."]` and `.theme-scope[data-theme="..."]`.

## Suggested Work Breakdown (Non-Implementation)

1. Audit all UI components for non-semantic utilities and fixed values that block theming.
2. Update the token contract to include structural tokens and overlay tokens (e.g. modal backdrops).
3. Prototype a retro theme layer using the reference UI patterns.
4. Decide how to reconcile the "no raw CSS classes" guideline with theme-specific styling.
5. Update documentation to match current file locations and theming entry points.

## Edge Cases and Issues (Enumerated)

1. **Palette class leakage.** A few components use raw palette classes (`bg-black/50`, `text-purple-400`, `border-white/10`) which will not adapt to themes. Examples: `apps/web/src/components/project/RevisionStatusBanner.tsx`, `apps/web/src/components/ui/Modal.tsx`, `apps/web/src/components/ui/Badge.tsx`.
2. **Border style cannot be themed.** `border` utilities lock in 1px solid borders, which prevents retro inset/outset borders or neobrutalist 2px borders without overrides.
3. **Gradient and bevel styles are not tokenized.** Retro buttons require multi-stop gradients and inner shadows that are not representable with current tokens.
4. **Global link and background behavior is static.** The 90s theme requires underlined links and patterned backgrounds, which are not theme-aware today.
5. **Layout changes are out of band.** Elements like visitor counters or under-construction banners are not part of a theme contract and would require conditional rendering.
6. **User theme CSS scoping is undefined.** `useTheme` injects raw CSS text, but there is no enforcement that it is scoped to the active theme selector.
7. **Theme previews may not match user themes.** `.theme-scope` previews require selectors in user CSS or they will not render correctly in preview components.
8. **Radius tokens may be overridden by legacy aliases.** The legacy `--radius-sm` and `--radius-lg` definitions in `apps/web/src/styles/theme.css` can override theme-driven radius values.
9. **Overlay/backdrop tokens are missing.** Modals and overlays use fixed colors (`bg-black/75`) that are theme-hostile.
10. **Animations are global.** Retro animations (blink, marquee) should not be available or active in modern themes without scoping.
11. **Third-party or copied components.** Any component not authored in this theme system will require wrapping or refactoring to participate in structural theming.
12. **Dark mode vs theme style matrix.** Some themes (e.g. Matrix) are inherently dark; the strategy for multi-axis theming (color mode vs style theme) needs clarity.

## Open Questions

1. Should we formalize a "theme contract v2" that includes structural and component-level tokens?
2. Are we willing to introduce semantic component classes (a small abstraction layer) despite the "no raw CSS classes" guideline?
3. Should themes be allowed to change layout composition (banners, counters), or should these be feature flags outside the theme system?
4. What is the expected behavior for user-generated themes: full structural overrides or color-only?
5. Do we need dual-axis theming (light/dark + style), or do we accept single-axis themes?
6. What is the acceptable CSS bundle size if we ship multiple theme layers?
7. How should we validate user themes to prevent unsafe CSS (e.g. `url()` backgrounds)?

## Unsafe CSS Considerations (From Existing POC Notes)

The existing POC spec already includes a safe-by-construction approach to user themes:

- LLM output is JSON only, never raw CSS.
- Server validates schema, clamps values, and derives secondary tokens.
- CSS compilation outputs only `:root[data-theme="user:<id>"] { --var: value; }`
  (and `.theme-scope[data-theme="user:<id>"]` for previews).
- Allowed value types are restricted (colors, lengths, unitless numbers, and a short allowlist
  for complex values like grid templates). No `url()`, no `@import`, no arbitrary selectors.

Implications for this codebase:

- The runtime injection in `apps/web/src/hooks/useTheme.ts` should assume scoped CSS only.
- Theme previews (`.theme-scope`) will be incorrect unless the compiler always emits preview selectors.
- Any future structural theming must be expressible through validated tokens or a small allowlist of
  "complex" variable values; otherwise it violates the unsafe CSS constraint.

Open questions to align with this safety model:

- Which structural tokens are safe to allow as variable values (e.g. `box-shadow`, gradients)?
- Do we permit any theme-provided background images, or forbid all `url()` usage?
- Will user themes be color-only, or allowed to change spacing/radius/shadows within the safe set?
