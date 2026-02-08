# Seed Review Score Distribution (0-10)

## Status
- State: Implemented
- Owner: Codex
- Last Updated: 2026-02-08

## Goal

Update DB seed review generation so seeded project `slopScore` values are spread across the full `0-10` range, with deterministic high-scoring and low-scoring projects.

## Current Issue

- Seeded top-level comment `reviewScore` values are generated in a legacy low range (`1-5`), which compresses aggregate project scores.
- This does not reflect the current app review scale (`0-10`).

## Proposed Implementation

1. Add deterministic per-project score targets grouped by quality bucket.
- Assign projects evenly across three buckets:
  - low: `0-3`
  - mid: `4-7`
  - high: `8-10`
- Within each bucket, distribute project target scores evenly across that bucket range.

2. Generate top-level review scores around each project target.
- For each project, generate root comment review scores as integers constrained to the project bucket range.
- Adjust generated scores so their average matches the project target (within integer constraints).
- Keep replies as non-review comments (`reviewScore: null`).

3. Keep aggregate calculation unchanged.
- Continue deriving `reviewCount`, `reviewScoreTotal`, and `slopScore` from generated comments in `seed.ts`.

## Files To Change

- `packages/db/src/seed/comments.ts`
- `packages/db/src/seed.ts`

## Verification

1. After `pnpm db:reset`, sampled projects should include low, mid, and high `slopScore` values.
2. Comment review rows should use `0-10` scores, with project-local clustering by bucket (`0-3`, `4-7`, `8-10`).
3. Aggregate project scores should reflect grouped project quality (bad/mid/good), with all three ranges represented.

Implementation note:
- Runtime reseed verification was not executed in this sandbox; please run `pnpm db:reset` locally to regenerate and inspect distribution.
