# Phase 9: Frontend (Next.js)

## Goal
Build the web application with all user-facing pages.

## Tasks

### 9.1 Layout and navigation
- Root layout with header/footer
- Header: logo, nav links, auth buttons
- Mobile responsive navigation
- Theme: clean, minimal, slightly irreverent

### 9.2 Home page / Feed (`/`)
- Tab bar: Hot | New | Top
- Toggle: Normal vs Dev ranking
- Time window selector for Top (24h, 7d, 30d, all)
- Project cards in feed:
  - Title, tagline
  - Screenshot thumbnail (or placeholder)
  - Score display (both channels)
  - Vibe meter (visual bar)
  - Vote buttons (up/down)
  - Comment count
- Infinite scroll or pagination
- Loading skeletons

### 9.3 Project page (`/p/:slug`)
- Full project details
- Large screenshot/media
- Score widget showing both channels:
  - "People: +X / -Y"
  - "Devs: +X / -Y"
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

### 9.4 Submit page (`/submit`)
- Requires auth + GitHub linked
- Form fields:
  - Title (required)
  - Tagline (required)
  - Description (optional, markdown)
  - Live URL (optional)
  - Repo URL (optional)
  - Validation: at least one URL required
- Vibe input:
  - Mode toggle: Overview vs Detailed
  - Overview: single slider 0-100%
  - Detailed: multiple sliders, computed result
- Tools selector (autocomplete/tags)
- Preview before submit
- Submit → redirect to project page

### 9.5 Favorites page (`/favorites`)
- Requires auth
- List of favorited projects
- Remove from favorites button

### 9.6 Settings pages (`/settings/*`)
- `/settings/profile`: name, image
- `/settings/connections`: linked OAuth providers
  - Show connected accounts
  - Link/unlink buttons
  - GitHub required notice for submissions

### 9.7 Admin pages (`/admin/*`)
- `/admin/mod-queue`: moderation queue
- `/admin/users`: user management, dev verification
- `/admin/projects`: project management
- Access control: admin/mod role required

### 9.8 Auth flows
- Login modal/page with Google/GitHub options
- Post-login redirect handling
- "Link account" flow from settings
- Logout

### 9.9 Vote interaction
- Optimistic UI updates
- Cookie handling for rater identity
- Visual feedback for current vote state
- Rate limit error handling

### 9.10 SEO and meta
- Dynamic meta tags per page
- Open Graph images
- Sitemap generation

## Dependencies
- All API phases (2-8)

## Output
- Fully functional web application
- All core user flows working
- Responsive design
- Good UX with loading states and error handling
