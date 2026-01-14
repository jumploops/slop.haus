# Progress Log

## URL-First Onboarding Feature

**Status:** Complete (All 8 Phases)
**Last Updated:** 2026-01-12

### Overview

Implemented a streamlined project submission flow where users enter a URL and the system automatically extracts project metadata using Firecrawl + Claude Haiku.

**User Flow:**
1. User enters a URL (GitHub, live site, npm, etc.)
2. System scrapes the page and extracts metadata via LLM
3. User reviews/edits auto-populated fields
4. User submits the finalized project

---

### Phase 1: Database & Types ✅

- Created `enrichment_drafts` table with soft delete support (`deletedAt`)
- Added draft status enum: `pending`, `scraping`, `analyzing`, `ready`, `failed`
- Created shared TypeScript types for drafts
- Added new job types: `scrape_url`, `analyze_content`

**Files:**
- `packages/db/src/schema/enrichment-drafts.ts`
- `packages/shared/src/draft-types.ts`

---

### Phase 2: URL Scraping ✅

- URL type detection (GitHub, GitLab, npm, PyPI, Chrome Web Store, Steam, live sites)
- URL validation with SSRF protection (blocks private IPs, internal URLs)
- Firecrawl integration with URL-type-specific configs
- Screenshot capture and storage

**Files:**
- `packages/shared/src/url-detection.ts`
- `apps/worker/src/lib/firecrawl.ts`
- `apps/worker/src/lib/scrape-configs.ts`
- `apps/worker/src/handlers/scrape-url.ts`

---

### Phase 3: LLM Analysis ✅

- Claude 3.5 Haiku integration for field extraction
- Structured prompt building based on URL type
- JSON response parsing with validation
- Tool matching against database (with aliases)

**Files:**
- `apps/worker/src/lib/extraction-prompt.ts`
- `apps/worker/src/lib/tool-matching.ts`
- `apps/worker/src/handlers/analyze-content.ts`

---

### Phase 4: Draft API ✅

- REST endpoints for draft CRUD operations
- In-memory rate limiting (5 analyses/hour per user)
- Soft delete support (all queries filter `deletedAt IS NULL`)

**Endpoints:**
- `GET /api/v1/drafts` - List user's drafts
- `POST /api/v1/drafts/analyze` - Start URL analysis
- `GET /api/v1/drafts/:id` - Get draft details
- `PATCH /api/v1/drafts/:id` - Update draft fields
- `POST /api/v1/drafts/:id/submit` - Submit as project
- `DELETE /api/v1/drafts/:id` - Soft delete (discard)

**Files:**
- `apps/api/src/routes/drafts.ts`
- `packages/shared/src/schemas.ts` (validation schemas)

---

### Phase 5: Real-time Progress ✅

- Server-Sent Events (SSE) for live status updates
- Client-side hook for consuming SSE stream
- Events: `status`, `progress`, `complete`, `error`, `heartbeat`

**Files:**
- `apps/api/src/routes/drafts.ts` (SSE endpoint)
- `apps/web/src/hooks/useDraftProgress.ts`

---

### Phase 6: Frontend Input ✅

- URL input component with validation
- Analysis progress UI with step indicators
- Integration with SSE for real-time updates

**Files:**
- `apps/web/src/components/submit/UrlInput.tsx`
- `apps/web/src/components/submit/AnalysisProgress.tsx`
- `apps/web/src/app/submit/page.tsx`
- `apps/web/src/lib/api/drafts.ts`

---

### Phase 7: Frontend Review ✅

- Draft review page with editable fields
- Auto-save on blur for each field
- Screenshot preview component
- Tag editor with autocomplete
- Vibe score input (overview/detailed modes)

**Files:**
- `apps/web/src/app/submit/draft/[draftId]/page.tsx`
- `apps/web/src/components/submit/DraftReview.tsx`
- `apps/web/src/components/submit/ScreenshotPreview.tsx`
- `apps/web/src/components/submit/TagEditor.tsx`

---

### Phase 8: Polish & Production Readiness ✅

- **Draft cleanup job**: Soft-deletes expired drafts (24h), marks stale drafts as failed (5min stuck)
- **Scheduled cleanup**: Runs hourly + on worker startup
- **Error utilities**: User-friendly error messages with recovery suggestions
- **AnalysisError component**: Shows errors with retry/manual entry options
- **Retry logic**: Categorizes errors as retryable vs permanent
- **Security headers**: Added Hono `secureHeaders()` middleware for API routes

**Files:**
- `apps/worker/src/handlers/cleanup-drafts.ts`
- `apps/web/src/lib/errors.ts`
- `apps/web/src/components/submit/AnalysisError.tsx`
- `apps/api/src/index.ts` (security headers)

---

### Bug Fixes

#### Cross-Origin Image Loading
- **Issue:** Screenshots blocked with `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`
- **Cause:** `secureHeaders()` set `Cross-Origin-Resource-Policy: same-origin`
- **Fix:** Applied `secureHeaders()` only to `/api/*` routes, not `/uploads/*`

#### Missing CSS Variables
- **Issue:** Form elements had no spacing (bunched together)
- **Cause:** CSS used `var(--spacing-6)` etc. but variables were never defined in `:root`
- **Fix:** Added spacing scale (`--spacing-1` through `--spacing-8`), border radius, and color aliases to `:root`

#### Unstyled Form Fields
- **Issue:** Inputs on draft review page had no styling
- **Cause:** `.form-field` class used in JSX but never defined in CSS
- **Fix:** Added `.form-field` styles for labels, inputs, textareas, focus states

**Debug docs:**
- `debug/url-input-spacing-issue.md`
- `debug/draft-review-input-styling.md`

---

### Manual Entry Fallback

The original form-based submission is preserved at `/submit/manual` as a fallback when URL analysis fails.

---

### Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM | Claude 3.5 Haiku | Cost-efficient (~$0.25/1M tokens) |
| Real-time updates | SSE | Simpler than WebSockets for one-way updates |
| Draft storage | Temporary table | 24h expiry, soft delete |
| Rate limiting | In-memory | Sufficient for MVP, Redis noted in TODO |
| API client | Native fetch | Consistent with existing patterns |

---

### Environment Variables

```bash
# Required for URL-first onboarding
FIRECRAWL_API_KEY=...
ANTHROPIC_API_KEY=...
DATABASE_URL=...
STORAGE_LOCAL_PATH=/absolute/path/to/uploads
STORAGE_PUBLIC_URL=http://localhost:3001/uploads
```

---

### Testing Status

- [x] Manual testing of full flow
- [ ] Unit tests for URL detection
- [ ] Unit tests for LLM response parsing
- [ ] Integration tests for draft → project flow
- [ ] E2E tests for browser submission journey

---

## Editable Project Preview Feature

**Status:** Phase 1 Complete
**Last Updated:** 2026-01-13
**Plan Docs:** `plan/editable-project-preview/`

### Overview

Transformed the draft review page (`/submit/draft/[draftId]`) from a form-based layout into a WYSIWYG editable preview that mirrors the published project page. Users see exactly how their project will appear and click elements to edit them inline.

### Phase 1: Core Preview & Inline Editing ✅

- Created `EditableProjectPreview.tsx` - mirrors `ProjectDetails` layout
- Created `InlineEditText.tsx` - inline editing for title/tagline
- Created `InlineEditTextarea.tsx` - inline textarea editing for description
- Added CSS styles for editable fields, hover states, edit mode indicators
- Integrated existing `TagEditor` and `VibeInput` components

**Files:**
- `apps/web/src/components/submit/EditableProjectPreview.tsx`
- `apps/web/src/components/submit/InlineEditText.tsx`
- `apps/web/src/components/submit/InlineEditTextarea.tsx`
- `apps/web/src/app/globals.css` (added preview styles)

### Remaining Phases

| Phase | Name | Status |
|-------|------|--------|
| 2 | Complex Editors (popovers, URL modals) | Not Started |
| 3 | Media (screenshot replacement) | Not Started |
| 4 | Polish & Accessibility | Not Started |

---

## Bug Fixes (2026-01-13)

### GitHub/GitLab Projects Missing Screenshots

**Issue:** When a GitHub/GitLab URL is submitted, the project ends up with no screenshot even though the LLM extracts a valid `mainUrl` (live website) from the README.

**Root Cause:**
1. GitHub/GitLab scrape configs only request markdown, not screenshots (intentional for repo pages)
2. After LLM extracts `mainUrl`, no follow-up scrape was triggered to capture screenshot from the live site
3. During submission, `draft.screenshotUrl` was never inserted into `projectMedia` table

**Fix:**
1. Created new `scrape_screenshot` job handler - lightweight handler for screenshot-only capture
2. Updated `analyze_content` to queue `scrape_screenshot` job when GitHub/GitLab URL has mainUrl
3. Updated submission handler to insert `draft.screenshotUrl` into `projectMedia` table

**Files:**
- `apps/worker/src/handlers/scrape-screenshot.ts` (NEW)
- `apps/worker/src/handlers/analyze-content.ts` (modified)
- `apps/worker/src/handlers/index.ts` (registered new handler)
- `apps/api/src/routes/drafts.ts` (insert screenshot into projectMedia)

---

## User Project Editing Feature

**Status:** Complete (All 4 Phases)
**Last Updated:** 2026-01-14
**Spec Doc:** `plan/user-project-editing.md`

### Overview

Enable users to edit and delete their own published projects. The backend API already existed with full moderation integration - Phase 1 focused on the frontend UI.

**Edit Flow:**
1. Author sees "Edit" button on their project page
2. Click navigates to `/p/[slug]/edit`
3. Inline editing for title, tagline, description, tools, vibe, URLs
4. Changes auto-save on blur via `PATCH /api/v1/projects/:slug`
5. Moderation runs on each edit - approved instantly or held for review
6. Delete button opens confirmation modal, soft-deletes project

### Phase 1: Core Editing ✅

- Edit page route with auth check (`/p/[slug]/edit`)
- EditableProject component (reuses InlineEditText, InlineEditTextarea, TagEditor, VibeInput)
- Edit button on ProjectDetails (author only)
- Delete confirmation modal
- CSS styles for edit header, danger buttons, modal

**Files Created:**
- `apps/web/src/app/p/[slug]/edit/page.tsx`
- `apps/web/src/components/project/EditableProject.tsx`
- `apps/web/src/components/project/DeleteProjectModal.tsx`

**Files Modified:**
- `apps/web/src/components/project/ProjectDetails.tsx`
- `apps/web/src/app/globals.css`

### Phase 2: Screenshot Management ✅

- Screenshot upload endpoint (`POST /api/v1/projects/:slug/screenshot`)
- ScreenshotEditor component with upload and refresh buttons
- Client-side image validation (size, type)
- URL change confirmation modal (rescrape prompt)
- Integration with existing refresh endpoint (1-hour cooldown)

**Files Created:**
- `apps/api/src/lib/storage.ts`
- `apps/web/src/components/project/ScreenshotEditor.tsx`
- `apps/web/src/components/project/UrlChangeModal.tsx`

**Files Modified:**
- `apps/api/src/routes/projects.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api/projects.ts`
- `apps/web/src/components/project/EditableProject.tsx`
- `apps/web/src/app/p/[slug]/edit/page.tsx`
- `apps/web/src/app/globals.css`

### Phase 3: Moderation Feedback ✅

- RevisionStatusBanner component with pending/rejected states
- Fetch revisions with moderation reasons on edit page load
- Yellow banner for pending edits, red for rejected
- Expandable details showing changed fields and rejection reason
- Auto-refresh after successful edits

**Files Created:**
- `apps/web/src/components/project/RevisionStatusBanner.tsx`

**Files Modified:**
- `apps/api/src/routes/projects.ts` (joined moderation_events for reasons)
- `apps/web/src/lib/api/projects.ts`
- `apps/web/src/components/project/EditableProject.tsx`
- `apps/web/src/app/p/[slug]/edit/page.tsx`
- `apps/web/src/app/globals.css`

### Completed Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | Core Editing (edit page, inline editing, delete) | Complete |
| 2 | Screenshot Management (upload, refresh, URL modal) | Complete |
| 3 | Moderation Feedback (revision status banners) | Complete |
| 4 | My Projects & Polish (project list, nav links) | Complete |

### Phase 4 Details

- My Projects page at `/my/projects`
- API endpoint: `GET /api/v1/users/me/projects`
- Status badges: "Pending Review" (hidden), "Removed" (removed)
- Quick actions: Edit, Delete with confirmation modal
- Navigation links in Header and MobileNav

### Technical Notes

- **Auth:** Client-side only via `useSession()` hook (better-auth)
- **Data Fetching:** SWR for edit page (not shared layout - simpler)
- **Moderation:** Edits auto-approved or held as pending revision
- **Soft Delete:** Sets `status='removed'`, preserves comments/votes
