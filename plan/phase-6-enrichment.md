# Phase 6: Enrichment & Background Jobs

## Goal
Async enrichment using Firecrawl for screenshots and README extraction.

## Tasks

### 6.1 Background job worker
- Create worker process that polls `jobs` table
- Claim job by setting status='processing' + started_at
- Process job based on type
- On success: status='completed', completed_at
- On failure: increment attempts, set error, reschedule or mark failed

Run as separate process: `pnpm run worker`

### 6.2 Job creation on submit
When project is created:
- If `main_url` exists: create job type='enrich_screenshot'
- Else if `repo_url` exists: create job type='enrich_readme'
- Set run_at = now (immediate)

### 6.3 Firecrawl integration

**Screenshot enrichment:**
```typescript
POST https://api.firecrawl.dev/v1/scrape
{
  url: project.main_url,
  formats: ['screenshot'],
  screenshotOptions: {
    fullPage: false,
    width: 1280,
    height: 800
  }
}
```
- On success: upload screenshot to object storage
- Create project_media record with source='firecrawl'

**README extraction:**
```typescript
POST https://api.firecrawl.dev/v1/scrape
{
  url: project.repo_url,
  formats: ['markdown']
}
```
- Parse README content
- Store excerpt in project.description if empty
- Optionally store full markdown in project_media

### 6.4 Object storage abstraction
- Create storage interface (S3-compatible)
- For MVP: local filesystem or Cloudflare R2
- Upload images, return public URL

### 6.5 Enrichment webhook/callback (optional)
- Firecrawl supports async mode with webhooks
- For MVP: synchronous calls in worker are fine
- Later: add webhook endpoint for Firecrawl callbacks

### 6.6 Re-enrichment support
- Add "refresh" action that creates new enrichment job
- Useful when project URL changes
- Cooldown: max once per hour

### 6.7 Enrichment status on project
- Add `enrichment_status` field: 'pending' | 'completed' | 'failed'
- UI shows loading state for screenshots

## Dependencies
- Phase 3 (projects exist)

## Output
- Projects get screenshots automatically after submission
- README fallback for repo-only projects
- Background worker processes jobs reliably
- Media stored and served from object storage
