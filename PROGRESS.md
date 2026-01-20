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

---

## URL Onboarding Fixes

**Status:** Complete (All 4 Phases)
**Last Updated:** 2026-01-14
**Plan Doc:** `plan/url-onboarding-fixes.md`

### Overview

Bug fixes, security hardening, UX polish, and performance improvements for the URL-first onboarding feature identified during code review.

### Phase 1: Bug Fixes ✅

| Fix | Description |
|-----|-------------|
| Rate limit memory cleanup | Added 1% probabilistic cleanup to prevent unbounded Map growth |
| Tool matching false positives | Short terms (≤3 chars) now use exact match only (fixes "go" matching "django") |
| SSE connection cleanup | Added `stream.aborted` check to stop polling when client disconnects |

**Files:**
- `apps/api/src/routes/drafts.ts`
- `apps/worker/src/lib/tool-matching.ts`

### Phase 2: Security Hardening ✅

| Fix | Description |
|-----|-------------|
| Screenshot fetch timeout | Added 30s AbortController timeout to prevent hanging fetches |
| Stricter LLM parsing | Added zod schema validation with defaults for missing fields |
| URL blocklist expansion | Added 10 more URL shorteners (buff.ly, short.io, rebrand.ly, etc.) |

**Files:**
- `apps/worker/src/handlers/scrape-url.ts`
- `apps/worker/src/handlers/analyze-content.ts`
- `packages/shared/src/url-validation.ts`

### Phase 3: UX Polish ✅

| Fix | Description |
|-----|-------------|
| Field save indicator | Shows "Saving..." in label when auto-saving on blur |
| Character counts | Displays count below title/tagline/description with warning at 90% |
| Discard confirmation | Modal confirmation before discarding draft |
| Retry failed drafts | New `POST /api/v1/drafts/:draftId/retry` endpoint to re-queue failed analyses |

**Files:**
- `apps/web/src/components/submit/DraftReview.tsx`
- `apps/web/src/app/globals.css`
- `apps/api/src/routes/drafts.ts`
- `apps/web/src/lib/api/drafts.ts`
- `apps/web/src/app/submit/page.tsx`

### Phase 4: Performance ✅

| Fix | Description |
|-----|-------------|
| Tool slug caching | In-memory cache with 5min TTL eliminates DB query per analysis |

**Files:**
- `apps/worker/src/lib/tool-matching.ts`

### Technical Notes

- **Rate limiting:** Probabilistic cleanup (1% chance per request) keeps memory bounded without per-request overhead
- **Tool matching:** Cache stores ~45 tool slugs in a `Set<string>` for O(1) lookups
- **Retry endpoint:** Respects rate limits and re-queues the original scrape job

---

## Project Edit Bug Fixes (2026-01-14)

### Bug 1: Edit Page Crash - undefined author.id

**Problem:** When editing a field on `/p/[slug]/edit`, the page crashed with `TypeError: Cannot read properties of undefined (reading 'id')`.

**Root Cause:** The PATCH endpoint returned raw database rows without joined author/media/tools data. When the client updated SWR cache with this incomplete data, subsequent renders crashed trying to access `project.author.id`.

**Fix:** Created `fetchCompleteProject()` helper function that fetches project with all joins. Both return paths in PATCH endpoint now use this helper.

**Files:**
- `apps/api/src/routes/projects.ts` - Added helper, updated PATCH returns
- `debug/edit-project-undefined-author.md` - Debug documentation

### Bug 2: Revision Banner Shows Wrong Changed Fields

**Problem:** When editing only the description field, the revision status banner incorrectly showed "main URL" and "repository URL" as changed fields.

**Root Cause:** The banner checked `revision.mainUrl !== undefined` to detect changes. But the database stores `undefined` as `NULL`, and `null !== undefined` is `true` in JavaScript. So every field with NULL appeared as "changed".

**Fix:** Added explicit `changedFields` column to track which fields were actually changed.

**Schema Change:**
```typescript
// packages/db/src/schema/projects.ts
changedFields: text("changed_fields").array().default([]).notNull(),
```

**Files:**
- `packages/db/src/schema/projects.ts` - Added `changedFields` column
- `apps/api/src/routes/projects.ts` - Populate `changedFields` on revision create
- `apps/web/src/lib/api/projects.ts` - Added type for `changedFields`
- `apps/web/src/components/project/RevisionStatusBanner.tsx` - Use `changedFields` array
- `debug/revision-banner-false-url-changes.md` - Debug documentation

### Design Decision: changedFields Array

The `changedFields` approach was chosen over simpler null-checking fixes because:

1. **No ambiguity** - Explicit list vs inferring from NULL values
2. **Future-proof** - Supports potential multi-edit merge scenarios
3. **Backward compatible** - Old revisions default to empty array
4. **Self-documenting** - Clear what the revision represents

---

## Edit Page: Explicit Submit Pattern

**Status:** Complete
**Last Updated:** 2026-01-15
**Spec Doc:** `plan/edit-page-explicit-submit.md`
**Debug Doc:** `debug/edit-page-moderation-ux.md`

### Overview

Replaced the auto-save-on-blur pattern with an explicit "Save Changes" button. This eliminates the UX issue where the first flagged edit blocked all subsequent changes.

**Problem:** Each field saved on blur → each save triggered moderation → if moderation flagged content, user was blocked from making any more edits (409 Conflict: "revision pending").

**Solution:** Collect all changes locally, submit all at once via single PATCH request. Single moderation check on combined content, single revision created.

### Changes

**EditableProject.tsx:**
- Changed from `onFieldChange` to `onSubmit` prop pattern
- Field handlers now only update local state (no API calls)
- Added `isDirty` tracking via useMemo (compares current state to project prop)
- Added `getChangedFields()` to collect dirty fields for submit
- Added "Save Changes" button (disabled when not dirty)
- Added "Discard" button (visible when dirty)
- Navigation warning via `beforeunload` event
- URL change modal now triggers on submit (not on blur)

**Edit Page (page.tsx):**
- Changed `handleFieldChange` to `handleSubmit`
- Receives all changes as single object, sends single PATCH

**CSS:**
- Added `.edit-header-left` and `.edit-header-right` styles

### User Experience

| Before | After |
|--------|-------|
| Edit title → blur → API call → maybe blocked | Edit title → local state only |
| Edit description → blur → API call → 409 error | Edit description → local state only |
| Can't continue editing | Click "Save Changes" → single API call |
| Multiple revisions for one edit session | Single revision with all changes |

### Files Modified

| File | Changes |
|------|---------|
| `apps/web/src/components/project/EditableProject.tsx` | Major refactor |
| `apps/web/src/app/p/[slug]/edit/page.tsx` | Use `onSubmit` pattern |
| `apps/web/src/app/globals.css` | Header layout styles |

### Technical Notes

- **Backend unchanged** - PATCH already supported multi-field updates
- **Dirty detection** - Compares each field to original project prop
- **Tools comparison** - Order-independent Set comparison
- **Vibe details** - Order-independent comparison via `isEqualVibeDetails()` from shared package
- **URL modal** - Only shown on submit when mainUrl changed (for screenshot refresh prompt)

---

## Centralized Vibe Configuration

**Status:** Complete
**Last Updated:** 2026-01-15

### Overview

Centralized vibe category definitions and defaults in `packages/shared` to ensure consistency across frontend, API, and worker. Previously, vibe defaults were duplicated in 4+ components.

### What Was Added

**`packages/shared/src/schemas.ts`:**
```typescript
export const VIBE_CATEGORIES = ["idea", "design", "code", "prompts", "vibe"] as const;
export type VibeCategory = (typeof VIBE_CATEGORIES)[number];
export type VibeDetails = Record<VibeCategory, number>;

export const DEFAULT_VIBE_SCORE = 50;
export const DEFAULT_VIBE_DETAILS: VibeDetails = { ... };

export function getVibeDetailsWithDefaults(details): VibeDetails { ... }
export function isEqualVibeDetails(a, b): boolean { ... }
```

### Benefits

1. **Single source of truth** - Change categories in one place
2. **Type safety** - TypeScript catches stale category references
3. **Order-independent comparison** - `isEqualVibeDetails()` handles JSON key ordering differences between client/server
4. **Consistent defaults** - All components use same initial values

### Files Modified

| File | Change |
|------|--------|
| `packages/shared/src/schemas.ts` | Added vibe configuration |
| `apps/web/src/components/project/EditableProject.tsx` | Import from shared |
| `apps/web/src/components/submit/DraftReview.tsx` | Import from shared |
| `apps/web/src/components/submit/EditableProjectPreview.tsx` | Import from shared |
| `apps/web/src/app/submit/manual/page.tsx` | Import from shared |

### Related Bug Fix

**Dirty State After Save:** The explicit submit feature had a bug where `isDirty` remained true after saving. Root cause was `JSON.stringify` comparison failing due to PostgreSQL JSONB not preserving key order. Fixed by using `isEqualVibeDetails()` which compares values regardless of key order.

---

## Edit Page Polish & Bug Fixes (2026-01-15)

### Tagline Field: Use Textarea

Changed the tagline (short description) field on the edit page to use `InlineEditTextarea` instead of `InlineEditText`. This provides a better editing experience for longer content (up to 500 characters).

**Files Modified:**
- `apps/web/src/components/project/EditableProject.tsx` - Use `InlineEditTextarea` for tagline
- `apps/web/src/app/globals.css` - Added preview mode styles for tagline textarea

### Spacing Fix: Tagline/Author Collision

Added spacing between the tagline field and author info section. The `.editable-field` negative margins were causing visual collision.

**Fix:** Added `margin-bottom: var(--spacing-4)` to `.project-details-tagline` in preview mode.

**File:** `apps/web/src/app/globals.css`

---

## Tabs Component: Rename onChange to onTabChange

**Status:** Complete
**Debug Doc:** `debug/vibe-tabs-onchange-error.md`

### Problem

Clicking the "Detailed" tab in the Vibe Score component threw `TypeError: onChange is not a function`. The `VibeInput` component was passing `onTabChange` but `Tabs` expected `onChange`.

### Root Cause

The `Tabs` component's prop name (`onChange`) was unintuitive for a domain-specific component. Developers naturally used `onTabChange` when consuming the component, causing this bug twice (admin page and VibeInput).

### Fix

Renamed the prop from `onChange` to `onTabChange` in the Tabs component for self-documenting clarity.

**Files Modified:**

| File | Change |
|------|--------|
| `apps/web/src/components/ui/Tabs.tsx` | Renamed `onChange` → `onTabChange` |
| `apps/web/src/app/page.tsx` | Updated prop name |
| `apps/web/src/app/admin/page.tsx` | Updated prop name |
| `apps/web/src/components/form/VibeInput.tsx` | Already used `onTabChange` (no change needed) |

---

## Modal Centering Fix

**Status:** Complete
**Debug Doc:** `debug/modal-not-centered.md`

### Problem

All modals (DeleteProjectModal, UrlChangeModal, LoginModal) appeared in the top-left of the viewport instead of being centered.

### Root Cause

The global CSS reset `* { margin: 0; }` was overriding the native `<dialog>` element's `margin: auto` that browsers use for centering when `showModal()` is called.

### Fix

Added `margin: auto` to the `.modal` class to restore centering behavior.

```css
.modal {
  /* ... existing styles ... */
  margin: auto;
}
```

**File:** `apps/web/src/app/globals.css`

### Affected Components

All modals use the same base `Modal` component, so all are now fixed:
- `DeleteProjectModal`
- `UrlChangeModal`
- `LoginModal`

---

## Tailwind v4 Migration & globals.css Cleanup

**Status:** Phase 1 Complete
**Last Updated:** 2026-01-18
**Plan Doc:** `plan/remove-globals-css.md`
**Debug Docs:**
- `debug/tailwind-v4-styles-not-applied.md`
- `debug/content-left-aligned.md`

### Overview

Migration to Tailwind CSS v4 revealed issues with CSS variable architecture and cascading layer conflicts. After fixing critical bugs, began systematic cleanup of legacy globals.css.

### Bug 1: Tailwind v4 Styles Not Applied ✅

**Problem:** Tailwind utility classes like `bg-bg`, `text-fg`, `mx-auto` were not being applied.

**Root Cause:** CSS Variable Circular Reference
- `theme.css`: `--background: oklch(0.07 0 0)` → `--bg: var(--background)`
- `globals.css`: `--background: var(--bg)` (loaded later, creates circular reference)

**Fix:** Removed the circular reference aliases from globals.css.

### Bug 2: Content Left-Aligned Instead of Centered ✅

**Problem:** Content aligned to left edge instead of being centered with `mx-auto`.

**Root Cause:** Unlayered CSS Override
- `globals.css`: `* { margin: 0; }` (unlayered)
- `@layer utilities`: `.mx-auto { margin-inline: auto; }`
- CSS Cascade Layers spec: unlayered CSS beats layered CSS

**Fix:** Removed the unlayered universal selector reset.

### Bug 3: Light Theme Not Applying ✅

**Problem:** Body background stayed dark even on light theme.

**Root Cause:** Hardcoded CSS variables in globals.css overriding theme.css's themeable `var()` indirection.

**Fix:** Removed hardcoded `:root` variables from globals.css.

### Phase 1: Remove Dead Code ✅

Comprehensive audit found ~80% of globals.css was dead code after Tailwind migration.

**Results:**
- Before: ~3,500 lines
- After: ~1,340 lines
- Reduction: 62% (~2,160 lines removed)

**Categories Removed:**
- Button variants (migrated to Tailwind + CVA)
- Input variants (using Tailwind classes)
- Navigation styles (using Tailwind classes)
- Vibe/vote system (using Tailwind classes)
- Avatar component (using Tailwind classes)
- Badge component (using Tailwind classes)
- Toast component (using Tailwind classes)
- Comment system (using Tailwind classes)
- Settings layout (using Tailwind classes)
- Admin layout (using Tailwind classes)
- Mobile navigation (using Tailwind classes)
- Tools selector (using Tailwind classes)
- Generic utility classes (replaced by Tailwind)

**Kept for Phase 2:**
- Skeleton animation (shared across components)
- Empty state styles
- Project card/details styles
- Modal styles
- Form styles
- Admin/revision styles
- Preview/editable styles
- Accessibility/print styles

### All Phases Complete ✅

| Phase | Name | Status |
|-------|------|--------|
| 1 | Remove dead code | ✅ Complete |
| 2 | Migrate remaining used classes to Tailwind | ✅ Complete |
| 3 | Update component files with Tailwind utilities | ✅ Complete |
| 4 | Move shared styles (skeleton) to theme.css | ✅ Complete |
| 5 | Delete globals.css and verify | ✅ Complete |

**Final result:** globals.css has been deleted. All ~3,500 lines removed. Styles now use Tailwind utilities directly in components or are shared via theme.css.

### Related Files

| File | Purpose |
|------|---------|
| `apps/web/src/styles/theme.css` | Tailwind v4 @theme definitions, CSS variables, skeleton animation |
| `apps/web/src/components/ui/button-variants.ts` | Extracted CVA button variants for Server Components |

### Technical Insights

1. **CSS Cascade Layers:** Tailwind v4 uses `@layer theme, base, components, utilities`. Any unlayered CSS has higher priority than all layered CSS.

2. **CSS Variable Indirection:** For theming, use `--bg: var(--background)` where `--background` is set per theme (via `[data-theme="light"]` selectors).

3. **Server Components + CVA:** Components using `cva()` must be extracted to separate `.ts` files (not `.tsx` with "use client") to be importable by Server Components.
