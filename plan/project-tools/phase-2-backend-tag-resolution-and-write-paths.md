# Phase 2: Backend Tag Resolution + Write Paths

## Status

**Status:** Completed  
**Owner:** API  
**Depends On:** [Phase 1](./phase-1-schema-and-baseline-bootstrap.md)

## Goal

Implement one canonical server-side tool resolution flow for all write paths so existing and new tags are handled consistently.

## Files To Change

- `/Users/adam/code/slop.haus/apps/api/src/routes/projects.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/drafts.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/tools.ts` (read-path adjustments if needed)
- `/Users/adam/code/slop.haus/apps/api/src/lib/*` (new resolver helper module)
- `/Users/adam/code/slop.haus/packages/shared/src/schemas.ts` (validation refinements)
- `/Users/adam/code/slop.haus/packages/shared/src/draft-types.ts` (if request contracts need updates)

## Tasks

1. Add a shared helper (for example `resolveAndUpsertTools`) that:
   - accepts raw strings from request payload,
   - normalizes/canonicalizes slug,
   - preserves display casing/name policy,
   - creates missing tools with metadata (`source=user|llm`, `status=active`),
   - returns canonical tool rows/IDs.
2. Enforce contract limits centrally:
   - max total tools per submission: `10`,
   - max new tools per submission: `10`,
   - character policy includes spaces and `+`, `#`, `.`, `/`.
3. Integrate helper into:
   - `POST /projects`,
   - `PATCH /projects/:slug`,
   - `POST /drafts/:draftId/submit`.
4. Ensure project update tool replacement remains atomic:
   - delete existing `project_tools`,
   - re-link canonical set.
5. Increment `usageCount` on linked tools (or schedule in follow-up if expensive; choose one policy explicitly).
6. Update list/search routes to default to `status='active'` where appropriate.

## Implementation Notes

- Keep request/response API field name as `tools`.
- Use `INSERT ... ON CONFLICT DO NOTHING` for concurrency-safe creation.
- Re-select by slug after insert attempt to ensure consistent IDs under races.
- Return deterministic tool ordering (e.g., by name asc or input order).

## Example Snippet

```ts
const resolved = await resolveAndUpsertTools({
  rawTools: data.tools ?? [],
  source: "user",
  createdByUserId: session.user.id,
  maxTotal: 10,
  maxNew: 10,
});
```

## Verification Checklist

- [ ] Create project with only existing tools works.
- [ ] Create project with new tools persists and links correctly.
- [ ] Draft submit with unknown LLM tools persists and links.
- [ ] Edit flow replacing tools keeps final set accurate.
- [ ] Concurrent requests for same new tag do not create duplicates.
- [ ] Blocked tools are not returned in active list endpoints.
- [ ] `pnpm -F @slop/api exec tsc --noEmit`
- [ ] `pnpm -F @slop/shared exec tsc --noEmit`

## Exit Criteria

- All write paths use a single canonical resolution strategy.
- New tools can be created safely by user and LLM submit flows.
