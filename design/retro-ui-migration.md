# Retro UI Migration Plan

**Status:** Draft
**Date:** 2026-01-20

Goal: Update the current Tailwind-based UI to match the 90s/early 2000s retro aesthetic in `reference-ui/`, while staying within the semantic token + component conventions of this repo.

---

## Decisions Locked In

- Retro theme becomes the default theme.
- All pages are fully retro-styled (including admin/settings/theme-gallery).
- Assets in `reference-ui/public` are approved for production use.
- Remove the theme switcher UI for now.
- Marquee/blink effects are acceptable in production.

---

## Current UI Review (apps/web)

**Theme + tokens**
- Tailwind v4 theme tokens live in `apps/web/src/styles/theme.css` with presets in `apps/web/src/styles/presets.css`.
- Semantic utilities (`bg-bg`, `text-fg`, `bg-accent`, etc.) are enforced in `apps/web/src/styles/TOKEN-CONTRACT.md`.
- Default look is dark/minimal; fonts are system (`--font-sans`, `--font-mono`).

**Layout + structure**
- Root layout in `apps/web/src/app/layout.tsx` uses a sticky header (`Header`) and a centered container; body uses semantic tokens.
- Primary pages: feed (`apps/web/src/app/page.tsx`), project detail (`apps/web/src/app/p/[slug]/page.tsx` + `apps/web/src/components/project/ProjectDetails.tsx`).

**Component styling**
- UI primitives already Tailwind-first: `apps/web/src/components/ui/Button.tsx`, `Badge.tsx`, `Input.tsx`, `Tabs.tsx`, `Avatar.tsx`, `Skeleton.tsx`.
- Project-specific components: `apps/web/src/components/project/ProjectCard.tsx`, `ScoreWidget.tsx`, `VoteButtons.tsx`, `VibeMeter.tsx`.

**Migration gaps already present**
- Several legacy class names are used but not defined anywhere (no CSS matches):
  - `feed-controls`, `channel-toggle`, `time-window-select`, `feed`, `empty-state`, `project-page` in `apps/web/src/app/page.tsx` and `apps/web/src/app/p/[slug]/page.tsx`.
- There is no `apps/web/public` directory yet, so assets referenced from the reference UI are not available.

---

## Reference UI Review (reference-ui)

**Design language**
- `reference-ui/DESIGN-LANGUAGE.md` defines the retro philosophy, palette, and component patterns.
- Core palette includes `slop-*` colors, gradient headers/footers, and a tiled background.
- Fonts: Comic Sans for body, Courier for mono.

**Global styling**
- `reference-ui/app/globals.css` defines:
  - Slop palette variables and Tailwind mappings.
  - Retro primitives: `.retro-button`, `.retro-inset`, `.retro-outset`.
  - Animations: marquee, blink, rainbow text, wobble, slow spin.
  - Global body background pattern and retro link styling.

**Page composition**
- Feed page: `reference-ui/app/page.tsx` (UnderConstruction banner, SlopHeader, list-style project cards, gradient footer).
- Project detail: `reference-ui/app/project/[id]/page.tsx` (retro panels, score badges, tags, rating widget, comment section, sidebar).

**Component patterns to replicate**
- Beveled buttons and inset/outset panels.
- Score badges (SLOP/VIBE), retro tags, ASCII-decorated headers.
- Playful accents: blinking labels, marquee, wonky hover.
- Asset-driven nostalgia: badges/gifs in `reference-ui/public`.

---

## Gap Analysis (Current vs Reference)

- **Visual language:** current UI is modern/minimal; reference is bright, busy, nostalgic.
- **Tokens:** current system lacks `slop-*` tokens; reference relies on them for badges/gradients.
- **Components:** existing `Button`, `Badge`, `Card`, `Tabs`, `VoteButtons` are not styled for retro depth/bevel.
- **Layout:** reference uses a more list-centric feed, retro header/footer, and dense decorative elements.
- **Assets:** retro badges, avatars, and animated images are missing in `apps/web`.
- **CSS approach:** reference uses custom CSS classes (`.retro-*`), but this repo discourages raw CSS classes in favor of Tailwind utilities and components.

---

## High-Level Plan

### Phase 1: Theme + Token Foundation
- Make retro the default theme in `apps/web/src/styles/theme.css` and update presets to keep other themes as opt-in.
- Extend `apps/web/src/styles/theme.css` with `--slop-*` base variables and Tailwind mappings (`bg-slop-green`, etc.).
- Add a body background pattern and retro link treatment, ideally scoped to the retro theme.

### Phase 2: Retro Primitives (Components)
- Implement retro visual primitives via existing components:
  - Add retro variants to `Button`, `Badge`, `Tabs`, `Input`, and panel/card wrappers.
  - Encode bevel/inset/outset effects using Tailwind utilities and semantic tokens.
- Replace legacy class placeholders (`feed-controls`, `empty-state`, etc.) with explicit Tailwind composition or reusable components.

### Phase 3: Page-Level Reskin
- Feed: update `apps/web/src/app/page.tsx` and `apps/web/src/components/project/ProjectCard.tsx` to match the list-item layout, score badges, tags, and metadata density in the reference UI.
- Project detail: update `apps/web/src/components/project/ProjectDetails.tsx`, `ScoreWidget.tsx`, and comment views to align with retro panels and score visuals.
- Header/footer: update `apps/web/src/components/layout/Header.tsx` and add a retro footer consistent with the reference.

### Phase 4: Motion + Flourishes
- Add keyframes to `apps/web/src/styles/animations.css` (marquee, blink, wobble, rainbow) and apply via Tailwind `animate-[...]` utilities to avoid new CSS classes.
- Ensure motion respects `prefers-reduced-motion` from `apps/web/src/styles/theme.css`.

### Phase 5: Assets + Polish
- Create `apps/web/public` and import assets from `reference-ui/public`.
- Replace placeholders with retro imagery where appropriate (badges, avatars, awards).
- Final pass for accessibility, consistency across screen sizes, and theme switching.

---

## Blockers

- **Undefined legacy classnames** currently used in pages need to be replaced or reimplemented before restyling.
- **No public asset directory** in `apps/web` for retro badges/gifs.
- **Repo convention conflict:** reference UI relies on custom CSS classes (`.retro-*`), but current guidelines discourage raw CSS classes.
- **Font availability:** Comic Sans may require bundling or fallback decisions.

---

## Unknowns / Questions

- How strict should we be about matching the reference UI versus adapting to the existing component architecture?

---

## Immediate Next Step

Start Phase 1 token work, then proceed to component retro variants.
