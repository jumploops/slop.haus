# Phase 4: Worker LLM Tag Preservation

## Status

**Status:** Completed  
**Owner:** Worker  
**Depends On:** [Phase 2](./phase-2-backend-tag-resolution-and-write-paths.md)

## Goal

Ensure LLM-detected unknown tools are preserved through draft lifecycle and persisted on submit.

## Files To Change

- `/Users/adam/code/slop.haus/apps/worker/src/lib/tool-matching.ts`
- `/Users/adam/code/slop.haus/apps/worker/src/handlers/analyze-content.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/drafts.ts` (submit persistence path already covered in Phase 2; validate alignment)
- `/Users/adam/code/slop.haus/packages/shared/src/schemas.ts` (tool field constraints if needed)

## Tasks

1. Update tool matching strategy:
   - still map known aliases/canonical matches,
   - do not drop unknown detected tools,
   - output a deduplicated candidate list bounded by submission limits.
2. Ensure draft storage (`suggestedTools` / `finalTools`) can carry unknown-but-valid values.
3. Keep DB writes deferred until submit path (avoid abandoned draft spam).
4. Confirm submit route classifies tool source as `llm` when new tags originate from draft suggestions.
5. Add guardrails for noisy model output:
   - enforce same character and length policy as user-entered tags,
   - cap tool count to `10`.

## Implementation Notes

- Preserve deterministic order where possible:
  - known canonical matches first,
  - remaining unknown tools in model-return order.
- Alias conversion should not over-expand short ambiguous strings.
- Existing false-positive TODO in matcher should remain tracked but not expanded beyond phase scope.

## Example Snippet

```ts
const candidates = normalizeAndValidateTools(extraction.detectedTools ?? [], { max: 10 });
const matchedKnown = await mapKnownToolSlugs(candidates);
const unmatched = candidates.filter((t) => !matchedKnown.has(t.slug));
const suggestedTools = [...matchedKnown.values(), ...unmatched.map((t) => t.raw)];
```

## Verification Checklist

- [ ] Draft analysis retains unknown valid tags in `suggested.tools`.
- [ ] Known aliases still map correctly.
- [ ] Excess/noisy tool outputs are truncated/validated.
- [ ] Draft submit persists unknown tools through Phase 2 resolver.
- [ ] `pnpm -F @slop/worker exec tsc --noEmit`

## Exit Criteria

- LLM-origin tags flow through draft-to-submit without silent drops.
