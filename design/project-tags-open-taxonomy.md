# Project Tags: Runtime Creation and Open Taxonomy

**Doc status:** Draft  
**Date:** 2026-02-24  
**Owner:** slop.haus team

## 1) Objective

Introduce a production-safe tag system where:

- Tags are available in production (no empty catalog by default).
- Users can add new tags by typing and pressing Enter.
- LLM-driven project parsing can suggest and persist new tags (not only pre-seeded ones).
- We keep compatibility with the current data model (`tools` + `project_tools`) while improving behavior.

## 2) New Constraints from Product

1. Production currently has no tags loaded.
2. Users must be able to create tags inline during submission/edit.
3. LLM parsing flow must be able to introduce new tags.
4. This should be designed before implementation (this document).

## 2.1) Locked Decisions (2026-02-24)

1. Unknown LLM-suggested tags are auto-persisted on submit.
2. Max number of new tags per submission is 10 (same as project tag cap).
3. Tags are user-entered strings and must allow:
   - spaces (example: `React Native`)
   - `+`, `#`, `.`, `/` (examples: `C++`, `C#`, `Next.js`)
4. Admin alias/merge UI is deferred to a follow-up milestone.
5. Blocked tags are hidden everywhere (including historical projects).
6. API field name remains `tools` for now.
7. No one-time remediation needed for historical name/slug mismatch.
8. Baseline tags should be generated from:
   - existing seed constants
   - root [`example_tools.csv`](../example_tools.csv)
9. Display preserves user-entered casing while canonical slug normalization is handled separately.
10. Daily per-user cap for newly created tags: 100 (initial default, configurable).
11. Blocked tags can propagate through eventual cache invalidation (no immediate global purge required).

## 3) Current State Snapshot

### Data model

- Tags are currently stored as `tools` and linked via `project_tools`:
  - [`packages/db/src/schema/projects.ts`](../packages/db/src/schema/projects.ts)
- `tools` is a curated table (name + slug) with no runtime creation path in API.

### API behavior

- Read-only tools endpoint:
  - `GET /api/v1/tools` in [`apps/api/src/routes/tools.ts`](../apps/api/src/routes/tools.ts)
- Project create/update link tags by looking up **slug** in `tools`:
  - [`apps/api/src/routes/projects.ts`](../apps/api/src/routes/projects.ts)
- Draft submit also links by slug lookup:
  - [`apps/api/src/routes/drafts.ts`](../apps/api/src/routes/drafts.ts)

### Seed and production gap

- Default tags are seeded only by seed scripts:
  - [`packages/db/src/seed/tools.ts`](../packages/db/src/seed/tools.ts)
- Migrations create `tools` table but do not insert baseline rows.
- Result: production DB can have an empty `tools` table.

### Existing behavioral gaps

1. Manual submit uses `tool.name` in frontend selector, while API expects slugs.
   - This can drop selected tags during create/update.
   - [`apps/web/src/components/form/ToolsSelector.tsx`](../apps/web/src/components/form/ToolsSelector.tsx)
2. LLM extraction currently maps only to existing DB tags, dropping unknowns.
   - [`apps/worker/src/lib/tool-matching.ts`](../apps/worker/src/lib/tool-matching.ts)

## 4) Proposed Product Behavior

### User experience

- Tag input supports typeahead from existing tags.
- Pressing Enter/Comma on unmatched input adds a new local tag chip immediately.
- User can submit with a mix of existing + new tags.
- Existing max tags per project remains 10 unless changed by product.

### LLM behavior

- Draft analysis can output tags not yet in DB.
- Unknown tags are preserved through draft review and can be persisted on submit.

### Persistence behavior

- On project create/update/submit, server resolves all incoming tag strings:
  - map to existing canonical tag if present
  - otherwise create a new canonical tag (subject to safety checks)
- Linking to `project_tools` remains unchanged structurally.

## 5) Proposed Architecture

## 5.1 Keep current tables, add tag lifecycle metadata

Keep `tools` + `project_tools`, but add minimal metadata to `tools`:

- `status`: `active | blocked`
- `source`: `seed | user | llm | admin`
- `createdByUserId` (nullable FK to `user.id`)
- `usageCount` (integer, default 0)
- `createdAt`, `updatedAt`

Rationale:

- Enables moderation/abuse response without destructive deletes.
- Adds provenance for analytics and trust tuning.

## 5.2 Canonicalization and de-duplication service

Create a shared backend helper (single source of truth), e.g. `resolveAndUpsertTags(inputs, context)`:

1. Normalize input:
   - trim, collapse whitespace, lowercase slug generation
   - reject empty or invalid values
2. De-duplicate within request.
3. Validate limits (count/length/new tag caps).
4. Lookup existing by slug.
5. Insert missing with `on conflict do nothing`.
6. Re-select canonical rows and return `toolId`s.

Use this helper in:

- `POST /projects`
- `PATCH /projects/:slug`
- `POST /drafts/:draftId/submit`

This removes name-vs-slug drift across flows.

## 5.3 Production bootstrap for non-empty suggestions

Add a tracked DB migration that inserts a baseline tag catalog (`ON CONFLICT DO NOTHING`) generated from:

- `packages/db/src/seed/tools.ts`
- `example_tools.csv`

Reason:

- Production should not depend on local seed scripts.
- Even with runtime creation, baseline tags improve autocomplete quality immediately.

## 5.4 Worker pipeline changes for LLM tags

Adjust analysis flow so unknown tags are not dropped:

- Keep alias normalization (e.g., `js -> javascript`) where useful.
- Preserve unknown detected tags as candidate values.
- Enforce same validation limits as user input.
- Auto-persist unknown LLM tags during submit (same path as user-entered tags).
- Defer DB insertion until user submit (prevents tag spam from abandoned drafts/jobs).

## 5.5 API compatibility and naming

- Keep existing API field name `tools` for v1 compatibility.
- UI copy can use “Tags / Technologies”.
- Consider a future API rename (`tools` -> `tags`) only with a compatibility window.

## 6) Frontend Changes (V1)

Update both tag inputs to support free entry:

- [`apps/web/src/components/form/ToolsSelector.tsx`](../apps/web/src/components/form/ToolsSelector.tsx)
- [`apps/web/src/components/submit/TagEditor.tsx`](../apps/web/src/components/submit/TagEditor.tsx)

Required behavior:

1. Enter/Comma creates chip from current text.
2. Existing suggestion click still works.
3. Prevent duplicate chips (case-insensitive + normalized slug comparison).
4. Show new chip even if not in fetched suggestions.
5. Keep max 10 tags UI enforcement.

## 7) Security and Abuse Concerns

## 7.1 Abuse vectors

- Tag spam (many low-quality tags).
- Toxic/offensive tags.
- Extremely long/invalid Unicode inputs.
- Duplicate variants (`React`, `react`, `react.js`) polluting taxonomy.
- LLM-generated noise creating many one-off tags.

## 7.2 Recommended controls

1. Auth-required creation path (no anonymous tag creation).
2. Validation:
   - length bounds per tag
   - per-project tag cap (10)
   - per-request new-tag cap (10)
   - allow spaces and `+`, `#`, `.`, `/` in raw tag strings
3. Rate limits for new tag creation per user/day.
4. Denylist/profanity checks before insert.
5. `status=blocked` support so moderation can hide tags globally, including historical project displays.
6. Audit logging for created tags (user ID, source, project ID).

## 7.3 Architecture concerns

- Concurrency: two requests creating same new tag must resolve safely (unique slug + upsert).
- Search performance as tag count grows:
  - index on normalized search field / slug
  - retain API `limit`.
- Taxonomy quality:
  - optional alias/merge workflow for admins (not required for V1 but likely needed).

## 8) Rollout Plan

1. **Migration:** add `tools` metadata + baseline inserts.
2. **Backend:** add shared resolve/upsert service and route integrations.
3. **Frontend:** enable Enter-to-add chips in both tag editors.
4. **Worker:** preserve unknown tags through draft analysis.
5. **Observability:** ship metrics/logging and monitor for spam/quality regressions.

## 9) Observability Requirements

Track at minimum:

- Number of new tags created per day (by source: user/llm/admin).
- New-tag creation failures (validation, rate-limit, blocked).
- Top newly created tags (for moderation review).
- Percent of projects with at least one new (non-baseline) tag.
- Frequency of blocked/removed tags.

## 10) Remaining Open Questions

None currently.
