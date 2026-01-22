# Clean UI Redesign Plan

**Status:** Draft
**Date:** 2026-01-22

Goal: Reskin the current Next.js frontend to match `clean-ui/` as closely as possible, while simplifying the theme system to a single TailwindCSS-based configuration. Use `clean-ui/STYLE_GUIDE.md` to style pages not included in the reference UI (settings, admin, submit, etc.).

---

## Current Front-End Architecture Review (apps/web)

**App structure**
- Next.js App Router in `apps/web/src/app` with route groups for feed, project detail (`/p/[slug]`), submit, settings, admin, favorites, etc.
- Root layout in `apps/web/src/app/layout.tsx` wraps pages with `Providers` (ThemeProvider, SWR, Toast, Login modal).

**Styling pipeline**
- `apps/web/src/app/app.css` imports:
  - `apps/web/src/styles/theme.css` (Tailwind v4 + `@theme inline` token mapping)
  - `apps/web/src/styles/animations.css` (custom keyframes + utility classes)
  - `apps/web/src/styles/presets.css` (theme presets)
- Global styles in `theme.css` define body background pattern, link styles, and fonts (`Comic Sans` + `Courier`).

**Theme system (overly complex vs target)**
- `next-themes` provider uses `data-theme` attribute and preset themes (`default`, `cyberpunk`, `warm`, etc.) via `apps/web/src/styles/presets.css`.
- `apps/web/src/hooks/useTheme.ts` supports runtime “user themes” by injecting CSS into the DOM.
- Theme UI and routes:
  - `ThemeSwitcher`, `ThemeGenerator`, `ThemePreview` components
  - `theme-gallery` route for preset previews

**Component styling**
- UI primitives in `apps/web/src/components/ui` (Button, Badge, Input, Tabs, Modal, Toast, etc.) rely on custom tokens (`bg-bg`, `text-fg`, `border-border`, `bg-accent`, etc.).
- Layout components (Header/Footer/VisitorCounter) use custom gradients, slop palette tokens, and some inline styles.

**Known complexity hotspots**
- Multiple theme paths (presets + user-injected theme CSS + theme gallery).
- Token names are non-standard (e.g., `bg-bg`, `text-fg`) and require legacy aliases in `theme.css`.
- VisitorCounter uses inline hardcoded colors, not tokens.

---

## Reference UI Review (clean-ui)

**Global styling**
- Single `clean-ui/styles/globals.css` with `@import "tailwindcss"`, `@custom-variant dark`, light/dark CSS variables, and `@theme inline` mappings.
- Token names match Tailwind conventions (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-primary`, `text-muted-foreground`, etc.).
- Fonts are Geist + Geist Mono via `next/font`.

**Theme behavior**
- `ThemeProvider` uses `attribute="class"`, `defaultTheme="system"`, and `enableSystem`.
- `ThemeToggle` cycles `system → light → dark` (matches style guide).

**Component patterns**
- `ConstructionBanner`, `SiteHeader`, `ProjectCard`, `SlopMeter`, `ReviewCard`, `ReviewForm`, `UpvoteButton`, `VisitorCounter` implement the reference UI.
- Consistent use of monospace headers, dashed borders, wonky rotations, and slop palette tokens (per `STYLE_GUIDE.md`).

**Layout**
- Root page uses `max-w-3xl` container, compact header, construction banner, and clean card-based list.
- Project detail page uses the same design system with a focused review section.

---

## Gap Analysis (Current vs Clean UI)

- **Theme system:** Current preset + runtime theme injection is far beyond what the clean UI uses. Clean UI only needs system/light/dark via `next-themes` class mode.
- **Token naming:** Current `bg-bg` / `text-fg` differs from clean UI’s `bg-background` / `text-foreground`. Almost all component classnames will need migration or remapping.
- **CSS structure:** Current `theme.css` + `presets.css` + `animations.css` vs. clean UI’s single `globals.css` + minimal custom keyframes.
- **Typography:** Current Comic Sans/Courier vs. clean UI’s Geist + Geist Mono.
- **Layout:** Current gradient header/footer and retro marquee differ from clean UI’s simpler header/footer and wonky-but-clean cards.
- **Review model:** Clean UI already shows separate review cards and slop scores that better match the new schema. Current UI still mixes vibe/vote visuals in some places.
- **Extra pages:** Settings/admin/submit pages need restyling via `STYLE_GUIDE.md` since they are not in `clean-ui/` examples.
- **Unused code paths:** Theme gallery + generator + runtime user themes will likely be removed.

---

## High-Level Change Summary (Proposed)

1. **Simplify global styling**
   - Replace `apps/web/src/app/app.css` + `styles/theme.css` + `styles/presets.css` + `styles/animations.css` with a `globals.css` modeled on `clean-ui/styles/globals.css`.
   - Keep only required tokens: background/foreground/card/muted/border/primary/destructive + slop palette from `STYLE_GUIDE.md`.

2. **Normalize theme handling**
   - Switch to `ThemeProvider` setup matching clean UI (`attribute="class"`, `defaultTheme="system"`).
   - Remove preset theme system, theme gallery route, theme generator, runtime CSS injection, and any unused theme constants.
   - Add `ThemeToggle` (system/light/dark) in the header.

3. **Token migration**
   - Update classnames across components from `bg-bg`/`text-fg` to `bg-background`/`text-foreground` and related clean UI tokens.
   - Align slop palette token names with `STYLE_GUIDE.md` (`slop-lime`, `slop-orange`, `slop-pink`, etc.).

4. **Layout + component reskin**
   - Update `apps/web/src/app/layout.tsx` to mirror `clean-ui/app/layout.tsx` structure and bring in `ConstructionBanner` + `SiteHeader` equivalents.
   - Reskin core components to match clean UI markup: `ProjectCard`, `SlopMeter`, `ReviewCard`, `ReviewForm`, `UpvoteButton`.

5. **Apply style guide to remaining pages**
   - Restyle settings/admin/submit pages using `STYLE_GUIDE.md` patterns: dashed borders, monospace headers, small rotations, slop palette.

6. **Cleanup + QA**
   - Remove unused theme-related components/routes.
   - Verify dark mode, responsive layout, and accessibility (contrast, focus styles).

---

## Open Questions

- Should we keep any legacy theme presets for admin/testing, or fully remove them?
- Do we want to keep `ThemeGallery` as a dev-only page, or delete entirely?
- Should the existing auth/navigation layout be adapted into the clean UI header, or should the header be simplified and auth UI moved elsewhere?
- Are Geist fonts approved for production, or should we use local/system fallbacks?
- Should we keep the VisitorCounter style from clean UI or rework it to use current dynamic behavior?

---

## Possible Blockers

- **Large token rename:** Migrating all components from `bg-bg` → `bg-background` is mechanical but touches many files.
- **Theme removal:** Removing preset + runtime themes requires verifying no pages depend on `ThemeSwitcher` or `ThemeGallery`.
- **Asset gap:** `clean-ui/public` assets may need to be copied into `apps/web/public` for parity.
- **Inline styles:** Components like `VisitorCounter` use hardcoded colors that will need rework to match tokens.
- **Route differences:** Clean UI uses `/project/[id]`, while current app uses `/p/[slug]`; design needs mapping without breaking routing.

---

## Next Step

Review this plan and confirm scope decisions (theme removal, header/nav changes, token migration strategy) before implementing.
