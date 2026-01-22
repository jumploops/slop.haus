# Phase 4 - Frontend UI and UX

Status: Completed

## Goals
- Replace dual-channel voting UI with likes
- Add review rating input for top-level comments
- Add comment upvotes and display
- Show slop score (review-based) separate from vibe percentile

## Files to Change
- `apps/web/src/components/project/ScoreWidget.tsx`
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/components/project/ProjectDetails.tsx`
- `apps/web/src/components/project/VoteButtons.tsx` (replace with LikeButton)
- `apps/web/src/hooks/useVote.ts` (replace with useLike)
- `apps/web/src/lib/api/votes.ts` (replace with likes API)
- `apps/web/src/app/page.tsx` (remove Normal/Dev channel toggles)
- `apps/web/src/components/comment/CommentForm.tsx`
- `apps/web/src/components/comment/CommentItem.tsx`
- `apps/web/src/components/comment/CommentThread.tsx`

## UI Changes

### Project Cards / Feed
- Replace score display with:
  - Like count
  - Slop score (avg review rating)
  - Vibe percentile (unchanged)
- Remove Normal/Dev channel toggle buttons

### Project Detail Sidebar
- Update ScoreWidget to show:
  - Slop score
  - Like button + count
  - Vibe percentile

### Reviews
- Top-level form shows rating slider (0-10) + text area
- Replies show text area only
- Each review shows rating badge + upvote button + count
- Replies show upvote button but no rating display

## API Client Updates
- Replace vote APIs with like APIs
- Add comment vote API
- Update project and comment types to reflect new fields

## Implementation Steps
1) Add `useLike` hook and update API client
2) Replace VoteButtons usage with LikeButton in ProjectCard/ScoreWidget
3) Update feed page to remove channel switcher
4) Update comment form to include rating for top-level reviews
5) Update comment item to show rating and upvote button
6) Ensure styling uses semantic tokens (no palette classes)

## Verification Checklist
- [ ] Like button toggles state and updates counts
- [ ] Review rating required for top-level review submission
- [ ] Reply form does not show rating
- [ ] Comment upvotes work for authenticated users
- [ ] Feed renders without channel toggles
