# Debug: Worker cleanup lock error (ERR_INVALID_ARG_TYPE)

**Date:** 2026-01-26
**Status:** Investigating

## Error
```
Initial cleanup failed: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date
    at Function.byteLength (node:buffer:777:11)
    at Function.str (node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/bytes.js:22:27)
    at ... Bind ...
```

## Current Implementation (relevant)
- Worker startup runs `acquireLock("cleanup_drafts", ...)` before `handleCleanupDrafts`:
  - `apps/worker/src/index.ts`
- Lock implementation:
  - `apps/worker/src/lib/locks.ts`
  - Uses `sql`${locks.expiresAt} < ${now}`` for cleanup + conflict update `where`.
  - Passes `Date` values (`now`, `expiresAt`) in `.values()` and in `sql` template params.

## Hypotheses
1) **postgres-js parameter encoding doesn’t accept `Date` in `sql` template params**
   - The error indicates `Buffer.byteLength` received a `Date` directly (not serialized).
   - The likely culprit is `sql`${locks.expiresAt} < ${now}`` in cleanup or onConflict `where`.

2) **`onConflictDoUpdate.where` path bypasses date serialization**
   - Drizzle might not coerce Date objects for `where` SQL fragments the same way it does for `.values()`.
   - That would explain why `.values({ expiresAt })` works but `sql"... ${now}"` fails.

3) **Cleanup path (best‑effort delete) is the first executed query**
   - The error is thrown during initial cleanup, before lock acquire completes.
   - The 1% cleanup branch may still trigger on startup, and that delete uses `sql` with a Date param.

## Findings (from debug logs)
- `acquireLock` starts and fails immediately before any cleanup-branch log.
- Indicates the failure occurs in the main `insert/onConflictDoUpdate` query rather than the cleanup delete.
- Confirms Date serialization inside the `sql` condition (likely the `where` clause) is the most probable culprit.

## Next Steps (no code changes yet)
- Confirm which query triggers the error:
  - Temporarily add logging around the cleanup branch and the `onConflictDoUpdate.where` branch.
- If hypothesis #1/#2 is correct, adjust to pass ISO strings or use `sql.raw` with explicit casts (e.g., `to_timestamp`).
- Ensure Date handling is consistent with postgres-js expectations.

## Proposed Fix Options
1) **Pass ISO strings instead of Date objects** in SQL fragments:\n   - `const nowIso = now.toISOString();`\n   - Use `sql`${locks.expiresAt} < ${nowIso}``\n   - Simplest and consistent with postgres-js parameter encoding.
2) **Use SQL cast explicitly**:\n   - `sql`${locks.expiresAt} < ${sql.raw(\"to_timestamp(\")}${nowMs / 1000}${sql.raw(\")\")}``\n   - More verbose; avoids relying on driver Date handling.
3) **Avoid raw SQL altogether** by using Drizzle helpers if available:\n   - e.g., `lt(locks.expiresAt, nowIso)`\n   - Best if supported for timestamp comparison without serialization issues.

**Recommendation:** Option 1 (ISO strings) for minimal change and clarity.
