# Policy + ToS Source of Truth (Codebase Audit)

Generated: 2026-02-26  
Repository: `slop.haus`  
Method: static code/config review (app/web/worker/db + deployment config), no cloud console access.

## Purpose
Create a single engineering-backed source document for drafting:
- Privacy Policy
- Terms of Service

This document answers the questionnaire with confirmed code evidence, calls out unknowns, and defines the concrete artifact package legal/product can use.

## Executive Summary
- Product is a public project showcase and rating platform with optional anonymous browsing, authenticated posting, comments/reviews, likes, favorites, moderation, and admin workflows.
- OAuth providers in code are GitHub and Google, with account linking enabled.
- OAuth tokens (access/refresh/id tokens) are stored in the `account` table; no app-level encryption at rest is visible in code.
- Core personal data collected includes email, username, avatar, OAuth account IDs/tokens/scopes, session token/IP/user-agent, user-generated content, moderation/flag records, and analytics/pageview data when GA is enabled.
- Background automation is first-party worker automation (scrape/analyze/moderate/cleanup jobs), not user-owned API agents.
- Several policy-critical items are missing or need product decisions: account deletion workflow, explicit retention schedule for logs/backups/object storage, consent handling for analytics, and legal request/DMCA process.

## 0) Product Functionality Snapshot
Current functionality evidenced in code:
- Anonymous session bootstrap on web load (`EnsureAnonymous`) for read/browse and cookie-based rating identity.
- Authenticated features for registered users: submit project, edit/delete project, comment/review, vote on comments, favorite, report content, manage linked OAuth accounts.
- Public project feed, project detail pages, public comments, public tools list, and visitor counter.
- Moderation pipeline:
  - synchronous moderation on submit/edit (Anthropic)
  - async moderation jobs after enrichment
  - user flagging + admin/mod queue/actions
- URL enrichment pipeline:
  - Firecrawl scrape/screenshot
  - Anthropic extraction of title/tagline/description/tools/URLs/vibe
  - optional screenshot upload to storage
- Admin/mod operations for hide/remove/approve content and revision review.

---

## 1) OAuth and Identity

### Confirmed
- Supported social OAuth providers: `google`, `github` (`apps/api/src/lib/auth.ts`).
- Account linking is enabled, with explicit linking flow and no trusted auto-merge providers (`apps/api/src/lib/auth.ts`).
- Anonymous auth plugin is enabled (`emailDomainName: "anon.slop.haus"`) (`apps/api/src/lib/auth.ts`).
- Session model is server-side session table + auth cookies (Better Auth + DB tables).

### Scopes requested in code
No custom scopes are configured in app auth config. Better Auth defaults apply unless overridden:
- Google default scopes: `email`, `profile`, `openid` (Better Auth core provider defaults).
- GitHub default scopes: `read:user`, `user:email` (Better Auth core provider defaults).

Evidence:
- `apps/api/src/lib/auth.ts` has no `scope` override for either provider.
- Better Auth core provider defaults in installed package (`node_modules/.pnpm/@better-auth+core.../dist/social-providers/index.mjs`).

### Token storage and usage
- OAuth token fields exist in DB `account` table:
  - `accessToken`, `refreshToken`, `idToken`, `scope`, expiry fields
  - file: `packages/db/src/schema/users.ts`
- Session table stores:
  - `token`, `ipAddress`, `userAgent`, `expiresAt`
  - file: `packages/db/src/schema/users.ts`
- Post-auth API usage:
  - Better Auth GitHub provider fetches `/user` and `/user/emails`.
  - App endpoint `/api/v1/auth/github/repos` fetches `/user/repos` with bearer token.
  - No explicit Google API calls beyond OAuth flow/userinfo.

### Account linking / public display
- Link/unlink supported via web settings and API routes.
- OAuth-derived user fields (username/avatar) are shown publicly on projects/comments.
- Email is shown to the logged-in user in profile; also exposed in admin/mod contexts.

### Unknowns / follow-up required
- OAuth consent screen configuration in provider dashboards (exact published scopes, callback URLs, branding) is external and not versioned in repo.
- Provider token revocation on unlink/delete is not visible; unlink deletes local account row only.

---

## 2) Data Inventory (Collected/Stored Data)

### Database inventory (authoritative schema)

| Table | Data categories | Personal/sensitive potential |
|---|---|---|
| `user` | id, username, name, email, image, role, devVerified, isAnonymous, timestamps | Direct identifiers (email), profile data |
| `session` | token, userId, expiresAt, ipAddress, userAgent, timestamps | Session credential + device/network metadata |
| `account` | provider/account IDs, access/refresh/id tokens, scope, expiry | OAuth credentials and account linkage |
| `projects` | authorUserId, title/tagline/description, URLs, scoring, status | User-generated/public content; author linkage |
| `project_media` | projectId, media URL, source | User-uploaded or scraped media URLs |
| `project_revisions` | changed fields, pending edits, reviewer linkage | Moderation history and authored edits |
| `tools` / `project_tools` | tags, creator linkage | Limited personal linkage via `createdByUserId` |
| `comments` | body, authorUserId, reviewScore, status | Public UGC tied to user identity |
| `project_likes` | userId (nullable), raterType, raterKeyHash | Behavioral activity, pseudonymous hash |
| `comment_votes` | userId, commentId | Behavioral activity |
| `favorites` | userId, projectId | Behavioral activity |
| `flags` | reporter userId, target, reason | Moderation/reporting activity |
| `moderation_events` | labels/confidence/decision/reason | Automated moderation traces |
| `enrichment_drafts` | input URL, scraped content/metadata, LLM outputs, final edits, status/error | Can contain user-provided and scraped third-party content |
| `jobs` | type, payload, attempts, error | Operational telemetry; may include IDs/URLs/content excerpts |
| `rate_limits` | key, window, count | Keys may embed user IDs or hashed rater keys |
| `locks` | holder, key, expiry | Operational metadata |
| `site_counters` | visitor count | Aggregate metric |

### User-submitted content
- Project metadata: title, tagline, description, links, vibe scores, tags.
- Screenshot uploads.
- Comments/reviews, review score (0-10), flags/reports.

### Automatically collected/derived data
- Session IP address + user agent (session table).
- Auth/session cookies and rater cookies.
- Rate-limit keys/counters.
- Server/application logs via middleware + console logging.
- Google Analytics pageview path/query if GA enabled.

### Not observed in code
- Geolocation lookup from IP.
- Device fingerprinting SDK.
- Ad targeting/retargeting pixels.

---

## 3) Public vs Private Visibility

### Public by default
- Project feed endpoint returns only `published` projects.
- Public project page renders author username/avatar/dev badge.
- Public comments endpoint returns author username/avatar/dev badge and comment body.
- Public endpoints include:
  - `/api/v1/projects`
  - `/api/v1/projects/:slug`
  - `/api/v1/projects/:slug/comments`
  - `/api/v1/projects/:slug/like` and `/like-state`
  - `/api/v1/tools`
  - `/api/v1/sitemap/projects`
  - `/api/v1/visitor-count`

### Private/restricted
- Email is not returned on public project/comment APIs.
- User favorites/projects are authenticated-only.
- Admin/mod routes are role-gated and include additional data (including emails in queue/dev lists).

### Important implementation findings
- `GET /api/v1/projects/:slug` does not filter by `projects.status`.
  - Web page blocks non-published statuses client-side (`notFound()` if status != published), but API still returns record by slug.
- `GET /api/v1/projects/:slug/comments` returns all comment statuses for the project.
  - Only `removed` body is replaced with `[removed]`; `hidden` bodies are not redacted in API response.

### User controls currently visible
- Can edit username.
- Can unlink provider if another provider remains linked.
- Can delete own comments/projects (status changes, not hard purge).
- No explicit account deletion UI/API observed.
- No profile visibility toggle or rating-history privacy control observed.

---

## 4) Agents and Automation

### What exists
- First-party server automation only (worker jobs):
  - `scrape_url`, `analyze_content`, `scrape_screenshot`, `enrich_screenshot`, `enrich_readme`, `moderate_async`, `cleanup_drafts`.
- No user-issued API keys or personal access tokens found.
- Auth for user actions is session-based (or rater cookies for like identity).

### Abuse/anti-manipulation controls
- Postgres-backed rate limiting for likes, comment votes, draft analysis.
- URL safety validation blocks localhost/private IP/shorteners.
- User flagging with auto-hide threshold and mod queue.
- No explicit bot attribution field ("posted by agent") on content records.

---

## 5) Third Parties and Subprocessors (Code-Inferred)

| Vendor/service | Purpose | Data sent/processed (from code behavior) |
|---|---|---|
| Google OAuth | Sign-in/account linking | OAuth identifiers, profile/email scopes, tokens |
| GitHub OAuth + API | Sign-in/account linking + repo picker | Profile/email from OAuth; public repo metadata from `/user/repos` |
| Anthropic API | Moderation + content extraction | Submitted/scraped text content, prompts, model outputs |
| Firecrawl API | URL scrape and screenshot capture | User-submitted URLs, scraped content/metadata, screenshot URL retrieval |
| Google Analytics (optional) | Web analytics | Page path/query pageview events when enabled |
| AWS S3 (or compatible) | Media object storage | Uploaded/scraped screenshot binaries and keys |
| Render | Hosting/runtime env management | App/service operational data (details external) |
| PostgreSQL | Primary data store | Full application dataset |

Not found in code/deps: Stripe, Sentry, PostHog/Mixpanel/Segment, Intercom/Zendesk, reCAPTCHA/hCaptcha.

---

## 6) Security Controls and Incident Handling (Observed)

### Controls present in code/config
- API middleware includes:
  - request logger
  - CORS with credentials and allowed origin from `APP_URL`
  - `secureHeaders()` on `/api/*`
- Auth/session secret required (`AUTH_SECRET`).
- Environment variables used for credentials/secrets (not hardcoded in source).
- Remote DB migration config defaults to TLS (`sslmode=require`) when host is non-local.
- Basic file upload type/size validation for project screenshots.

### Security gaps/unknowns
- OAuth tokens appear stored as plaintext columns at app level (no field-level encryption in code).
- No documented incident response/breach-notification procedure in repo.
- No explicit dependency/SAST/container scanning workflow found in repo.
- No repository evidence for production IAM policy details, DB access controls, backup encryption, or log redaction policy.

---

## 7) Retention and Deletion

### Behavior confirmed in code
- Drafts:
  - expire after 24h (`expiresAt` set at creation)
  - hourly cleanup soft-deletes expired drafts (`deletedAt`)
  - stale drafts (>5 min in pending/scraping/analyzing) marked failed
- Projects/comments:
  - soft moderation/deletion via `status` (`published|hidden|removed`, `visible|hidden|removed`)
- Draft discard endpoint sets `deletedAt`.
- Rate-limit rows have best-effort cleanup of old windows (1% chance on request).
- Lock rows have best-effort cleanup of expired locks (1% chance on lock acquire).

### Missing for policy alignment
- No explicit account deletion workflow/API identified.
- No documented retention TTLs for:
  - sessions/accounts/tokens
  - logs
  - backups
  - object storage
- No documented backup purge timeline.
- No evidence of automated object deletion when projects/media are removed.

---

## 8) Moderation, Reporting, and Legal Requests

### Moderation/reporting implemented
- Automated moderation labels and confidence scoring stored in `moderation_events`.
- User reporting via `flags` table with reasons.
- Auto-hide threshold for flagged content (>=3 flags).
- Mod/admin endpoints to approve/hide/remove projects/comments and review revisions.

### Gaps
- No DMCA/copyright takedown intake workflow in repo docs/routes.
- No explicit legal request/subpoena handling workflow documented.
- Comment creation does not appear to run automatic moderation at creation time (relies on flags/mod actions).

---

## 9) Cookies and Tracking

### Cookie/local storage inventory

| Name | Type | Purpose | Lifetime/flags |
|---|---|---|---|
| `better-auth.session_token` (or `__Secure-better-auth.session_token`) | Cookie | Auth session token | Better Auth default session cookie; HttpOnly, SameSite=Lax, secure on HTTPS/prod |
| `better-auth.session_data` (or secure variant) | Cookie | Session cache payload | MaxAge from cookie cache config (5 min in app), HttpOnly/Lax/secure on HTTPS/prod |
| `better-auth.dont_remember` | Cookie | Remember-me semantics (library-managed) | HttpOnly/Lax/secure on HTTPS/prod |
| `slop_rater` | Cookie | Public rater identity seed for likes | 400 days, HttpOnly, SameSite=Lax, secure in production |
| `slop_dev_rater` | Cookie | Dev rater credential seed for likes | 400 days, HttpOnly, SameSite=Lax, secure in production |
| `slop:mode` | localStorage | UI mode preference | persistent localStorage |
| `slop:feedIntroDismissed` | localStorage | Feed intro UI dismissal | persistent localStorage |
| `slop:feedDisplayMode` | localStorage | Feed display preference | persistent localStorage |

### Analytics/tracking behavior
- GA4 tag loads only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
- Current instrumentation sends pageview events (`page_path`).
- No consent banner implementation observed.
- No advertising pixel/retargeting SDK observed.

---

## 10) Product Commitments/Decisions Needed (Non-Code)
These are required before finalizing legal docs and are not fully answerable from code alone:
- Whether paid plans/payments/affiliate/tips will be introduced.
- Whether outbound emails/newsletters will be sent.
- Whether third-party API access will be offered.
- Whether mobile apps are planned.
- Whether additional LLM features will process user content with third-party model vendors.
- Final public legal URLs and placement (homepage/footer + OAuth client config).

---

## Artifact Package for Legal Drafting

Use this as the concrete deliverable set requested from engineering.

### A) Current-state deliverables (mostly complete from this audit)
1. **DB schema + PII classification matrix**
   - Source: `packages/db/src/schema/*.ts`
   - Output: table list, fields, PII category, purpose, retention owner.
2. **OAuth scope and token-handling matrix (Google + GitHub)**
   - Include scopes, API calls, token storage, unlink/delete behavior.
3. **Cookie and client-storage inventory**
   - Include name, purpose, scope, expiry, flags, source file.
4. **Vendor/subprocessor map**
   - Include each vendor, purpose, exact data categories sent.
5. **Public/private visibility matrix**
   - By endpoint + field-level exposure + auth requirements.
6. **Moderation and abuse-control summary**
   - Auto moderation, rate limits, flagging, admin actions.

### B) Infra/ops deliverables still needed for policy-grade accuracy
1. **Logging map + retention**
   - App logs, platform logs, DB logs, object access logs.
   - Retention durations and redaction practices.
2. **Backup and disaster-recovery retention policy**
   - What is backed up, encryption, restore process, purge timeline.
3. **Access control matrix**
   - Who can access prod DB/logs/storage; least-privilege evidence.
4. **Incident response and legal request runbooks**
   - Security incident response and user notification process.
   - Legal request/DMCA handling process.

### C) Product/legal decision artifacts
1. **User deletion policy spec**
   - Hard delete vs soft delete per data class.
   - Backup lag statement for full purge.
2. **Content license and moderation rights policy decisions**
   - ToS language inputs for user content rights and enforcement.
3. **Analytics consent decision**
   - Whether consent gating is required by target jurisdictions.

---

## Google OAuth-Specific Compliance Checklist (Engineering Inputs)
- Publish Privacy Policy URL on verified domain and configure same URL in OAuth client settings.
- Ensure policy text explicitly describes:
  - Google data accessed (identity/profile/email)
  - how used, stored, shared, deleted
- Confirm minimum scopes only (`openid`, `email`, `profile`) unless product scope changes.
- If additional sensitive/restricted scopes are introduced, plan for verification/security assessment before launch.

---

## High-Priority Gaps to Resolve Before Publishing Legal Docs
1. **Token storage at rest**: clarify/implement encryption posture for OAuth tokens.
2. **Deletion commitments**: define and implement account/data deletion workflow and retention timelines.
3. **Visibility consistency**: decide whether hidden/removed content should be API-accessible by slug and adjust code/policy accordingly.
4. **Comment visibility moderation**: confirm intended treatment of `hidden` comments in public API.
5. **Logging/backup retention**: document enforceable retention periods and legal response procedures.
6. **Consent model**: decide if/where analytics consent is required and implement if needed.

---

## Primary Evidence Paths
- Auth/OAuth/session: `apps/api/src/lib/auth.ts`, `apps/api/src/middleware/auth.ts`, `apps/api/src/routes/auth.ts`
- DB schema: `packages/db/src/schema/*`
- Public/private routes: `apps/api/src/routes/*.ts`, `apps/web/src/app/p/[slug]/page.tsx`
- Moderation/abuse: `apps/api/src/lib/moderation.ts`, `apps/api/src/routes/flags.ts`, `apps/api/src/routes/admin.ts`, `apps/api/src/lib/rateLimit.ts`
- Worker automation: `apps/worker/src/handlers/*`, `apps/worker/src/lib/firecrawl.ts`
- Analytics/tracking: `apps/web/src/components/analytics/GoogleAnalytics.tsx`, `apps/web/src/lib/analytics/gtag.ts`, `apps/web/src/lib/slop-mode.tsx`, `apps/web/src/app/page.tsx`
- Infra/env: `.env.example`, `render.yaml`, `packages/db/drizzle.config.ts`

