# Phase 3: Admin Feature/Unfeature API + Audit

## Status

**Status:** ✅ Completed (2026-03-02)  
**Owner:** API  
**Depends On:** Phase 1

## Goal

Add admin-only endpoints to feature and unfeature projects, including moderation-event audit logs.

## Files To Change

- `/Users/adam/code/slop.haus/apps/api/src/routes/admin.ts`
- `/Users/adam/code/slop.haus/apps/web/src/lib/api/admin.ts` (client wrappers consumed in phase 4)
- `/Users/adam/code/slop.haus/packages/db/src/schema/moderation.ts` (only if schema/type adjustments become necessary)

## API Behavior Target

- `POST /api/v1/admin/projects/:id/feature`
  - Requires `requireAdmin()`.
  - Fails for non-existent project (`404`).
  - Fails for non-`published` project (`400` or `409` with explicit message).
  - Sets `featuredAt = now()`, `featuredByUserId = session.user.id`.
  - Writes moderation audit event.
- `DELETE /api/v1/admin/projects/:id/feature`
  - Requires `requireAdmin()`.
  - Clears `featuredAt` and `featuredByUserId`.
  - Writes moderation audit event.
- Existing hide/remove actions should clear featured fields when transitioning away from `published`.

## Audit Event Requirements

- Write to `moderation_events` on feature and unfeature.
- Use existing enum-safe values:
  - `targetType: "project"`
  - `decision: "approved"`
  - `model: "admin_feature"`
  - `confidenceLevel: "absolute"` (or another fixed non-null level)
  - `labels`: JSON payload indicating action (`feature` or `unfeature`)
  - `reason`: include acting admin ID and action context

## Tasks

1. Add feature endpoint with admin gate and status validation.
2. Add unfeature endpoint with admin gate.
3. Add shared helper logic for writing moderation audit entries.
4. Update existing admin status-changing handlers (hide/remove) to clear featured metadata.
5. Add web API client methods for phase 4 UI integration.

## Code Snippets (Conceptual)

```ts
adminRoutes.post("/projects/:id/feature", requireAdmin(), async (c) => {
  // validate published, set featured fields, insert moderation event
});
```

```ts
await db.update(projects).set({
  featuredAt: new Date(),
  featuredByUserId: session.user.id,
  updatedAt: new Date(),
});
```

```ts
await db.insert(moderationEvents).values({
  targetType: "project",
  targetId: projectId,
  model: "admin_feature",
  labels: [{ label: "feature", confidence: 1 }],
  confidenceLevel: "absolute",
  decision: "approved",
  reason: `admin:${session.user.id}:feature`,
});
```

## Verification Checklist

- [ ] Non-admin receives `403` for feature/unfeature.
- [ ] Admin can feature a published project.
- [ ] Admin cannot feature hidden/removed projects.
- [ ] Admin can unfeature previously featured project.
- [ ] Hide/remove flows clear featured metadata.
- [ ] Both endpoints create moderation-event audit rows.
- [ ] `pnpm -F @slop/api exec tsc --noEmit`

## Exit Criteria

- Admin feature lifecycle is secured, auditable, and consistent with project status transitions.
