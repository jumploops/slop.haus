# Phase 5: Verification + Polish

## Status

**Status:** 🔄 In Progress  
**Owner:** Web  
**Depends On:** [Phase 2](./phase-2-tooltip-infrastructure.md), [Phase 3](./phase-3-vibebadge-and-projectcard-integration.md), [Phase 4](./phase-4-vibe-terminology-unification.md)

## Goal

Validate functional correctness, interaction safety, terminology consistency, and type safety for the full VibeBadge rollout.

## Files To Change

- No product code expected.
- Plan/doc updates only if verification reveals issues requiring follow-up tasks.

## Tasks

1. Run web package typecheck:
   - `pnpm -F @slop/web exec tsc --noEmit`
2. Run lint if needed for touched UI files:
   - `pnpm -F @slop/web run lint`
3. Manual QA on card surfaces:
   - feed list-sm/list-lg/grid,
   - favorites list.
4. Manual QA on terminology surfaces:
   - project page score panel,
   - submit flow vibe section,
   - edit flow vibe section.
5. Validate tooltip accessibility:
   - mouse hover,
   - keyboard focus,
   - escape/blur behavior.
6. Validate edge-case mappings around rounded boundaries (`4/5`, `14/15`, `94/95`).
7. Record any regressions and decide whether they block ship.

## QA Matrix

| Surface | Expected Result |
| --- | --- |
| Feed cards (all display modes) | Badge visible, tooltip works, no card layout break |
| Favorites cards | Badge visible, tooltip works, favorite toggle unaffected |
| My Projects cards | No badge shown |
| Project detail score widget | Label term matches taxonomy utility |
| Submit vibe section | Label term matches taxonomy utility |
| Edit vibe section | Label term matches taxonomy utility |

## Verification Checklist

- [ ] Typecheck passes or only unrelated pre-existing errors remain documented.
- [ ] Tooltip behavior is accessible and stable in light/dark themes.
- [ ] Card interaction model is unchanged except added badge tooltip behavior.
- [ ] Terminology is consistent across badge/project/submit/edit surfaces.
- [ ] No unresolved blockers remain.

## Exit Criteria

- VibeBadge feature is implementation-complete, verified, and ready for merge/review.

## Progress Notes

- `pnpm -F @slop/web exec tsc --noEmit` passes with current changes.
- `pnpm -F @slop/web run lint` cannot run non-interactively because `next lint` prompts for ESLint setup in this repo.
- Manual UI QA remains pending.
