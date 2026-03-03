# Phase 1: Shared Vibe Taxonomy Utility

## Status

**Status:** ✅ Completed  
**Owner:** Web  
**Depends On:** None

## Goal

Create a single frontend utility that normalizes vibe percentage values and resolves sample taxonomy terms consistently for all consumers (`VibeBadge`, `VibeMeter`, `VibeInput`).

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/lib/vibe-taxonomy.ts` (new)

## Tasks

1. Create a shared utility module exporting:
   - percent clamp helper (`0..100`),
   - rounded decile bucket helper,
   - term lookup by bucket,
   - optional helper returning full metadata (`percent`, `bucket`, `label`).
2. Implement rounded decile behavior:
   - `bucket = Math.round(clampedPercent / 10) * 10`,
   - clamp bucket to `[0, 100]`.
3. Encode sample taxonomy label mapping as constants.
4. Export narrow types where useful (e.g. bucket union) to reduce consumer mistakes.
5. Add concise inline comments for edge-case behavior (`5 -> 10`, `95 -> 100`).

## Canonical Label Mapping

| Bucket | Label |
| --- | --- |
| 0 | Handcrafted |
| 10 | Mostly Human |
| 20 | Mostly Human |
| 30 | Mostly Human |
| 40 | AI-Assisted |
| 50 | AI-Assisted |
| 60 | AI-Assisted |
| 70 | Mostly AI |
| 80 | Mostly AI |
| 90 | Vibecoded |
| 100 | Pure Vibe |

## Implementation Notes

- This module is the source of truth for vibe labels on web surfaces.
- Consumers should not duplicate label/bucket logic locally.
- Keep implementation lightweight and framework-agnostic (plain TS helpers).

## Code Snippets (Conceptual)

```ts
export type VibeBucket = 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;

export function getRoundedVibeBucket(percent: number): VibeBucket {
  const clamped = clampVibePercent(percent);
  const bucket = Math.round(clamped / 10) * 10;
  return Math.max(0, Math.min(100, bucket)) as VibeBucket;
}
```

```ts
export function getVibeLabel(percent: number): string {
  return VIBE_LABEL_BY_BUCKET[getRoundedVibeBucket(percent)];
}
```

## Verification Checklist

- [x] Utility compiles with strict TypeScript settings in `apps/web`.
- [x] Edge cases resolve correctly (`-1`, `0`, `4`, `5`, `94`, `95`, `100`, `101`).
- [x] Exported API is sufficient for badge and meter/input consumers.

## Exit Criteria

- A single shared utility exists and can fully replace ad hoc label logic in all targeted UI components.
