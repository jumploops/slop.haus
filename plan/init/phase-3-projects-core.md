# Phase 3: Projects Core

## Goal
Basic project submission, listing, and detail views.

## Tasks

### 3.1 Slug generation
- Utility to generate URL-safe slugs from titles
- Handle collisions (append number or hash suffix)

### 3.2 Submit project API
```
POST /api/v1/projects
```
- Requires auth + GitHub linked
- Validate: title, tagline required
- Validate: at least one of main_url or repo_url
- Validate: vibe_mode and corresponding fields
- Generate slug
- Create project record with status='published' (moderation added in Phase 7)
- Return created project

Request body:
```typescript
{
  title: string
  tagline: string
  description?: string
  main_url?: string
  repo_url?: string
  vibe_mode: 'overview' | 'detailed'
  vibe_percent?: number  // required if overview
  vibe_details?: object  // required if detailed
  tools?: string[]  // tool slugs
}
```

### 3.3 Project listing API
```
GET /api/v1/projects?sort=hot|new|top&channel=normal|dev&window=24h|7d|30d|all&page=1&limit=20
```
- Filter by status='published'
- Sort implementations:
  - `new`: ORDER BY created_at DESC
  - `top`: ORDER BY {channel}_score DESC (with time window filter)
  - `hot`: Computed score (see 3.4)
- Return paginated results with total count

### 3.4 Hot ranking algorithm
Simple decay formula:
```
hot_score = score / (age_hours + 2)^gravity
```
Where gravity ~1.8 (tunable).

For MVP: compute on read. Later: precompute periodically.

### 3.5 Project detail API
```
GET /api/v1/projects/:slug
```
- Include author info (name, image, dev_verified)
- Include media (screenshots)
- Include tools
- Include vote counts (both channels)
- Include comment count

### 3.6 Update project API
```
PATCH /api/v1/projects/:slug
```
- Requires auth + must be author
- For MVP: direct update (revision system in Phase 8)
- Update last_edited_at

### 3.7 Delete project API
```
DELETE /api/v1/projects/:slug
```
- Requires auth + must be author (or admin)
- Soft delete: set status='removed'

### 3.8 Tools management
- Seed common tools (Next.js, React, Cursor, Claude, etc.)
- API to list tools for autocomplete
- Link tools to projects on submit

## Dependencies
- Phase 2 (auth middleware)

## Output
- Projects can be created by authenticated users with GitHub
- Feed endpoint returns paginated projects
- Project detail page has all needed data
