# Phase 7: Moderation System

## Goal
Two-stage moderation with LLM approval and user flagging.

## Tasks

### 7.1 LLM moderation service
Create moderation service that:
- Takes text content (title, tagline, description, etc.)
- Calls LLM API with classification prompt
- Returns structured result:
```typescript
{
  approved: boolean
  labels: string[]  // e.g., ['nsfw', 'spam', 'violence']
  confidence: number
  reason?: string
}
```

### 7.2 Stage 1: Synchronous moderation on submit
Update project creation flow:
1. Run moderation on title + tagline + description
2. Run moderation on URLs (check for known bad domains)
3. If all approved: publish immediately
4. If any flagged: set status='hidden', create mod queue item
5. Log moderation_event record

### 7.3 Stage 2: Async moderation post-enrichment
After enrichment job completes:
1. Create job type='moderate_async'
2. Worker runs moderation on:
   - Screenshot metadata/alt text
   - README content
3. If flagged: auto-hide project, create mod queue item
4. Log moderation_event record

### 7.4 User flagging API
```
POST /api/v1/flags
```
Request:
```typescript
{
  target_type: 'project' | 'comment'
  target_id: string
  reason: string  // e.g., 'nsfw', 'spam', 'harassment'
}
```

Logic:
- Requires auth
- Enforce unique constraint (can't flag same thing twice)
- Create flag record

### 7.5 Auto-hide on flag threshold
After flag created:
1. Count distinct flags for target
2. If count >= threshold (3):
   - Set target status='hidden'
   - Create mod queue item
   - Notify mods (later: email/webhook)

### 7.6 Mod queue API
```
GET /api/v1/admin/mod-queue?status=pending&type=project|comment|revision
```
- Requires admin/mod role
- Return items needing review with:
  - Target content
  - Flag count and reasons
  - Moderation event results
  - Author info

### 7.7 Mod actions API
```
POST /api/v1/admin/projects/:id/approve
POST /api/v1/admin/projects/:id/hide
POST /api/v1/admin/projects/:id/remove
POST /api/v1/admin/comments/:id/approve
POST /api/v1/admin/comments/:id/remove
```

Actions:
- `approve`: status='published', clear from queue
- `hide`: status='hidden' (soft, reversible)
- `remove`: status='removed' (hard, requires reason)

### 7.8 Content policy enforcement
- NSFW: always hide immediately
- Illegal: always hide + escalate (log for review)
- Copyright: hide + queue (may be false positive)
- Spam: hide + queue

### 7.9 Mod dashboard (frontend)
- Queue list with filters
- Review interface with content preview
- Quick action buttons
- History of mod actions

## Dependencies
- Phase 3 (projects)
- Phase 5 (comments)
- Phase 6 (enrichment triggers stage 2)

## Output
- Content is screened by LLM before publish
- Users can flag inappropriate content
- Mods have tools to review and act on flagged content
- Clear audit trail of moderation decisions
