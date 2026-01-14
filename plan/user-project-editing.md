# User Project Editing Feature Spec

**Status:** Phase 4 Complete
**Created:** 2026-01-13
**Author:** Claude

---

## Key Decisions Summary

| Decision | Choice |
|----------|--------|
| Edit mode | Separate `/edit` page with shared layout (minimize re-renders) |
| Rejected edits | Show reason, allow re-edit |
| Screenshot | Manual upload + refresh button |
| URL changes | Confirm modal asking whether to rescrape |
| Edit history | Defer to future phase |

---

## Executive Summary

Enable users to edit and delete their own published projects. The backend API already supports editing with moderation integration - this spec focuses on the **frontend UI** needed to expose these capabilities.

---

## Current State Analysis

### What Already Exists (Backend - Complete)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `PATCH /api/v1/projects/:slug` | Update project fields | ✅ Implemented |
| `DELETE /api/v1/projects/:slug` | Soft delete (status='removed') | ✅ Implemented |
| `POST /api/v1/projects/:slug/refresh` | Re-scrape URLs for screenshots/README | ✅ Implemented |
| `GET /api/v1/projects/:slug/revisions` | View revision history | ✅ Implemented |

**Existing Revision Workflow:**
1. User submits PATCH with changes
2. System creates `projectRevisions` record
3. Moderation runs on changed text content
4. If approved → changes applied immediately, `lastEditedAt` updated
5. If flagged → revision stays "pending" for mod review, project unchanged

**Database Fields Ready:**
- `projects.lastEditedAt` - timestamp when edit was approved
- `projects.status` - enum: "published" | "hidden" | "removed"
- `projectRevisions` table - full revision tracking with statuses

### What Already Exists (Frontend - Reusable)

| Component | Location | Reusable For |
|-----------|----------|--------------|
| `InlineEditText` | `components/submit/InlineEditText.tsx` | Title, tagline |
| `InlineEditTextarea` | `components/submit/InlineEditTextarea.tsx` | Description |
| `TagEditor` | `components/submit/TagEditor.tsx` | Tools selection |
| `VibeInput` | `components/form/VibeInput.tsx` | Vibe score |
| `EditableProjectPreview` | `components/submit/EditableProjectPreview.tsx` | Pattern reference |

**Client API:**
- `updateProject(slug, data)` - Already implemented in `lib/api/projects.ts`
- `fetchProjectRevisions(slug)` - Already implemented

### What's Missing (This Spec)

1. **Edit button** on project page (visible to authors only)
2. **Edit page** at `/p/[slug]/edit`
3. **Revision status UI** - show pending/approved/rejected states
4. **Delete confirmation** - modal with consequences warning
5. **My projects page** - list of user's projects with edit/delete actions

---

## Feature Requirements

### FR1: Edit Button on Project Page

**Who sees it:** Project author only (check `project.author.id === currentUser.id`)

**Location:** In `ProjectDetails` component, near existing action buttons

**Behavior:**
- Click navigates to `/p/[slug]/edit`
- Show only for published projects (not hidden/removed)

### FR2: Edit Page (`/p/[slug]/edit`)

**Route:** `/apps/web/src/app/p/[slug]/edit/page.tsx`

**Access Control:**
- Require authentication
- Verify current user is project author
- Redirect to `/p/[slug]` if unauthorized

**Layout:**
- Reuse `EditableProjectPreview` pattern from draft flow
- Show current project data as initial values
- Auto-save on field blur (same as draft editing)

**Editable Fields:**
| Field | Component | Validation |
|-------|-----------|------------|
| Title | `InlineEditText` | Required, max 255 chars |
| Tagline | `InlineEditText` | Required, max 500 chars |
| Description | `InlineEditTextarea` | Optional, max 10,000 chars |
| Tools | `TagEditor` | Max 10 items |
| Vibe Mode | `VibeInput` | overview or detailed |
| Vibe Percent | `VibeInput` | 0-100 |
| Main URL | Text input | Valid URL or empty |
| Repo URL | Text input | Valid URL or empty |

**NOT Editable:**
- Screenshot (use "Refresh" action instead)
- Slug (permanent identifier)
- Author (ownership is permanent)
- Created date

**Actions:**
- "Done" button → navigates back to `/p/[slug]`
- "Refresh Screenshot" button → calls refresh endpoint (1-hour cooldown)
- "Delete Project" button → opens delete confirmation modal

### FR3: Moderation on Edit

**Behavior:** Same as draft submission - edits run through moderation.

**Outcomes displayed to user:**

| Decision | User Message | Project Effect |
|----------|--------------|----------------|
| Approved | "Changes saved" | Applied immediately |
| Flagged | "Changes saved, under review" | Applied immediately, logged |
| Hidden | "Changes pending mod review" | NOT applied, revision created |
| Rejected | "Changes violate guidelines" | NOT applied, revision rejected |

**UI Feedback:**
- Toast notification for each save outcome
- If revision is pending, show warning banner: "You have pending edits awaiting review"

### FR4: Delete Project

**Trigger:** "Delete Project" button on edit page

**Confirmation Modal:**
- Title: "Delete [Project Title]?"
- Warning text: "This will hide the project from public view. Comments and votes will be preserved. This can be undone by contacting support."
- Buttons: "Cancel" (secondary), "Delete" (danger/red)

**Behavior:**
- Sets `status='removed'` (soft delete)
- Redirects to `/` or user's projects page
- Shows success toast: "Project deleted"

### FR5: Revision Status Display

**Location:** Edit page header or banner

**States:**

| Revision Status | Display |
|-----------------|---------|
| No pending revisions | Nothing special |
| Pending revision | Yellow banner: "Your recent edits are pending review" |
| Rejected revision | Red banner: "Your recent edits were not approved: [reason]" |

**Revision History (Optional/Future):**
- Link to view full revision history
- Show diff of what changed
- Timeline of approved/rejected edits

### FR6: My Projects Page (Optional but Recommended)

**Route:** `/my/projects` or `/u/[username]/projects`

**Content:**
- List of user's projects (published, hidden, removed)
- Status badge for each
- Quick actions: Edit, Delete, View
- "Last edited" timestamps

**Access:** Authenticated users only, shows only their own projects

---

## UI/UX Specifications

### Edit Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to [Project Title]                    [Delete] [Done]│
├─────────────────────────────────────────────────────────────┤
│ [Pending edits banner - if applicable]                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │                          │  │ [Title - click to edit]  │ │
│  │     [Screenshot]         │  │                          │ │
│  │                          │  │ [Tagline - click to edit]│ │
│  │  [Refresh Screenshot]    │  │                          │ │
│  └──────────────────────────┘  │ By You · Submitted X ago │ │
│                                │                          │ │
│                                │ [Main URL input]         │ │
│                                │ [Repo URL input]         │ │
│                                └──────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ About                                                 │   │
│  │ [Description - click to edit]                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Built with                                           │   │
│  │ [TagEditor - tool chips with + button]              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Vibe Score                                           │   │
│  │ [VibeInput - slider or detailed breakdown]          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Edit Affordances

Same visual patterns as draft editing:
- Dashed border on hover for editable fields
- Solid border when editing
- Cursor: text for text fields, pointer for interactive elements

### Toast Notifications

| Event | Type | Message |
|-------|------|---------|
| Field saved | Success | "Saved" (brief) |
| Save failed | Error | "Failed to save. Please try again." |
| Pending review | Warning | "Changes submitted for review" |
| Delete success | Success | "Project deleted" |
| Refresh queued | Info | "Screenshot refresh queued" |

---

## Technical Design

### Shared Layout Architecture

To minimize re-renders and share state between view/edit modes:

```
apps/web/src/app/p/[slug]/
├── layout.tsx                  # Shared layout - fetches project, provides context
├── page.tsx                    # View mode - renders ProjectDetails
├── edit/
│   └── page.tsx                # Edit mode - renders EditableProject
└── ProjectContext.tsx          # Context provider for project data
```

**Layout Component:**
```typescript
// apps/web/src/app/p/[slug]/layout.tsx
export default async function ProjectLayout({ children, params }) {
  const project = await fetchProject(params.slug);
  const session = await getSession();
  const isAuthor = session?.user?.id === project.author.id;

  return (
    <ProjectProvider project={project} isAuthor={isAuthor}>
      <div className="project-page">
        {children}
      </div>
    </ProjectProvider>
  );
}
```

This allows:
- Single data fetch shared between view and edit pages
- React state preserved during navigation between modes
- `next/link` prefetching for instant transitions

### New Files to Create

```
apps/web/src/app/p/[slug]/
├── layout.tsx                  # Shared layout with project data
├── ProjectContext.tsx          # React context for project + isAuthor
└── edit/
    └── page.tsx                # Edit page (authorization + EditableProject)

apps/web/src/components/project/
├── EditableProject.tsx         # Editable version of ProjectDetails
├── DeleteProjectModal.tsx      # Delete confirmation modal
├── RevisionStatusBanner.tsx    # Pending/rejected revision banner
├── ScreenshotEditor.tsx        # Upload + refresh screenshot controls
└── UrlChangeModal.tsx          # Confirm rescrape on URL change

apps/api/src/routes/
└── projects.ts                 # Add screenshot upload endpoint
```

### Files to Modify

```
apps/web/src/app/p/[slug]/page.tsx
  → Simplify to use context, move fetch to layout

apps/web/src/components/project/ProjectDetails.tsx
  → Add "Edit" button for authors (use isAuthor from context)
  → Add "Last edited" display (already exists but verify)

apps/web/src/lib/api/projects.ts
  → Add deleteProject(slug) function
  → Add uploadScreenshot(slug, file) function
  → Add refreshProject(slug) function (if not exists)

apps/web/src/app/globals.css
  → Reuse existing edit styles from draft flow
```

### New API Endpoint

```typescript
// POST /api/v1/projects/:slug/screenshot
// Upload a custom screenshot for the project

projectRoutes.post("/:slug/screenshot", requireAuth(), async (c) => {
  const session = c.get("session");
  const slug = c.req.param("slug");

  // Verify ownership
  const [project] = await db.select().from(projects)
    .where(eq(projects.slug, slug));

  if (!project || project.authorUserId !== session.user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Parse multipart form
  const formData = await c.req.formData();
  const file = formData.get("file") as File;

  // Validate file
  if (!file || file.size > 5 * 1024 * 1024) {
    return c.json({ error: "File too large (max 5MB)" }, 400);
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Invalid file type" }, 400);
  }

  // Upload to storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = getStorage();
  const key = generateStorageKey("project-screenshots", file.type.split("/")[1]);
  const url = await storage.upload(key, buffer, file.type);

  // Update projectMedia - set new screenshot as primary
  await db.update(projectMedia)
    .set({ isPrimary: false })
    .where(eq(projectMedia.projectId, project.id));

  await db.insert(projectMedia).values({
    projectId: project.id,
    type: "screenshot",
    url,
    source: "user_upload",
    isPrimary: true,
  });

  return c.json({ url });
});
```

### State Management

**Edit page state:**
```typescript
interface EditProjectState {
  project: ProjectDetail;              // Current server state
  pendingRevision: Revision | null;    // If edits pending review
  saving: Record<string, boolean>;     // Per-field save status
  error: string | null;                // Global error
}
```

**Field update flow:**
```
1. User edits field → onSave(value)
2. Call updateProject(slug, { field: value })
3. API returns { project, revision? }
4. If revision returned with status='pending':
   → Show "pending review" banner
   → Field reverts to original value
5. If no revision (approved):
   → Update local state with new value
   → Show "Saved" toast
```

### Authorization Flow

```typescript
// In edit page
const session = await getSession();
const project = await fetchProject(slug);

if (!session) {
  redirect('/login?returnTo=/p/${slug}/edit');
}

if (project.author.id !== session.user.id) {
  redirect(`/p/${slug}`); // Or show 403 page
}
```

---

## Design Decisions

### D1: Separate Edit Page with Shared Layout ✅

**Decision:** Separate `/edit` page that shares as much layout/structure with the view page as possible.

**Rationale:**
- Clean mental model - URL reflects mode
- Route-level authorization
- Minimize re-renders by sharing components between view and edit modes

**Implementation Approach:**
```
ProjectPage (/p/[slug])          EditProjectPage (/p/[slug]/edit)
        │                                   │
        └───────────┬───────────────────────┘
                    │
            ProjectLayout (shared)
                    │
        ┌───────────┴───────────┐
        │                       │
  ProjectDetails          EditableProject
  (read-only view)        (editable view)
```

Both pages use the same data fetching and layout structure. The key difference:
- `ProjectDetails` renders static content
- `EditableProject` renders the same structure but with inline editing components

**Transition Optimization:**
- Use Next.js shared layouts to preserve React state during navigation
- Consider `next/link` with `prefetch` for instant edit page loads
- Keep project data in shared parent to avoid re-fetch on mode switch

### D2: Rejected Edits - Show Reason, Allow Re-edit ✅

**Decision:** When edits are rejected by moderation, show the reason and allow the user to make new edits.

**UI:**
- Red banner at top of edit page: "Your recent changes were not approved"
- Expandable details showing which field was flagged and why
- All fields remain editable

### D3: Edit History - Defer to Future ✅

**Decision:** Phase 1 will not show edit history. Future phase may add a revision history view.

### D4: Screenshot - Manual Upload + Refresh Button ✅

**Decision:** Support both manual screenshot upload AND a "Refresh" button for re-scraping.

**UI:**
```
┌────────────────────────────┐
│                            │
│     [Current Screenshot]   │
│                            │
├────────────────────────────┤
│ [Upload New] [↻ Refresh]   │
└────────────────────────────┘
```

**Upload Flow:**
1. User clicks "Upload New"
2. File picker opens (accept: image/png, image/jpeg, image/webp)
3. Client validates: max 5MB, min 400x300px
4. Upload to storage, get URL
5. Update `projectMedia` with new screenshot, set `isPrimary: true`
6. Old screenshot remains in media array but not primary

**Refresh Flow:**
1. User clicks "Refresh"
2. Confirm: "This will capture a new screenshot from [mainUrl]. Continue?"
3. Queue `enrich_screenshot` job
4. Show toast: "Screenshot refresh queued"
5. Disable button for 1 hour (existing cooldown)

**New API Endpoint Needed:**
```
POST /api/v1/projects/:slug/screenshot
Content-Type: multipart/form-data
Body: { file: File }

Response: { url: string }
```

### D5: URL Change - Confirm Rescrape ✅

**Decision:** When user changes `mainUrl` or `repoUrl`, show a confirmation modal asking if they want to rescrape.

**Trigger:** On blur of URL field, if value changed

**Modal:**
```
┌─────────────────────────────────────────────┐
│ URL Changed                                 │
├─────────────────────────────────────────────┤
│ You've updated the project URL. Would you  │
│ like to refresh the screenshot and re-scan │
│ for project metadata?                       │
│                                             │
│ Note: This may update your title, tagline, │
│ and description based on the new page.     │
│                                             │
│ [Just Save URL]  [Save & Rescrape]         │
└─────────────────────────────────────────────┘
```

**"Just Save URL":** Only updates the URL field
**"Save & Rescrape":** Updates URL + queues scrape jobs (same as initial submission flow)

### D6: Concurrent Edit Protection - Last Write Wins ✅

**Decision:** Phase 1 uses last-write-wins. Low risk for single-user edits.

### D7: Mobile Experience - Responsive ✅

**Decision:** Same layout, responsive. Inline editing components already work on mobile.

---

## Implementation Phases

### Phase 1: Core Editing (MVP) ✅

**Goal:** Users can edit their projects with basic feedback
**Completed:** 2026-01-13

- [x] Edit page route with authorization (`/p/[slug]/edit`)
- [x] EditableProject component (reusing inline edit components)
- [x] Edit button on ProjectDetails (author only)
- [x] Delete project modal and soft delete functionality
- [x] URL fields with edit capability
- [ ] ~~Shared layout structure~~ (deferred - using SWR for data fetching instead)
- [ ] Basic toast notifications for save status (deferred to Phase 4)

**Files Created:**
- `apps/web/src/app/p/[slug]/edit/page.tsx`
- `apps/web/src/components/project/EditableProject.tsx`
- `apps/web/src/components/project/DeleteProjectModal.tsx`

**Files Modified:**
- `apps/web/src/components/project/ProjectDetails.tsx` (added Edit button)
- `apps/web/src/app/globals.css` (edit header, delete modal styles)

### Phase 2: Screenshot Management

**Goal:** Users can update project screenshots
**Completed:** 2026-01-13

- [x] Screenshot upload endpoint (`POST /api/v1/projects/:slug/screenshot`)
- [x] ScreenshotEditor component (upload + refresh buttons)
- [x] Client-side image validation (size, type)
- [x] Refresh button with 1-hour cooldown (uses existing refresh endpoint)
- [x] URL change confirmation modal (rescrape prompt)

**Files Created:**
- `apps/api/src/lib/storage.ts` - Storage utilities for file uploads
- `apps/web/src/components/project/ScreenshotEditor.tsx` - Upload/refresh UI
- `apps/web/src/components/project/UrlChangeModal.tsx` - Rescrape confirmation

**Files Modified:**
- `apps/api/src/routes/projects.ts` - Added screenshot upload endpoint
- `apps/web/src/lib/api.ts` - Added `apiPostFormData` for multipart uploads
- `apps/web/src/lib/api/projects.ts` - Added `uploadScreenshot` function
- `apps/web/src/components/project/EditableProject.tsx` - Integrated ScreenshotEditor and UrlChangeModal
- `apps/web/src/app/p/[slug]/edit/page.tsx` - Added screenshot change handler
- `apps/web/src/app/globals.css` - Added screenshot editor and URL modal styles

### Phase 3: Moderation Feedback

**Goal:** Users understand when/why edits are pending or rejected
**Completed:** 2026-01-14

- [x] RevisionStatusBanner component
- [x] Fetch pending/rejected revisions on edit page load
- [x] Show pending revision warning
- [x] Show rejection reason with field-level detail
- [x] Clear banner after successful re-edit (revalidates on any edit)

**Files Created:**
- `apps/web/src/components/project/RevisionStatusBanner.tsx`

**Files Modified:**
- `apps/api/src/routes/projects.ts` - Added moderation reason to revisions endpoint
- `apps/web/src/lib/api/projects.ts` - Added `reason` field to ProjectRevision type
- `apps/web/src/components/project/EditableProject.tsx` - Added banner rendering
- `apps/web/src/app/p/[slug]/edit/page.tsx` - Added revisions fetch and banner props
- `apps/web/src/app/globals.css` - Added revision banner styles

### Phase 4: My Projects & Polish

**Goal:** Users can manage all their projects from one place
**Completed:** 2026-01-14

- [x] My projects list page (`/my/projects`)
- [x] Project status badges (published, hidden, removed)
- [x] Quick actions (Edit, Delete)
- [x] Navigation links in Header and MobileNav
- [ ] Keyboard accessibility audit (deferred)
- [ ] Edit history view (deferred - future phase)

**Files Created:**
- `apps/web/src/app/my/projects/page.tsx`

**Files Modified:**
- `apps/api/src/routes/users.ts` (added GET /me/projects endpoint)
- `apps/web/src/lib/api/projects.ts` (added MyProjectListItem type, fetchMyProjects)
- `apps/web/src/components/layout/Header.tsx` (added My Projects nav link)
- `apps/web/src/components/layout/MobileNav.tsx` (added My Projects nav link)
- `apps/web/src/app/globals.css` (added my-projects styles)

---

## Security Considerations

1. **Authorization:** Always verify `project.authorUserId === session.user.id` on both client and server
2. **CSRF:** Existing API uses session cookies with CSRF protection
3. **Rate Limiting:** Existing per-user rate limits on PATCH endpoint
4. **Input Validation:** Zod schemas on API, component-level validation on frontend
5. **XSS:** React escapes output by default, no raw HTML rendering
6. **Moderation:** All text content runs through moderation before publishing

---

## Success Metrics

1. **Adoption:** % of authors who edit their projects at least once
2. **Completion:** Edit sessions that result in saved changes
3. **Moderation Load:** Revisions flagged for review vs. auto-approved
4. **Deletion Rate:** Projects deleted vs. total projects (monitor for issues)

---

## Dependencies

**Backend:**
- Most APIs already exist (PATCH, DELETE, refresh, revisions)
- NEW: `POST /api/v1/projects/:slug/screenshot` endpoint for image upload

**Frontend:**
- Reuses existing components: `InlineEditText`, `InlineEditTextarea`, `TagEditor`, `VibeInput`
- Uses existing CSS from draft editing flow

**Database:**
- No migrations needed - all tables/columns exist
- `projectMedia.source` already supports "user_upload" value

---

## Appendix: Existing API Details

### PATCH /api/v1/projects/:slug

**Request:**
```typescript
{
  title?: string;
  tagline?: string;
  description?: string;
  mainUrl?: string | null;
  repoUrl?: string | null;
  vibeMode?: "overview" | "detailed";
  vibePercent?: number;
  vibeDetails?: Record<string, number>;
  tools?: string[];  // Tool slugs
}
```

**Response (approved):**
```typescript
{
  project: ProjectDetail;
  revision: {
    id: string;
    status: "approved";
    submittedAt: string;
    reviewedAt: string;
  }
}
```

**Response (pending review):**
```typescript
{
  project: ProjectDetail;  // Unchanged
  revision: {
    id: string;
    status: "pending";
    submittedAt: string;
  };
  moderation: {
    decision: "hidden";
    reason: string;
  }
}
```

### DELETE /api/v1/projects/:slug

**Response:**
```typescript
{ success: true }
```

### GET /api/v1/projects/:slug/revisions

**Response:**
```typescript
{
  revisions: Array<{
    id: string;
    status: "pending" | "approved" | "rejected";
    title?: string;
    tagline?: string;
    // ... other changed fields
    submittedAt: string;
    reviewedAt?: string;
  }>
}
```
