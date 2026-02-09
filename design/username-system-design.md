# Username System Design (Pre-Launch)

**Status:** Draft  
**Date:** 2026-02-09  
**Owner:** Web/API

## 1) Goals

- Move from provider full names to usernames as the primary public identity.
- New GitHub users: pre-populate from GitHub handle.
- New Google users: pre-populate from random generated username.
- Keep implementation simple and robust, with low near-term risk.
- Keep future changes easy (validation rules, UX, profile model evolution).
- Provide a pleasant flow for users who want to change an auto-generated username.

## 2) Non-Goals (For This Phase)

- Building profile pages at `/u/:username`.
- Supporting username mentions/notifications.
- Fully removing `name` from all internal types on day one.

## 3) Current Implementation Deep Dive

### 3.1 Auth + Identity Data Flow

- Auth stack is Better Auth with social providers in `/Users/adam/code/slop.haus/apps/api/src/lib/auth.ts`.
- Auth routes are mounted at `/api/auth/*` (GET/POST only) in `/Users/adam/code/slop.haus/apps/api/src/index.ts`.
- OAuth providers configured: GitHub + Google.
- Account linking is enabled, explicit-only (`trustedProviders` intentionally not set).
- Session cookie cache is enabled for 5 minutes (`session.cookieCache.maxAge`).

### 3.2 User Schema

- User table currently has:
  - `id`, `name`, `email`, `emailVerified`, `image`, `role`, `devVerified`, timestamps
  - No dedicated `username` column
- Source: `/Users/adam/code/slop.haus/packages/db/src/schema/users.ts`.

### 3.3 Provider Name Behavior Today

- Better Auth GitHub provider default maps `name` as `profile.name || profile.login`.
- Better Auth Google provider default maps `name` as `user.name`.
- This means current `user.name` is provider-driven and inconsistent in format.
- Local package evidence:
  - GitHub mapper in `.../better-auth/dist/social-providers/index.mjs`
  - Google mapper in same file.

### 3.4 Profile Update Behavior Today

- Frontend profile page calls `PATCH /api/v1/users/me` with `{ name }` in `/Users/adam/code/slop.haus/apps/web/src/app/settings/profile/page.tsx`.
- No matching route exists in `/Users/adam/code/slop.haus/apps/api/src/routes/users.ts`.
- This endpoint gap is also documented in `/Users/adam/code/slop.haus/debug/phase-9-gap-analysis.md`.
- Better Auth already provides `POST /api/auth/update-user`, which updates user and refreshes session cookie.

### 3.5 Where Name Is Consumed

- API joins use `user.name` for project/comment/admin author payloads:
  - `/Users/adam/code/slop.haus/apps/api/src/routes/projects.ts`
  - `/Users/adam/code/slop.haus/apps/api/src/routes/projectComments.ts`
  - `/Users/adam/code/slop.haus/apps/api/src/routes/users.ts`
  - `/Users/adam/code/slop.haus/apps/api/src/routes/admin.ts`
- Frontend renders `author.name` and `session.user.name` widely:
  - project cards/details/edit
  - comments
  - nav/profile/admin UI

### 3.6 Important Constraints

- Name is not denormalized into project/comment tables, so identity label changes propagate immediately.
- Because session cookie cache exists, out-of-band DB updates can show stale session identity until refresh/expiry.
- Account linking currently does not auto-update user info on link (`updateUserInfoOnLink` default false).

## 4) Design Options

## Option A: Reuse `user.name` as Username (No New Column)

Summary:
- Keep schema as-is; redefine semantics of `name` to mean username.
- On new sign-in, force provider mapping:
  - GitHub `name = login`
  - Google `name = generated_username`

Pros:
- Fastest path.
- Smallest migration blast radius.

Cons:
- No separation between username and display name.
- Future identity model changes become harder.
- Existing `name` data quality is mixed and not guaranteed username-safe.
- Harder to annotate auto-generated vs manual states without extra fields.

Risk:
- Medium technical debt risk.

## Option B: Add Dedicated `username` Field (Custom, Lean)

Summary:
- Add `user.username` and keep `user.name` for compatibility.
- Use `username` as canonical public label in UI/API.
- Populate username on signup via provider-specific mapping + normalization/collision logic.
- Update username through Better Auth `update-user` (not custom API patch).

Pros:
- Clear model, low magic, easy future evolution.
- Minimal framework lock-in.
- Can migrate gradually without breaking existing payloads.

Cons:
- Requires multi-surface refactor (`author.name` -> `author.username` or alias strategy).
- Must implement validation + uniqueness policy in app layer.

Risk:
- Low-to-medium, manageable with phased rollout.

## Option C: Use Better Auth Username Plugin (`username` + `displayUsername`)

Summary:
- Adopt Better Auth username plugin and schema fields (`username`, `displayUsername`).
- Use plugin validation and availability endpoint.

Pros:
- Leverages built-in validation and endpoint patterns.
- Standardized internals for username semantics.

Cons:
- Adds two concepts (`username` and `displayUsername`) immediately.
- Plugin behavior is opinionated and adds moving parts.
- Still need provider-specific generation flow for social signups.

Risk:
- Medium (higher complexity than needed for current scope).

## 5) Recommendation

Recommend **Option B (Dedicated `username`, lean custom)**.

Why this is the best fit for "simple and robust":
- Strong data model clarity now.
- Smaller conceptual load than plugin-based dual-username model.
- Good backwards compatibility path (keep `name` temporarily).
- Easy to evolve later into display-name + profile URLs without rework.

## 6) Proposed Design (Option B)

### 6.1 Data Model

Add to `user`:
- `username` (`text`, initially nullable, then not null after backfill)
- Unique index on normalized username (case-insensitive)
  - Recommended: `unique index on lower(username)`

Optional metadata (recommended for UX quality):
- `usernameSource` enum/text: `github`, `google_random`, `migrated`, `manual`

### 6.2 Username Policy

Normalization:
- Lowercase
- Trim
- Allowed chars: `[a-z0-9_]+`
- Collapse/strip invalid separators

Validation:
- Length: 3-30
- Reserved words blocked (`admin`, `mod`, `support`, `settings`, `api`, etc.)
- Case-insensitive uniqueness

Collision strategy:
- If taken, append deterministic or random short suffix (`name_42`, `name_6f9`)
- Retry loop server-side before insert/update succeeds

### 6.3 Provider-Specific Initial Population

GitHub new users:
- Candidate from `profile.login` (not `profile.name`)
- Normalize + uniquify
- Store source as `github`

Google new users:
- Candidate from generator (e.g. `slop_otter_482`)
- Normalize + uniquify
- Store source as `google_random`

Implementation mechanism:
- Configure provider `mapProfileToUser` for raw candidate choice.
- Use Better Auth `databaseHooks.user.create.before` for final normalization + uniqueness enforcement.

### 6.4 Existing Users Migration

Backfill strategy:
- Derive username from current `name` where possible.
- Fallback from email local-part.
- Final fallback to generated random candidate.
- Resolve collisions with suffixing.

Migration phases:
1. Add nullable `username` + index (non-unique or partial while backfilling).
2. Backfill script.
3. Enforce `NOT NULL` + final unique index on normalized username.
4. Deploy read-path updates to prefer username.

### 6.5 API + Session Contract

Short-term compatibility strategy:
- Return both fields in key responses where user identity is rendered:
  - `username` (new canonical field)
  - `name` (legacy compatibility)

Session and profile updates:
- Use Better Auth update flow (`POST /api/auth/update-user`) so updated username is reflected in session cookie immediately.
- Avoid relying on missing `PATCH /api/v1/users/me`.

### 6.6 UI/UX Plan

Primary display:
- Switch UI identity labels to `username`.
- Render as `@username` for clarity (optional but recommended).

Profile settings:
- Replace "Display Name" section with "Username".
- Include:
  - input with live normalization preview
  - validation hints
  - availability feedback
  - clear save success/error states

Pleasant auto-generated rename flow:
- If `usernameSource=google_random`, show a soft prompt after login:
  - "Want a custom username?"
  - actions: `Keep this` / `Change now`
- Keep non-blocking (do not gate app usage).
- Also surface edit affordance in settings permanently.

Linking GitHub after Google signup:
- Optional enhancement: suggest GitHub handle once linked if better than random and available.
- Must be opt-in by user, never forced.

## 7) Rollout Plan

Phase 1:
- Schema + migration/backfill.
- Provider mapping + hook-based generation.

Phase 2:
- Expose `username` in auth/current-user and author payloads.
- Keep `name` for compatibility.

Phase 3:
- Update settings UX and all user-facing labels to username.
- Add auto-generated username nudge flow.

Phase 4:
- Remove legacy `name`-as-identity dependencies where safe.

## 8) Risks and Mitigations

Risk: Username collision races during high-concurrency signup  
Mitigation: DB unique index + retry on conflict.

Risk: Session shows stale identity after update  
Mitigation: Use Better Auth `update-user` endpoint that refreshes session cookie.

Risk: Migration creates low-quality usernames for old users  
Mitigation: deterministic backfill + user-edit prompt in settings.

Risk: Impersonation/confusable names  
Mitigation: reserved list + strict character set + moderation override capability.

## 9) Unanswered Questions

1. Should username be globally immutable after first manual set, or fully editable?
2. If editable, do we want cooldown/rate limits (ex: 1 change per 7 days)?
3. Do we need a username history/audit trail for moderation and abuse handling?
4. Should we display `@username` everywhere, or plain `username` in some contexts?
5. Do we want to preserve `name` as a future "display name", or deprecate it entirely?
6. Do we want a reserved username list in config, DB, or code constants?
7. Should linking GitHub offer "adopt your GitHub handle" as a one-click suggestion?
8. For existing users, should we notify them proactively that username is now public identity?

## 10) Suggested Decision

Proceed with **Option B** and answer questions 1, 2, and 5 before implementation starts, since they affect schema and API stability the most.

