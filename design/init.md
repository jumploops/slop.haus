# slop.haus Design Doc v0.2

**Project:** slop.haus — vibecoded app showcase & rating site
**Doc status:** Updated draft (incorporates decisions from Jan 7, 2026)
**Date:** 2026-01-07

This revision updates the original plan with your concrete choices around **TypeScript + Drizzle**, **auth constraints**, **anonymous-only voting**, **threaded comments**, **edit staging**, **Firecrawl enrichment**, **no NSFW policy**, and the new requirement for **separate “dev score”**.

---

## 1) Updated Requirements and Decisions

### Locked-in decisions

* **Backend:** TypeScript
* **DB/ORM:** Postgres + **Drizzle**
* **Auth:** OAuth only (no email/password for now)

  * **Google and GitHub** allowed for login
  * **GitHub required to submit projects**
  * Users must be able to **link both providers in either order**
* **Voting:** **anonymous votes only**
* **Commenting:** account required (Google or GitHub)
* **Content policy:** “No NSFW” as a platform rule, but we still **classify/tag** content (NSFW/illegal/copyright/etc.) for moderation workflows
* **Submission requirements:** must provide **either live URL or repo URL** (can provide both)

  * Prefer **live URL screenshot** if both exist
  * Otherwise extract **README from repo**
  * Use **Firecrawl** for screenshot/README enrichment ([Firecrawl][1])
* **Edits:** authors can edit live projects; edits must go through a **staging/revision system** and re-trigger moderation; UI shows **last edited**
* **Comments:** threaded (HN-style) from day 1
* **Ranking:** allow downvotes (“slop!”) immediately
* **Scores:** separate **Dev Score** vs **Normal Score**
* **Vibecode metric input:**

  * “Overview vibe%” required unless user chooses multi-metric mode
  * Multi-metric mode disables manual overview and computes a single vibe% from the sub-metrics
* **Moderation flow:** publish immediately *after* an LLM approval step; user flags over threshold (e.g., 3) auto-hide and queue for review
* **Repo analysis:** skip for now
* **Repo/Cloud:** deployable to major clouds (AWS/Cloudflare likely), keep architecture vendor-neutral
* **Anonymous-vote verification:** investigate Cloudflare “anonymous credentials”/Privacy Pass–style options; prefer 3P solutions if feasible (to avoid building fingerprinting + retention ourselves) ([The Cloudflare Blog][2])

---

## 2) Product UX and Information Architecture

### Core pages (unchanged, with updates)

* `/` — Feed (tabs: **Hot | New | Top**) + toggle to view **Normal** vs **Dev** rankings
* `/p/:slug` — Project page

  * Score widget: Normal score + Dev score
  * Vibecode meter
  * Links (live + repo)
  * Media/preview (auto screenshot or README excerpt)
  * Threaded comments
  * “Last edited” timestamp (from public version)
  * If an edit is pending: small badge (“Update pending review”)
* `/submit` — submit form (auth required; must have GitHub linked)
* `/favorites` — favorites (auth required)
* `/settings/connections` — link/unlink OAuth providers (GitHub/Google)
* `/admin` — moderation, queue, user/dev verification tools

### Interaction principles

* **Feed-first**: most users never leave the feed except to open a project
* **Minimal friction to vote** (anonymous), but **higher friction to comment** (auth)
* **Clear trust signals**:

  * “Verified dev” badge on commenters
  * Separate Dev Score
  * Moderation status (only visible to mods/admin; users see “hidden/removed” messaging)

---

## 3) Auth and Account Linking

### Recommended library choice: Better Auth + Drizzle adapter

Better Auth is TypeScript-focused and supports OAuth plus account linking flows. ([GitHub][3])
It has a Drizzle adapter with performance-related join support (enable `experimental.joins`). ([Better Auth][4])

### Requirements we must satisfy

1. A user can sign in with **Google first** and later link **GitHub**, or vice versa.
2. A user can be logged in with either provider, but:

   * **Submitting a project** requires that the user has a linked **GitHub** account.
3. Avoid accidental account merging or takeover while still making linking smooth.

### Proposed flows

#### A) First login (Google or GitHub)

* Create `user` record + `account` record (provider, providerAccountId)
* Store provider email if available (Google is usually reliable; GitHub email may be missing/private)

#### B) Linking the second provider

* Logged-in user clicks “Link GitHub” or “Link Google”
* Use the auth library’s account linking endpoint/function (Better Auth supports linking social providers). ([Better Auth][5])
* This creates an additional `account` row referencing the same `user.id`

#### C) Submission gating

* `POST /projects` checks session user has **GitHub account linked**
* If not linked, return `403` + UI directs user to link GitHub

### Open implementation detail (important)

* **Auto-link by email?**
  Auto-linking Google↔GitHub accounts purely because emails match can be convenient, but can be risky if a provider returns unverified or mutable emails. Recommendation:

  * **Default: no silent merges**
  * Offer an explicit “Link accounts” step from within an authenticated session.

---

## 4) Anonymous Voting System

### What “anonymous votes only” means in practice

* No requirement to log in to vote
* Votes are stored without tying to a user account
* We still need:

  * one-vote-per-entity semantics (or at least strong throttling)
  * bot/abuse controls
  * ability to support a “Dev Score” channel

### Design: abstract “Rater Identity”

Create an internal concept:

* `rater_type`: `public` | `dev`
* `rater_key`: opaque string representing “this anonymous rater” (hashed/signed)
* Uniqueness enforced by `(project_id, rater_type, rater_key)`

This lets us swap implementations later without schema rewrites.

### MVP approach (practical + production-friendly)

**Public votes**

* On first vote action:

  * generate a random UUID
  * store in **HttpOnly cookie** (e.g., `slop_rater`)
  * server stores only a **hashed** representation (HMAC with server secret)
* Enforce:

  * 1 vote per project per `rater_key`
  * edge rate limits (Cloudflare/AWS WAF)
  * optional Turnstile/CAPTCHA on suspicious patterns

**Dev votes**

* Dev votes must be limited to “verified devs,” but still anonymous.
* Approach: “dev credential issuance”

  * verified dev user signs in (Google or GitHub)
  * backend issues a **separate anonymous dev cookie** (e.g., `slop_dev_rater`) that is not stored in a way that maps back to `user.id`
  * now they can cast dev-channel votes anonymously
* This keeps voting anonymous while still gating dev votes.

### Cloudflare anonymous credentials investigation

Cloudflare has published work describing anonymous credentials for privacy-preserving rate limiting and related schemes (Privacy Pass / ACT / ARC). They explicitly describe this as **early** and tied to emerging standards work. ([The Cloudflare Blog][2])
Action item: treat this as **Phase 1 research**; design our internal “Rater Identity” abstraction so we can plug it in later.

---

## 5) Separate Normal Score vs Dev Score

### Data model

Maintain separate counters and ranking pipelines:

* `normal_up`, `normal_down`, `normal_score`
* `dev_up`, `dev_down`, `dev_score`

### Display rules

* Default feed shows Normal score
* Toggle “Dev feed” shows Dev score ranking (and optionally shows Normal in smaller text)
* On project page show both:

  * “People say: +12 / -31 (score -19)”
  * “Devs say: +8 / -2 (score +6)”

### Verified dev definition (initial)

* `user.dev_verified = true` controlled by admins/mods
* Later: add verification heuristics or external proofs (GitHub signals, org membership, etc.)

---

## 6) Projects: Submission, Enrichment, and Media

### Submission requirements

A project must include at least one:

* `main_url` (live site / store link / etc.)
* `repo_url` (GitHub/GitLab/etc.)

### Firecrawl enrichment

Use Firecrawl to:

* Generate a screenshot for `main_url`
* Extract markdown/summary for repo page or README fallback
  Firecrawl’s `/scrape` endpoint supports returning markdown and screenshots as formats, with screenshot options and caching defaults. ([Firecrawl][1])

### Enrichment preference logic

* If `main_url` exists:

  * create `ProjectMedia` screenshot job for `main_url`
* Else if only `repo_url`:

  * create README extraction job (and optionally repo page screenshot)

### Recommended processing pattern (robust + fast UX)

* Submission API is fast and returns immediately after synchronous moderation.
* Enrichment runs async:

  * background worker calls Firecrawl
  * stores screenshot/markdown
  * updates project preview fields
  * triggers a second moderation pass on extracted content

This avoids Firecrawl latency making your main submit endpoint slow.

---

## 7) Edit Staging and Re-moderation

### Requirement

Edits must not instantly overwrite live content until moderated; but we also want edits to feel fast.

### Proposed model: “Project Revision”

* `projects` table holds the **current public version**
* `project_revisions` holds proposed changes

  * status: `pending` | `approved` | `rejected`
  * includes only the fields that are editable (or a full snapshot)
* “Approve” can be automated (LLM pass) or manual (moderator)

### Edit flow

1. Author submits changes → create `project_revision` record
2. Run synchronous LLM moderation on the diff (or new fields)
3. If approved:

   * apply changes to `projects`
   * mark revision approved
   * update `projects.last_edited_at`
4. If flagged:

   * keep old `projects` content live
   * revision stays pending and goes into mod queue
   * UI shows “Update pending review”

---

## 8) Threaded Comments (HN-style)

### Requirements

* Threaded from day 1
* Account required (Google or GitHub)
* Lightweight traversal

### Schema approach

Adjacency list + optional materialized path:

* `comments`

  * `id`
  * `project_id`
  * `author_user_id`
  * `parent_comment_id` (nullable)
  * `depth`
  * `body`
  * `status`
  * `created_at`, `updated_at`

For efficient ordering and retrieval:

* MVP: recursive CTE to fetch a thread
* Phase 1 performance: add a **materialized path** (or Postgres `ltree`) and fetch ordered by path

### Display rules

* Default order: top-level by `created_at` (or later by “comment score” if you add comment voting)
* Children by `created_at`
* “Verified dev” badge on author
* Optional: “Dev comments first” toggle (later)

---

## 9) Vibecode Metrics Input and Computation

### Input modes

**Mode A: Overview slider (required)**

* `vibe_overview_percent` stored directly

**Mode B: Multi-metric (optional)**
User selects “Use detailed metrics” → disables overview slider.
User fills:

* AI proportion
* Human review depth
* Human modifications
* Time-to-build
* Polish level
  …and the UI computes a single `vibe_percent`.

### Storage model

Store both:

* `vibe_mode`: `overview` | `detailed`
* `vibe_percent`: computed final value (always present)
* If detailed:

  * store detailed metrics in `vibe_details_json` (or normalized table later)

This makes feed sorting/filtering easy (always use `vibe_percent`), while preserving raw data.

---

## 10) Moderation, Flagging, and Policy Enforcement

### Platform rule

* NSFW is not allowed, but we still classify and tag content as NSFW/illegal/copyright/etc. for enforcement and audit trails.

### Two-stage moderation

**Stage 1 (sync, required for immediate publish)**

* On submit/edit:

  * run LLM prompt moderation on:

    * title/tagline/description
    * URLs
    * tool tags
    * vibecode text fields
* If approved → publish (or apply edit)
* If flagged → hold revision / move to queue

**Stage 2 (async, enrichment-based)**

* After Firecrawl enrichment:

  * run moderation on extracted README/summary/screenshot metadata
  * if it now looks NSFW/illegal/etc. → auto-hide + queue

### User flagging

* `flags` table with unique constraint to prevent spam flagging:

  * `(target_type, target_id, user_id)` unique
* When flags >= threshold (e.g., 3 distinct users):

  * auto-hide content
  * create mod queue item

Recommendation: require auth for flagging (otherwise flagging becomes a griefing vector).

---

## 11) Architecture and Repo Layout

### Monorepo (pnpm)

Suggested structure:

* `apps/web` — Next.js frontend
* `apps/api` — TS API server (Fastify/Hono/Express; pick one)
* `packages/db` — Drizzle schema + migrations
* `packages/shared` — shared types, Zod schemas, utilities
* `packages/ui` (optional) — shared UI components

### Vendor-neutral deployment

* API and Web can run:

  * on containers (ECS/Fargate, Kubernetes, Fly, etc.)
  * on serverless (AWS Lambda, Cloudflare Workers) if frameworks allow
* Keep storage + queue abstracted:

  * Object storage S3-compatible interface
  * Queue interface implemented by:

    * Postgres job table (MVP)
    * SQS/Redis later

---

## 12) Data Model (Updated)

Key tables (delta-focused):

### Auth (Better Auth + Drizzle)

* `users` (extend with fields: `role`, `dev_verified`, etc.)
* `accounts` (OAuth providers)
* `sessions` (if using session strategy)
  Better Auth supports OAuth + linking and Drizzle adapter. ([Better Auth][5])

### Projects

* `projects`

  * public canonical fields
  * denormalized counts:

    * `normal_up`, `normal_down`, `normal_score`
    * `dev_up`, `dev_down`, `dev_score`
  * `last_edited_at`
  * `status`: published | hidden | removed
* `project_revisions`

  * proposed edits + moderation status
* `project_media`

  * screenshots, videos later
  * `source`: `firecrawl` | `user_upload`
* `project_tools` + `tools`

### Votes (anonymous)

* `project_votes`

  * `project_id`
  * `rater_type`: public | dev
  * `rater_key_hash`
  * `value`: +1 / -1
  * unique `(project_id, rater_type, rater_key_hash)`

### Comments

* `comments` threaded (parent_id, depth, etc.)

### Moderation

* `moderation_events`

  * target type/id, model output, labels, decision, timestamps
* `flags`

  * target type/id, flagger user_id, reason, created_at

---

## 13) API Surface (Updated)

### Public

* `GET /api/v1/projects?sort=hot|new|top&channel=normal|dev&window=24h|7d|30d|all`
* `GET /api/v1/projects/:slug`
* `GET /api/v1/projects/:slug/comments`

### Anonymous votes

* `POST /api/v1/projects/:slug/vote`

  * `{ channel: "normal"|"dev", value: 1|-1|0 }`
  * server uses rater cookie/token to dedupe

### Auth-required

* `POST /api/v1/projects` (GitHub-linked session required)
* `PATCH /api/v1/projects/:slug` (creates revision)
* `POST /api/v1/projects/:slug/comments`
* `POST /api/v1/projects/:slug/favorite`
* `GET /api/v1/me/favorites`
* `POST /api/v1/flags` (flag content)

### Connections

* `POST /api/v1/auth/link/github`
* `POST /api/v1/auth/link/google`

### Admin/mod

* `GET /api/v1/admin/mod-queue`
* `POST /api/v1/admin/revisions/:id/approve|reject`
* `POST /api/v1/admin/projects/:id/hide|remove`
* `POST /api/v1/admin/users/:id/dev-verify`

---

## 14) Ranking and Performance Plan

### Ranking

* Implement hot/new/top per channel
* Store denormalized counts for fast feed queries
* Compute hot score on read (or precompute periodically)

### Caching path

* MVP: DB + indexes + denormalized counters
* Phase 1:

  * Cache top feed pages (edge cache / CDN)
  * Cache computed hot lists in Redis
  * Async recomputation workers

### Background jobs (MVP minimal)

Use Postgres `jobs` table + worker process for:

* Firecrawl enrichment
* async moderation
* screenshot storage/processing

---

## 15) Security and Abuse

### Anonymous vote abuse controls

* Edge rate limiting on vote endpoints
* Cookie-based rater IDs (hashed server-side)
* “Suspicion triggers”:

  * too many votes / minute from same IP ASN
  * repeated toggles
  * unusual project-targeting patterns
* Optional CAPTCHA gate for suspicious traffic

### Submission safety controls

* GitHub-required submission is a strong baseline
* Submit rate limits per account
* Immediate publish only if Stage-1 LLM approves; otherwise hold

---

## 16) Remaining Open Questions

These are the main “decide soon” items that affect implementation details:

1. **Dev Score channel + anonymous-only voting:**
   Are we OK with “dev voting credential issuance” (anonymous cookie minted after verified login), or do you want true third-party anonymous credentials before dev channel ships?

2. **Cloudflare anonymous credentials availability:**
   Cloudflare’s published work frames anonymous credentials as early-stage and standards-in-progress. ([The Cloudflare Blog][2])
   Do we want to:

   * ship MVP with cookie-based anonymity + WAF protections, and
   * treat Cloudflare AC as Phase 1/2 enhancement?

3. **Flag threshold policy details:**

   * Threshold = 3 flags total? 3 unique users? weighted by dev-verified?
   * Do flags instantly hide or “soft-hide pending review”?

4. **What content is “blocked vs review”?**
   For example:

   * NSFW → always hide
   * Illegal → always hide + escalate
   * Copyright → queue (might be false positives)

5. **Comment ordering:**
   HN-style typically sorts by thread/time; do we want any scoring/voting on comments eventually?

---

## 17) Updated MVP Cutline

If we want to ship fast while matching your constraints:

* OAuth login (Google + GitHub) via Better Auth + Drizzle adapter ([Better Auth][4])
* Link providers (Google↔GitHub) supported ([Better Auth][5])
* GitHub-linked required for `/submit`
* Anonymous voting with cookie-based rater identity
* Two vote channels: normal + dev (dev gated by dev credential issuance)
* Threaded comments (auth required)
* Revisions system for edits (staged)
* Firecrawl enrichment async (screenshot or README) ([Firecrawl][1])
* Two-stage moderation + flags auto-hide

[1]: https://docs.firecrawl.dev/api-reference/endpoint/scrape "Scrape - Firecrawl Docs"
[2]: https://blog.cloudflare.com/private-rate-limiting/ "Anonymous credentials: rate-limiting bots and agents without compromising privacy"
[3]: https://github.com/better-auth/better-auth "GitHub - better-auth/better-auth: The most comprehensive authentication framework for TypeScript"
[4]: https://www.better-auth.com/docs/adapters/drizzle?utm_source=chatgpt.com "Drizzle ORM Adapter - Better Auth"
[5]: https://www.better-auth.com/docs/concepts/oauth?utm_source=chatgpt.com "OAuth | Better Auth"

