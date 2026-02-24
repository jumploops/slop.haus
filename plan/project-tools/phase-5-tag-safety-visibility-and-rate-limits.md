# Phase 5: Tag Safety + Blocked Visibility + Rate Limits

## Status

**Status:** Completed  
**Owner:** API + Web  
**Depends On:** [Phase 2](./phase-2-backend-tag-resolution-and-write-paths.md), [Phase 3](./phase-3-frontend-free-entry-and-slug-fix.md)

## Goal

Enforce abuse controls and visibility guarantees for open tag creation, including blocked-tag behavior.

## Files To Change

- `/Users/adam/code/slop.haus/apps/api/src/lib/*` (new validation/moderation/rate-limit helper modules)
- `/Users/adam/code/slop.haus/apps/api/src/routes/projects.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/drafts.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/tools.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/admin.ts` (if blocked-tag operations are added here)
- `/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectDetails.tsx` (verify hidden blocked tags never render)
- `/Users/adam/code/slop.haus/apps/web/src/lib/api/projects.ts` (if contract additions are needed)

## Tasks

1. Enforce server-side validation policy for incoming tools:
   - max total tools `10`,
   - max new tools `10`,
   - allowed character set and length constraints.
2. Add daily per-user new-tag creation limit (`100`, configurable env/constant).
3. Add denylist/profanity gate before creating new tags.
4. Ensure blocked tags are hidden everywhere:
   - listing/search endpoints,
   - project detail response,
   - edit/review surfaces receiving project data.
5. Preserve eventual cache invalidation approach:
   - update cache keys/TTL strategy as needed,
   - do not require synchronous global purge.
6. Ensure blocked tags cannot be re-created as active duplicates via slug collision.

## Implementation Notes

- Blocked tools should remain in DB for audit/history but excluded from read responses.
- If a requested tool resolves to blocked status:
  - either omit silently or return validation error; choose and document one behavior.
- Rate-limit counters can start in-memory for parity with current architecture, with Redis migration tracked separately.

## Example Snippet

```ts
if (newToolsCreatedToday >= DAILY_NEW_TOOL_LIMIT) {
  throw new HttpError(429, "Daily new tag limit reached");
}
```

## Verification Checklist

- [x] User cannot create more than 100 new tags/day.
- [x] Blocked tags do not appear in project detail, edit, or search endpoints.
- [x] Attempt to submit blocked tag does not surface it as active.
- [x] Eventual cache invalidation behavior is documented and observed in QA.
- [x] `pnpm -F @slop/api exec tsc --noEmit`
- [x] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- Open tag creation has baseline abuse controls.
- Blocked-tag hiding is consistent across all read paths.
