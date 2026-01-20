# Phase 5: Threaded Comments

## Goal
HN-style threaded comments requiring authentication.

## Tasks

### 5.1 Create comment API
```
POST /api/v1/projects/:slug/comments
```
Request:
```typescript
{
  body: string
  parent_comment_id?: string  // null for top-level
}
```

Logic:
- Requires auth (Google or GitHub)
- Validate body length (min 1, max 10000 chars)
- If parent_comment_id:
  - Verify parent exists and belongs to same project
  - Set depth = parent.depth + 1
  - Enforce max depth (e.g., 10)
- Create comment record

### 5.2 List comments API
```
GET /api/v1/projects/:slug/comments
```
Response: flat list with threading info
```typescript
{
  comments: [{
    id: string
    body: string
    parent_comment_id: string | null
    depth: number
    author: {
      id: string
      name: string
      image: string
      dev_verified: boolean
    }
    created_at: string
    updated_at: string
  }]
}
```

### 5.3 Comment retrieval strategy
**MVP approach:** Single query returning all comments for a project, sorted by:
- `depth ASC, created_at ASC`

Client builds tree structure.

**If needed later:** Materialized path or recursive CTE for server-side tree building.

### 5.4 Edit comment API
```
PATCH /api/v1/comments/:id
```
- Requires auth + must be author
- Update body
- Set updated_at
- Maybe: add "edited" flag for UI

### 5.5 Delete comment API
```
DELETE /api/v1/comments/:id
```
- Requires auth + must be author (or mod/admin)
- Soft delete: set status='removed'
- Keep in tree (shows "[removed]" placeholder if has children)

### 5.6 Comment count on projects
- Add `comment_count` field to projects table (denormalized)
- Increment on comment create
- Decrement on comment delete (if was visible)

### 5.7 Frontend comment tree component
- Recursive component for nested display
- Indentation based on depth
- "Reply" button opens inline form
- Collapse/expand threads
- Show "Verified dev" badge next to author name

## Dependencies
- Phase 2 (auth required for commenting)
- Phase 3 (projects exist)

## Output
- Authenticated users can comment on projects
- Comments are threaded with arbitrary depth
- Authors can edit/delete their comments
- Dev verification badge displays on comments
