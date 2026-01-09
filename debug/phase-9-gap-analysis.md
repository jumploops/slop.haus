# Phase 9 Gap Analysis

Analysis of Phase 9 (Frontend) requirements vs Phases 1-8 backend implementation.

## Summary

| Spec Item | Backend Status | Frontend Status | Action Needed |
|-----------|---------------|-----------------|---------------|
| 9.1 Layout | N/A | Partial | Build mobile nav, footer |
| 9.2 Feed | Ready | Placeholder | Build complete page |
| 9.3 Project | Ready | Missing | Build complete page |
| 9.4 Submit | Ready | Missing | Build complete page |
| 9.5 Favorites | Ready | Missing | Build complete page |
| 9.6 Settings | **Needs 1 API** | Missing | Add name update endpoint |
| 9.7 Admin | **Needs 2 APIs** | Missing | Add user/project list endpoints |
| 9.8 Auth | Ready | Basic | Enhance UX, verify linking |
| 9.9 Voting | Ready | Missing | Build vote component |
| 9.10 SEO | N/A | Basic | Add dynamic meta |

---

## Detailed Analysis

### 9.1 Layout and Navigation

**Spec:**
- Root layout with header/footer
- Header: logo, nav links, auth buttons
- Mobile responsive navigation
- Theme: clean, minimal, slightly irreverent

**Current State:**
- Basic header with logo, Feed, Submit links, auth buttons
- No footer
- No mobile hamburger/responsive nav
- Dark theme established (globals.css)

**Files:**
- `apps/web/src/app/layout.tsx` - basic layout
- `apps/web/src/app/globals.css` - dark theme CSS

**Action Items:**
- [ ] Add responsive mobile nav (hamburger menu)
- [ ] Add footer with links
- [ ] Add conditional nav links (Favorites, Settings, Admin based on auth/role)

---

### 9.2 Home Page / Feed

**Spec:**
- Tab bar: Hot | New | Top
- Toggle: Normal vs Dev ranking
- Time window selector for Top (24h, 7d, 30d, all)
- Project cards with thumbnails, scores, vibe meter, votes, comments
- Infinite scroll or pagination
- Loading skeletons

**Backend Endpoints Available:**
```
GET /api/v1/projects
  Query: sort (hot|new|top), channel (normal|dev), window (24h|7d|30d|all), page, limit
  Returns: projects with author, primaryMedia, pagination

GET /api/v1/projects/:slug/vote-state
  Returns: normal vote, dev vote, hasDevCredential
```

**Current State:**
- Static placeholder page with mock data

**Action Items:**
- [ ] Build ProjectCard component
- [ ] Build FeedTabs component (Hot/New/Top)
- [ ] Build ChannelToggle component (Normal/Dev)
- [ ] Build TimeWindowSelector (for Top sort)
- [ ] Implement data fetching with SWR or React Query
- [ ] Add infinite scroll or pagination UI
- [ ] Add loading skeletons

---

### 9.3 Project Page (`/p/:slug`)

**Spec:**
- Full project details
- Large screenshot/media
- Score widget (both channels)
- Vibe meter with percentage
- Links to live site and repo
- Tools/tech tags
- Author info with dev badge
- "Last edited" timestamp
- "Update pending" badge if applicable
- Vote buttons
- Favorite button
- Threaded comments section
- Reply functionality

**Backend Endpoints Available:**
```
GET /api/v1/projects/:slug
  Returns: full project with media, tools, author

GET /api/v1/projects/:slug/comments
  Returns: threaded comments with authors

POST /api/v1/projects/:slug/vote
  Body: { channel, value }

GET /api/v1/projects/:slug/vote-state
POST /api/v1/projects/:slug/favorite
DELETE /api/v1/projects/:slug/favorite
GET /api/v1/projects/:slug/favorite

GET /api/v1/projects/:slug/revisions (auth required, owner only)
  Returns: revision history
```

**Current State:**
- No `/p/[slug]` route exists

**Gap: "Update pending" badge**
The revisions endpoint requires auth and returns all revisions. To show "update pending" badge:
- Option A: Frontend filters for `status: 'pending'` from revisions list (requires auth)
- Option B: Add `hasPendingRevision` boolean to project detail response (simpler)

**Action Items:**
- [ ] Create `/app/p/[slug]/page.tsx`
- [ ] Build ProjectDetail component
- [ ] Build VoteWidget component
- [ ] Build VibeMeter component (reusable)
- [ ] Build CommentThread component
- [ ] Build CommentForm component
- [ ] Consider adding `hasPendingRevision` to project detail API

---

### 9.4 Submit Page (`/submit`)

**Spec:**
- Requires auth + GitHub linked
- Form fields: title, tagline, description, mainUrl, repoUrl
- Validation: at least one URL required
- Vibe input: Mode toggle (Overview vs Detailed)
- Tools selector (autocomplete/tags)
- Preview before submit
- Submit → redirect to project page

**Backend Endpoints Available:**
```
POST /api/v1/projects
  Body: { title, tagline, description?, mainUrl?, repoUrl?, vibeMode, vibePercent?, vibeDetails?, tools? }
  Requires: GitHub-linked account

GET /api/v1/tools?q=search
  Returns: tool list for autocomplete
```

**Current State:**
- Nav link to `/submit` exists, but route doesn't exist

**Gap: Tool Creation**
Users can select tools by slug, but there's no endpoint to create new tools.
- Question: Are tools pre-populated via seed data?
- Check: `packages/db/src/seed.ts` exists

**Action Items:**
- [ ] Create `/app/submit/page.tsx`
- [ ] Build ProjectForm component with validation
- [ ] Build VibeModeToggle component
- [ ] Build VibeSlider components (overview + detailed)
- [ ] Build ToolsAutocomplete component
- [ ] Build ProjectPreview component
- [ ] Check/implement tool seed data
- [ ] Consider: Should users be able to add custom tools?

---

### 9.5 Favorites Page (`/favorites`)

**Spec:**
- Requires auth
- List of favorited projects
- Remove from favorites button

**Backend Endpoints Available:**
```
GET /api/v1/users/me/favorites
  Returns: favorited projects with primaryMedia

DELETE /api/v1/projects/:slug/favorite
```

**Current State:**
- No `/favorites` route exists

**Action Items:**
- [ ] Create `/app/favorites/page.tsx`
- [ ] Reuse ProjectCard component
- [ ] Add unfavorite button to card

---

### 9.6 Settings Pages (`/settings/*`)

**Spec:**
- `/settings/profile`: name, image
- `/settings/connections`: linked OAuth providers
  - Show connected accounts
  - Link/unlink buttons
  - GitHub required notice for submissions

**Backend Endpoints Available:**
```
GET /api/v1/auth/me
  Returns: user with providers list, hasGitHub, hasGoogle

GET /api/v1/auth/accounts
  Returns: linked accounts with provider and accountId

DELETE /api/v1/auth/unlink/:provider
  Note: Cannot unlink last account
```

**MISSING API: Profile Update**
```
PATCH /api/v1/users/me
  Body: { name? }
  Purpose: Update user's display name
```

The database schema supports name updates on the user table, but no endpoint exists.

Note: User avatar comes from OAuth provider (GitHub/Google) - no custom image upload needed for MVP.

**Current State:**
- No `/settings` routes exist

**Action Items:**
- [ ] **API: Add profile name update endpoint** (`PATCH /api/v1/users/me`)
- [ ] Create `/app/settings/layout.tsx` with sidebar nav
- [ ] Create `/app/settings/profile/page.tsx`
- [ ] Create `/app/settings/connections/page.tsx`
- [ ] Build ProfileForm component (name only, avatar from OAuth)
- [ ] Build LinkedAccountsManager component
- [ ] Handle account linking via Better Auth `linkSocial`
- [ ] **TODO:** Verify account linking behavior after implementation

---

### 9.7 Admin Pages (`/admin/*`)

**Spec:**
- `/admin/mod-queue`: moderation queue
- `/admin/users`: user management, dev verification
- `/admin/projects`: project management
- Access control: admin/mod role required

**Backend Endpoints Available:**
```
Mod Queue:
GET /api/v1/admin/mod-queue?type=project|comment
POST /api/v1/admin/projects/:id/approve
POST /api/v1/admin/projects/:id/hide
POST /api/v1/admin/projects/:id/remove (admin only)
POST /api/v1/admin/comments/:id/approve
POST /api/v1/admin/comments/:id/remove

Dev Verification:
POST /api/v1/admin/verify-dev/:userId
DELETE /api/v1/admin/verify-dev/:userId
GET /api/v1/admin/verified-devs

Revisions:
GET /api/v1/admin/revisions?status=pending
POST /api/v1/admin/revisions/:id/approve
POST /api/v1/admin/revisions/:id/reject
```

**MISSING API: List All Users**
```
GET /api/v1/admin/users?page=1&limit=20&search=
  Purpose: Paginated user list for admin user management
  Returns: users with role, devVerified, project count, etc.
```

**MISSING API: Admin Project List**
```
GET /api/v1/admin/projects?status=all&page=1&limit=20
  Purpose: Admin view of all projects including hidden/removed
  Note: The public /api/v1/projects only returns published projects
```

**Current State:**
- No `/admin` routes exist

**Action Items:**
- [ ] **API: Add admin user list endpoint**
- [ ] **API: Add admin project list endpoint**
- [ ] Create `/app/admin/layout.tsx` with role guard
- [ ] Create `/app/admin/page.tsx` (dashboard/redirect)
- [ ] Create `/app/admin/mod-queue/page.tsx`
- [ ] Create `/app/admin/users/page.tsx`
- [ ] Create `/app/admin/projects/page.tsx`
- [ ] Build ModerationCard component
- [ ] Build UserManagementRow component
- [ ] Build AdminProjectRow component

---

### 9.8 Auth Flows

**Spec:**
- Login modal/page with Google/GitHub options
- Post-login redirect handling
- "Link account" flow from settings
- Logout

**Backend:**
Better Auth handles all OAuth flows via `/api/auth/*`

**Current State:**
- AuthButtons component works for sign in/out
- No dedicated login page
- No modal implementation

**Action Items:**
- [ ] Build LoginModal or `/app/login/page.tsx`
- [ ] Handle post-login redirect (callbackURL param)
- [ ] Test account linking flow with `linkSocial`
- [ ] Add visual feedback during OAuth redirect

---

### 9.9 Vote Interaction

**Spec:**
- Optimistic UI updates
- Cookie handling for rater identity
- Visual feedback for current vote state
- Rate limit error handling

**Backend Endpoints Available:**
```
POST /api/v1/projects/:slug/vote
  Body: { channel: 'normal'|'dev', value: 1|-1|0 }
  Returns: scores, rate limit info on 429

GET /api/v1/projects/:slug/vote-state
  Returns: { normal, dev, hasDevCredential }
```

**Cookie Handling:**
- Normal votes: API sets `slop_rater` cookie automatically
- Dev votes: Requires `slop_dev_cred` cookie from `POST /api/v1/auth/dev-credential`

**Current State:**
- No vote UI exists

**Action Items:**
- [ ] Build VoteButtons component
- [ ] Implement optimistic updates
- [ ] Handle rate limit errors with retryAfter
- [ ] Show different state for dev channel (locked if no credential)
- [ ] Consider: UI for obtaining dev credential (verified devs only)

---

### 9.10 SEO and Meta

**Spec:**
- Dynamic meta tags per page
- Open Graph images
- Sitemap generation

**Current State:**
- Static title/description in root layout

**Action Items:**
- [ ] Use Next.js `generateMetadata` for dynamic pages
- [ ] Create OG image generation (e.g., using @vercel/og or sharp)
- [ ] Create `sitemap.xml` generation
- [ ] Add structured data (JSON-LD) for projects

---

## Resolved Decisions

| Question | Resolution |
|----------|------------|
| Dev credential UX | Backend-only. Auto-issue on login for verified devs. No special frontend UI. |
| Account linking | Assume Better Auth handles automatically. Add TODO to verify after implementation. |
| Profile images | Use OAuth provider avatar (GitHub/Google). No custom upload for MVP. |
| Tools data | Seed data exists with 40+ common tools. Run `pnpm db:seed`. |

---

## Remaining Unknowns / TODOs

### 1. Account Linking Verification

**TODO:** After initial implementation, verify Better Auth account linking:
- User logged in with Google, clicks "Link GitHub"
- Confirm it links rather than creating duplicate account
- Confirm error handling if provider already linked to different user

### 2. Dev Credential Auto-Issue

**Backend TODO:** Implement auto-issue of dev credential on login for verified devs.

Options:
- Post-login hook in Better Auth config
- Middleware that checks devVerified and issues credential if missing
- Called from the auth session endpoint

### 3. Moderation Visibility (Phase 10)

When a project is hidden/removed:
- Should author see a special message?
- Should there be an appeal flow?

Not spec'd in Phase 9, defer to Phase 10 polish.

---

## API Gaps Summary

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `PATCH /api/v1/users/me` | Update user display name | High |
| `GET /api/v1/admin/users` | Paginated user list for admin | Medium |
| `GET /api/v1/admin/projects` | All projects (any status) for admin | Medium |

### Backend TODOs (Non-API)

| Item | Description | Priority |
|------|-------------|----------|
| Auto-issue dev credential | Issue `slop_dev_cred` cookie on login for verified devs | Medium |

---

## Recommended Build Order

1. **Shared Components First**
   - VibeMeter
   - ProjectCard
   - VoteButtons
   - CommentThread
   - LoadingSkeleton

2. **Core Pages**
   - Feed (9.2) - gets the app usable
   - Submit (9.4) - enables content creation
   - Project Detail (9.3) - completes core loop

3. **User Features**
   - Favorites (9.5)
   - Settings (9.6) - requires API addition
   - Auth improvements (9.8)

4. **Admin**
   - Mod Queue (9.7)
   - User/Project management - requires API additions

5. **Polish**
   - Mobile nav (9.1)
   - SEO (9.10)
   - Dev credential UX
