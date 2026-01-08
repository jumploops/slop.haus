# Phase 8: Edit Staging & Revisions

## Goal
Authors can edit projects; edits go through staging and re-moderation.

## Tasks

### 8.1 Create revision on edit
Update `PATCH /api/v1/projects/:slug`:
- Instead of direct update, create `project_revision` record
- Store only changed fields (or full snapshot)
- Set status='pending'
- Trigger moderation

### 8.2 Revision moderation
On revision create:
1. Run Stage 1 moderation on changed fields
2. If approved:
   - Apply changes to project
   - Set revision status='approved'
   - Update project.last_edited_at
3. If flagged:
   - Keep revision as pending
   - Create mod queue item
   - Project stays unchanged (old content live)

### 8.3 Revision review API
```
GET /api/v1/admin/revisions?status=pending
POST /api/v1/admin/revisions/:id/approve
POST /api/v1/admin/revisions/:id/reject
```

Approve:
- Apply revision changes to project
- Set revision status='approved'
- Update last_edited_at

Reject:
- Set revision status='rejected'
- Optionally notify author with reason

### 8.4 Author view of pending edits
```
GET /api/v1/projects/:slug/revisions
```
- Returns author's revision history
- Shows status of pending edits

### 8.5 UI: "Update pending" badge
On project page:
- If author has pending revision: show badge
- If viewer is author: show "Edit pending review" message

### 8.6 Diff view for mods
- Show side-by-side or inline diff of changes
- Highlight what's new vs what's being replaced
- Make review faster

### 8.7 Auto-approve for trusted authors (future)
- Skip moderation if author has X approved edits
- Or if changes are minor (typo fixes)
- Flagged authors always go through review

## Dependencies
- Phase 3 (project CRUD)
- Phase 7 (moderation system)

## Output
- Authors can submit edits without breaking live content
- Edits are moderated before going live
- Mods can approve/reject revisions
- Clear visibility into edit status
