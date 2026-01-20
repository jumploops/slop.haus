# Phase 5.5: Post-Review Fixes

## Goal
Address issues identified in the Phases 1-5 review before continuing to Phase 6.

## Issues to Fix

### High Priority

#### 5.5.1 Fix Comment Routes Double-Mounting
**Location:** `apps/api/src/index.ts:47-48`

**Problem:** Comment routes are mounted at both `/api/v1/projects` and `/api/v1/comments`, causing unintended route patterns like `/api/v1/comments/:slug/comments`.

**Solution:** Split into two separate routers:
- `projectCommentRoutes` - for `/:slug/comments` endpoints (list, create)
- `commentRoutes` - for `/:id` endpoints (edit, delete)

```typescript
// index.ts
app.route("/api/v1/projects", projectCommentRoutes);
app.route("/api/v1/comments", commentRoutes);
```

#### 5.5.2 Verify Better Auth Account Linking Behavior
**Location:** `apps/api/src/lib/auth.ts:29-33`

**Problem:** `trustedProviders: ["google", "github"]` may auto-link accounts by email, conflicting with design intent of "explicit linking only".

**Solution:**
- Review Better Auth documentation for exact behavior
- Either remove `trustedProviders` or confirm it only affects explicit link requests
- Test: Create account with Google, then try GitHub with same email - verify behavior

---

### Medium Priority

#### 5.5.3 Add Rate Limiting to Voting
**Location:** `apps/api/src/routes/votes.ts`

**Problem:** No rate limiting on vote endpoint, vulnerable to abuse.

**Solution:** Add middleware rate limiting:
- Max 30 votes/minute per rater_key_hash
- Max 10 vote changes on same project per hour

Options:
- Simple in-memory rate limiter for MVP
- Redis-based for production
- Or defer to edge (Cloudflare) rate limiting

#### 5.5.4 Implement Unlink Account Route
**Location:** `apps/api/src/routes/auth.ts`

**Problem:** Missing `DELETE /api/v1/auth/unlink/:provider` endpoint.

**Solution:** Add endpoint:
```typescript
authRoutes.delete("/unlink/:provider", requireAuth(), async (c) => {
  // Verify user has at least 2 linked providers (can't unlink last one)
  // Delete account record for provider
  // Return success
});
```

#### 5.5.5 Add Favorites API Routes
**Location:** New file `apps/api/src/routes/favorites.ts`

**Problem:** Favorites table exists but no API.

**Solution:** Create routes:
```
POST   /api/v1/projects/:slug/favorite     - Add to favorites
DELETE /api/v1/projects/:slug/favorite     - Remove from favorites
GET    /api/v1/users/me/favorites          - List user's favorites
```

#### 5.5.6 Fix Hot Sort Pagination
**Location:** `apps/api/src/routes/projects.ts:103-118`

**Problem:** Hot sort fetches max 200 items and sorts in memory, breaking pagination beyond page 10.

**Solution Options:**
1. **Quick fix:** Increase limit to 1000 (still has upper bound)
2. **Proper fix:** Precompute hot scores periodically, store in DB, query with proper pagination
3. **Hybrid:** For MVP, use quick fix + add TODO for precomputation in Phase 10

#### 5.5.7 Add Dev Verification Stub
**Location:** `apps/api/src/routes/auth.ts`

**Problem:** No mechanism to verify developers.

**Solution:** For now, add admin-only endpoint to manually verify devs:
```
POST /api/v1/admin/verify-dev/:userId
```

Full GitHub-based verification (check repos, contributions) can come in Phase 10.

---

### Low Priority

#### 5.5.8 Add FK Constraint on Comments Self-Reference
**Location:** `packages/db/src/schema/comments.ts:26`

**Problem:** `parentCommentId` lacks foreign key reference.

**Solution:**
```typescript
parentCommentId: uuid("parent_comment_id").references(() => comments.id),
```

Note: Requires schema change, run `db:push` after.

#### 5.5.9 Standardize Comment Edit Validation
**Location:** `apps/api/src/routes/comments.ts:145-147`

**Problem:** Manual validation instead of Zod schema.

**Solution:** Create and use `updateCommentSchema`:
```typescript
// schemas.ts
export const updateCommentSchema = z.object({
  body: z.string().min(1).max(10000),
});
```

#### 5.5.10 Add Database Indexes
**Location:** `packages/db/src/schema/*.ts`

**Problem:** Missing indexes for common queries.

**Solution:** Add indexes:
```typescript
// comments.ts
export const commentsProjectIdIdx = index("comments_project_id_idx").on(comments.projectId);

// projects.ts
export const projectsAuthorUserIdIdx = index("projects_author_user_id_idx").on(projects.authorUserId);
export const projectsStatusIdx = index("projects_status_idx").on(projects.status);
```

#### 5.5.11 Fix Type Mismatches in Shared Package
**Location:** `packages/shared/src/types.ts`

**Problem:** Types don't match schema (email nullability, missing fields).

**Solution:**
- Update `User.email` to `string` (not nullable, matches schema)
- Add `vibeDetailsJson` to `Project` type
- Add `enrichmentStatus` to `Project` type

#### 5.5.12 Fix Auth Middleware Type Casting
**Location:** `apps/api/src/middleware/auth.ts:40-41`

**Problem:** Using `(session.user as any)` for custom fields.

**Solution:** Extend Better Auth types or create typed helper:
```typescript
interface BetterAuthUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role?: "user" | "mod" | "admin";
  devVerified?: boolean;
}
```

---

## Order of Operations

1. **5.5.1** - Fix comment routes (breaks current API)
2. **5.5.2** - Verify account linking (behavior check)
3. **5.5.8** - Add FK constraint (schema change)
4. **5.5.11** - Fix type mismatches (affects other code)
5. **5.5.9** - Standardize validation
6. **5.5.12** - Fix type casting
7. **5.5.3** - Add rate limiting
8. **5.5.4** - Implement unlink route
9. **5.5.5** - Add favorites API
10. **5.5.6** - Fix hot sort pagination
11. **5.5.7** - Add dev verification stub
12. **5.5.10** - Add indexes (last, requires db:push)

---

## Testing Checklist

After fixes, verify:
- [ ] `GET /api/v1/projects/:slug/comments` returns comments
- [ ] `POST /api/v1/projects/:slug/comments` creates comment
- [ ] `PATCH /api/v1/comments/:id` edits comment
- [ ] `DELETE /api/v1/comments/:id` deletes comment
- [ ] Account linking behavior matches design
- [ ] TypeScript compiles without errors
- [ ] Existing functionality still works

---

## Dependencies
- Phase 5 complete

## Output
- All high/medium priority issues resolved
- Codebase ready for Phase 6 (Enrichment)
