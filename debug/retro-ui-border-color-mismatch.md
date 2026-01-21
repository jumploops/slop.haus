# Debug: Retro UI Border Color Mismatch

**Status:** Draft
**Owner:** TBD
**Last updated:** 2026-01-20

## Problem

Borders in the current retro UI render as heavy black across many components (buttons, project list cards, panels), but the `reference-ui` design uses lighter gray borders for most panels and only uses black borders in specific cases (e.g., score badges, thumbnail frames).

## Investigation

### Reference UI findings

- `reference-ui/app/globals.css`
  - `--border` is a lighter gray (`oklch(0.7 0.05 260)`).
  - Base layer applies `border-border` to elements by default.
  - Retro panel styles (`.retro-inset` / `.retro-outset`) use gray borders like `#c0c0c0`.
- `reference-ui/components/project-list-item.tsx`
  - Outer wrapper uses `retro-outset` (gray border).
  - Inner card uses `border border-gray-300`, not black.
  - Thumbnail uses `border-2 border-black` (black only where intended).
  - Score badges use `border-2 border-black` + `shadow-[2px_2px_0_#000]`.

### Current implementation findings

- Many components explicitly used `border-2 border-[color:var(--foreground)]` and shadows `shadow-[2px_2px_0_var(--foreground)]`, which results in black or near-black borders everywhere.
- Example references (not exhaustive):
  - `apps/web/src/components/project/ProjectCard.tsx`
  - `apps/web/src/components/ui/button-variants.ts`
  - `apps/web/src/components/ui/Input.tsx`
  - `apps/web/src/components/ui/Tabs.tsx`
  - `apps/web/src/components/project/ScoreWidget.tsx`
  - `apps/web/src/app/page.tsx`
- Theme tokens in `apps/web/src/styles/theme.css`:
  - `--foreground` is dark (`oklch(0.15 0.02 260)`).
  - `--border` is lighter (`oklch(0.7 0.05 260)`), but many components are not using it for borders.

### Progress update

- Broadly swapped borders to `border-[color:var(--border)]` in panels/buttons/inputs to reduce the heavy black outline.
- Kept black borders in limited emphasis areas (header/footer/marquee, thumbnails, score badges).

### New discrepancy details (project list)

Reference HTML shows:

- Outer wrapper: `retro-outset p-0.5` (beveled gray panel), not just a flat border.
- Inner card: `bg-white border border-gray-300`, not `bg-bg-secondary` + thick border.
- Tags are present (`bg-slop-yellow/40 border border-slop-yellow/60`), our card currently shows author/time/comment count instead.
- Links use `no-retro-link`, and title uses `text-blue-700 hover:text-red-600`, not tokenized `text-slop-blue`.
- Upvote button uses `.retro-button` style and shows a count, rather than our `VoteButtons` component.

## Hypotheses

1. **Overuse of `--foreground` for borders.** The retro reskin uses `border-[color:var(--foreground)]` globally, which makes borders too dark compared to the reference.
2. **Missing panel pattern parity.** Reference panels use a gray `retro-outset` wrapper with a lighter inner border. Current panels use black borders for both wrapper and inner card.
3. **Shadow usage mismatch.** The reference uses black shadows primarily on score badges and strong emphasis, not on every panel or button. Our usage is more aggressive.
4. **Project card structure diverged.** Our `ProjectCard` layout and content differs from the reference (tags, AI model label, retro-button upvote), so even with border tweaks it won't match 1:1.
5. **Color tokens vs literal colors.** Reference uses literal `border-gray-300` and `text-blue-700` in the list item; our semantic tokens may not map exactly to those values.

## Open Questions

- Do we want to standardize borders on `--border` for most components and reserve `--foreground` (black) for emphasis only?
- Should the “outset wrapper + inner card” pattern be aligned more closely with `retro-outset` and `border-gray-300` equivalents?
- Is the current black border treatment intentional for the brand direction, or should we match the lighter reference styling?

## Potential Fix Directions (not yet executed)

- Swap `border-[color:var(--foreground)]` to `border-[color:var(--border)]` for panel wrappers and buttons.
- Keep black borders only for thumbnail frames and score badges, matching reference usage.
- Adjust `shadow-[2px_2px_0_var(--foreground)]` usage to be more selective.
- Rebuild `ProjectCard` to follow the reference structure (retro-outset wrapper, inner white card, tags, retro-button upvote, and gray borders).
- Consider a retro-outset utility (or Tailwind composition) that matches `border: 2px outset #c0c0c0` + gray inner border.
