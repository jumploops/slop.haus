# Phase 9.5: Enrichment Validation & Testing

## Status: ✅ Complete (2026-01-10)

**Key Fixes Applied:**
1. **Firecrawl v2 API** - Updated to handle URL-based screenshots (not base64)
   - Response contains `data.screenshot` as URL, not base64 string
   - Handler now fetches image from URL before saving
2. **Storage path mismatch** - Fixed by using absolute `STORAGE_LOCAL_PATH`
3. **Screenshots verified working** - PNG files saved correctly (1280x800)

See `debug/screenshot-storage-issues.md` for detailed investigation.

---

## Goal
Validate the Phase 6 enrichment infrastructure works end-to-end once the frontend is complete, and establish automated tests to ensure ongoing reliability.

## Context
Phase 6 implemented:
- Background job worker (`apps/worker`)
- Firecrawl integration for screenshots and README extraction
- Local filesystem storage (MVP)
- Job creation on project submit
- Re-enrichment endpoint with cooldown

This phase validates that implementation and adds test coverage.

## Tasks

### 9.5.1 Manual E2E Validation
Once Phase 9 frontend is complete:
- [x] Create a project with `mainUrl` → verify screenshot captured
- [x] Create a project with only `repoUrl` → verify README extracted
- [x] Verify media records created in `project_media` table
- [x] Verify `enrichment_status` transitions: `pending` → `completed`
- [x] Verify screenshots accessible via `/uploads/*` route
- [ ] Test refresh endpoint respects 1-hour cooldown
- [x] Test job retry on failure (Firecrawl errors retry with backoff)

### 9.5.2 Worker Unit Tests
Create `apps/worker/src/__tests__/`:

```
worker.test.ts          - Job polling and claim logic
handlers/
  enrich-screenshot.test.ts
  enrich-readme.test.ts
lib/
  storage.test.ts       - Storage abstraction
  firecrawl.test.ts     - Firecrawl client (mocked)
```

Test cases:
- Job claiming is atomic (no double-processing)
- Failed jobs retry with exponential backoff
- Max attempts respected, then marked failed
- Stale "processing" jobs reset on worker startup
- Screenshot handler saves to storage and creates media record
- README handler extracts excerpt and updates description
- Storage generates unique keys and handles upload/delete

### 9.5.3 Integration Tests
Create integration tests that use a test database:

**Job Processing Flow:**
```typescript
// 1. Insert job into database
// 2. Run worker iteration
// 3. Verify job status = completed
// 4. Verify side effects (media record, project update)
```

**API Integration:**
```typescript
// 1. Create project via API
// 2. Verify job created
// 3. Process job
// 4. Fetch project, verify enrichment_status and media
```

### 9.5.4 Firecrawl Mocking Strategy
For tests, mock Firecrawl API responses:

**Note:** Firecrawl v2 returns screenshots as URLs, not base64!

```typescript
// Mock successful screenshot (v2 format - URL not base64!)
{
  success: true,
  data: {
    screenshot: "https://storage.googleapis.com/firecrawl-scrape-media/screenshot-xxx.png?...",
    metadata: {
      title: "Page Title",
      ogImage: "...",
      sourceURL: "https://example.com/"
    }
  }
}

// Mock successful README
{
  success: true,
  data: {
    markdown: "# Project\n\nThis is the project description..."
  }
}

// Mock failure scenarios
{
  success: false,
  error: "Rate limited"
}
```

### 9.5.5 Test Database Setup
- Use separate test database or transaction rollback
- Seed minimal data (user, project) for each test
- Clean up after tests

### 9.5.6 CI Integration
Add to CI pipeline:
```yaml
- name: Run worker tests
  run: pnpm --filter @slop/worker test

- name: Run integration tests
  run: pnpm test:integration
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

### 9.5.7 Production Storage Preparation
Document upgrade path from local storage to cloud:
- [ ] S3/R2 provider implementation
- [ ] Migration script for existing files
- [ ] Environment variable configuration
- [ ] CDN setup for media serving

## Testing Checklist

### Happy Path
- [x] Project with mainUrl gets screenshot
- [x] Project with repoUrl only gets README description
- [x] Project with both gets screenshot AND README (both jobs queued)
- [x] Screenshots display correctly in UI
- [ ] Refresh button triggers new enrichment

### Error Handling
- [ ] Firecrawl API error → job retries
- [ ] Firecrawl timeout → job retries
- [ ] Invalid URL → job fails gracefully
- [ ] Storage write error → job fails, no partial state
- [ ] Missing project → job fails with clear error

### Edge Cases
- [ ] Very long README → excerpt truncated properly
- [ ] README with no prose (just code) → graceful handling
- [ ] Large screenshot → storage handles it
- [ ] Concurrent job claims → no duplicates
- [ ] Worker crash → stale jobs recovered

### Rate Limiting
- [ ] Refresh within 1 hour → 429 response
- [ ] Refresh after 1 hour → new job created

## Dependencies
- Phase 9 complete (frontend with submit form)

## Output
- Confidence that enrichment works in production
- Automated tests prevent regressions
- Documentation for production storage upgrade
- CI pipeline includes enrichment tests
