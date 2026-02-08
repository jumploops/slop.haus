# Slop Score Display Abstraction Plan

Status: draft  
Owner: TBD  
Last updated: 2026-02-08

## Overview
Project-level slop score display is currently inconsistent with the per-review score scale:

- review input + validation are on a `0-10` scale
- project display tone logic is using `40/60/80` thresholds
- project card label text is hardcoded to `"Slop"` instead of the scale term

This plan introduces a reusable slop-score abstraction so all surfaces (review form, comment chip, project card, project details widget, and future views) use one source of truth.

## Decisions (confirmed)

1. Aggregate banding uses direct decimal thresholds (no rounding), with `immaculate` at `>= 9.5`.
2. Unrated project surfaces use the term `UNRATED` with neutral tone.
3. Edit/preview surfaces are included in this effort for investigation and adoption where score presentation exists.

## Current codebase review

### 1) Canonical score range is `0-10`
- `packages/shared/src/schemas.ts:126` validates `reviewScore` as `0..10`
- `apps/web/src/components/comment/CommentForm.tsx:107` slider is `min=0`, `max=10`, `step=1`

### 2) Review UI uses `0-10` label bands
- `apps/web/src/components/comment/CommentForm.tsx:145`
  - `10 => IMMACULATE SLOP`
  - `8-9 => SOLID SLOP`
  - `6-7 => DECENT SLOP`
  - `4-5 => STALE SLOP`
  - `0-3 => SLOPPY SLOP`

### 3) Project surfaces use mismatched tone thresholds
- `apps/web/src/components/project/ProjectCard.tsx:401` uses `80/60/40` thresholds
- `apps/web/src/components/project/ScoreWidget.tsx:90` uses `80/60/40` thresholds

Given aggregate score is `0-10`, those thresholds force almost all rated projects into the fallback red tone.

### 4) Project card term is hardcoded
- `apps/web/src/components/project/ProjectCard.tsx:186` and `apps/web/src/components/project/ProjectCard.tsx:330` render `"Slop"` statically

### 5) Logic duplication exists
- Tone/label mapping logic is duplicated across:
  - `apps/web/src/components/comment/CommentForm.tsx`
  - `apps/web/src/components/comment/CommentItem.tsx`
  - `apps/web/src/components/project/ProjectCard.tsx`
  - `apps/web/src/components/project/ScoreWidget.tsx`

## Goals

1. Create one canonical slop-score scale contract for labels/bands.
2. Ensure project aggregate display maps to the same conceptual scale as per-review scores.
3. Replace hardcoded project term text with computed term text.
4. Make score presentation reusable for future surfaces with minimal copy/paste.

## Non-goals

1. No DB schema changes for `reviewScore`/`slopScore`.
2. No API response shape changes required for initial rollout.
3. No redesign of card/layout structure beyond score term and tone behavior.

## Proposed architecture

### A) Shared scale contract (domain layer)
Create a pure shared module:

- `packages/shared/src/slop-score-scale.ts`

Responsibilities:

- define canonical bands (`sloppy`, `stale`, `decent`, `solid`, `immaculate`, plus `unrated`)
- expose pure score-to-band helpers for:
  - discrete review score (`0-10` integer)
  - aggregate project score (`0-10` decimal)
- expose term text helper(s), e.g. `IMMACULATE SLOP`
- keep output UI-framework-agnostic (no Tailwind classes in shared package)

Example API sketch:

```ts
export type SlopBand = "unrated" | "sloppy" | "stale" | "decent" | "solid" | "immaculate";

export function getSlopBandForReviewScore(score: number): SlopBand;
export function getSlopBandForAggregateScore(score: number, reviewCount: number): SlopBand;
export function getSlopBandLabel(band: SlopBand): string; // "SLOPPY SLOP", etc.
```

### B) Web presentation adapter (UI layer)
Create a web-only adapter:

- `apps/web/src/lib/slop-score-presentation.ts`

Responsibilities:

- map `SlopBand` to Tailwind class tokens for:
  - badge background/foreground
  - text color
- keep class policy centralized and theme-friendly

Example API sketch:

```ts
export function getSlopBandBadgeClass(band: SlopBand): string;
export function getSlopBandTextClass(band: SlopBand): string;
```

### C) Consumer adoption
Replace local helper functions/hardcoded label text with shared calls in:

- `apps/web/src/components/comment/CommentForm.tsx`
- `apps/web/src/components/comment/CommentItem.tsx`
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/components/project/ScoreWidget.tsx`
- `apps/web/src/components/project/EditableProject.tsx` (investigate + adopt if applicable)
- `apps/web/src/components/submit/EditableProjectPreview.tsx` (investigate + adopt if applicable)

## Implementation plan (single pass)

Status: planned

### Workstream 1: Shared score-scale module
- Add `packages/shared/src/slop-score-scale.ts`.
- Export module from `packages/shared/src/index.ts`.
- Codify band boundaries and labels.
- Define aggregate mapping rule (`reviewCount === 0 => unrated`).

### Workstream 2: Web presentation adapter
- Add `apps/web/src/lib/slop-score-presentation.ts`.
- Map each `SlopBand` to tone classes for badge/text.
- Centralize class policy so components stop carrying local tone helpers.

### Workstream 3: Update all current consumers in one PR
- `CommentForm`: replace `getScoreLabel/getScoreColor` with shared + adapter helpers.
- `CommentItem`: replace local `getScoreTone`.
- `ProjectCard`: replace local `getSlopTone`.
- `ProjectCard`: replace static `"Slop"` label with computed term from aggregate band.
- `ScoreWidget`: replace local `getSlopTone`.
- `ScoreWidget`: display computed term near the score.
- `EditableProject`: evaluate read-only score section and adopt shared formatting/term helper if it improves consistency.
- `EditableProjectPreview`: evaluate unrated placeholder section and adopt shared `UNRATED` treatment if it improves consistency.

### Workstream 4: Validate and ship
- Run `pnpm -F @slop/shared exec tsc --noEmit`.
- Run `pnpm -F @slop/web exec tsc --noEmit`.
- Manual verification across feed card variants (`list-sm`, `list-lg`, `grid`) and project detail widget.
- Verify unrated projects (`reviewCount=0`) render neutral tone and neutral term state.

Files to change:
- `packages/shared/src/slop-score-scale.ts` (new)
- `packages/shared/src/index.ts`
- `apps/web/src/lib/slop-score-presentation.ts` (new)
- `apps/web/src/components/comment/CommentForm.tsx`
- `apps/web/src/components/comment/CommentItem.tsx`
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/components/project/ScoreWidget.tsx`
- `apps/web/src/components/project/EditableProject.tsx` (investigation target)
- `apps/web/src/components/submit/EditableProjectPreview.tsx` (investigation target)

## Aggregate mapping rule proposal

For project aggregate (decimal score):

1. If `reviewCount === 0` => `unrated`
2. Else apply same band boundaries as review scale on decimal value:
   - `>= 9.5` immaculate
   - `>= 8` solid
   - `>= 6` decent
   - `>= 4` stale
   - else sloppy

This keeps semantics aligned with review scoring and avoids reintroducing percent-based thresholds.

## Acceptance criteria

1. Project score badge color is no longer always red for rated projects.
2. Project card score term is no longer hardcoded `"Slop"`; it reflects the mapped band.
3. Score band labels/tones are sourced from shared abstraction, not duplicated per component.
4. `reviewCount=0` shows `UNRATED` with neutral tone consistently on all score surfaces where term text is shown.
5. Edit/preview surfaces are explicitly reviewed and either updated to use shared helpers or documented as intentionally unchanged.
