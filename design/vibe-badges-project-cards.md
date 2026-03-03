# VibeBadges on Project Cards

Status: revised after design review  
Owner: TBD  
Date: 2026-03-02

## Goal
Add `VibeBadge` to shared project cards and standardize vibe-tier terminology across badge and vibe-score UI on project, submit, and edit surfaces.

## Decisions confirmed (2026-03-02)
1. Include tooltip behavior in v1.
2. Add `@radix-ui/react-tooltip` to `apps/web`.
3. Use sample taxonomy terms for badges and vibe score UI.
4. Do not add `VibeBadge` to My Projects cards.
5. Bucket by rounded deciles (`round`, not `floor`).
6. Keep badge styling clean/neutral in v1 (no slop-mode treatment yet).

## Current implementation review

### Data and API
- `vibePercent` is already available across the stack.
- DB schema stores `projects.vibePercent` as a non-null integer.
- Feed/list APIs already return `vibePercent` in project list payloads.
- Frontend `ProjectListItem` already includes `vibePercent`.

### Existing UI surfaces
- Shared card: `apps/web/src/components/project/ProjectCard.tsx` (feed/favorites, variants: `list-sm`, `list-lg`, `grid`).
- Project page score: `apps/web/src/components/project/VibeMeter.tsx` via `ScoreWidget`.
- Submit/edit vibe UI: `apps/web/src/components/form/VibeInput.tsx`.
- My Projects page uses separate `MyProjectCard` (out of badge scope).

## Sample implementation review (`reference/vibe_badges/`)

### Reusable ideas
- Compact badge geometry with icon + percent.
- Level/tier mapping with human-readable labels.
- Tooltip detail panel.

### Required adaptations for this repo
- Support non-decile input percentages from current app data flow.
- Replace sample palette classes with repo-compliant semantic/slop token usage.
- Add missing tooltip primitive/dependency in `apps/web`.
- Integrate into existing interactive `ProjectCard` without breaking click/keyboard behavior.

## Integration design

### 1) Shared vibe taxonomy utility
Create a shared frontend utility for vibe tier logic:
- New: `apps/web/src/lib/vibe-taxonomy.ts`

Responsibilities:
- Clamp input percent to `[0, 100]`.
- Compute rounded decile bucket:
  - `bucket = Math.round(clamped / 10) * 10`
  - clamp bucket back to `[0, 100]`
- Return canonical sample terms by bucket (including:
  `Handcrafted`, `Human-led`, `Mostly Human`, `Human + AI`, `Hybrid`, `AI-Assisted`, `Mostly AI`, `Vibecoded`, `Pure Vibe`).
- Expose helpers so `VibeBadge`, `VibeMeter`, and `VibeInput` use the same vocabulary.

### 2) Tooltip infrastructure (required in v1)
- Add dependency: `@radix-ui/react-tooltip` in `apps/web/package.json`.
- Add UI wrapper:
  - New: `apps/web/src/components/ui/Tooltip.tsx`
- Follow current component patterns (`cn`, semantic classes, lightweight wrapper).

### 3) `VibeBadge` component
- New: `apps/web/src/components/project/VibeBadge.tsx`

Proposed API:
- `percent: number`
- `size?: "sm" | "md"` (default `sm`)
- `className?: string`

Behavior:
- Use shared taxonomy utility for bucket/label.
- Render exact clamped percent text (e.g. `63%`), but style/label by rounded bucket.
- Include tooltip content in v1 (label + percent + short descriptive line).
- Keep badge neutral (no slop-specific decorations for now).

### 4) Integrate `VibeBadge` into shared project cards
- Update: `apps/web/src/components/project/ProjectCard.tsx`
- Add badge to both render branches:
1. grid variant
2. list variants
- Place near title/tagline block so it complements (not replaces) slop score.
- Ensure any interactive badge trigger is treated as interactive inside card click handling (use existing interactive-target pattern as needed).

### 5) Standardize vibe terms on project/submit/edit vibe UI
- Update project vibe score wording to use shared taxonomy utility.
- Update submit/edit vibe score wording to use shared taxonomy utility.
- Primary touchpoints:
1. `apps/web/src/components/project/VibeMeter.tsx`
2. `apps/web/src/components/form/VibeInput.tsx`

Result:
- Badge + project page vibe score + submit/edit vibe score all use the same term mapping.

### 6) Scope boundaries
In scope:
- Shared `ProjectCard` badge integration.
- Tooltip support needed for badge.
- Shared taxonomy rollout for project/submit/edit vibe score terminology.

Out of scope:
- `MyProjectCard` badge integration in `apps/web/src/app/my/projects/page.tsx`.

## Planned file touchpoints (implementation phase)
- New: `apps/web/src/lib/vibe-taxonomy.ts`
- New: `apps/web/src/components/ui/Tooltip.tsx`
- New: `apps/web/src/components/project/VibeBadge.tsx`
- Update: `apps/web/src/components/project/ProjectCard.tsx`
- Update: `apps/web/src/components/project/VibeMeter.tsx`
- Update: `apps/web/src/components/form/VibeInput.tsx`
- Update: `apps/web/package.json`
- Optional: `apps/web/src/components/ui/Skeleton.tsx` (if we decide to reflect badge in loading state)

## Verification checklist (implementation phase)
- Badge appears in `ProjectCard` for `list-sm`, `list-lg`, and `grid`.
- No badge appears in My Projects cards.
- Tooltip renders correctly on hover/focus and is keyboard accessible.
- Card navigation and embedded controls (like/favorite/links) still behave correctly.
- Rounded-bucket mapping works at boundaries (`4`, `5`, `14`, `15`, `95`, `96`, etc.).
- Badge and tooltip are readable in light and dark modes.
- Project page vibe score term matches submit/edit term for same percent.
