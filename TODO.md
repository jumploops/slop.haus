# TODO

Future enhancements, fixes, and improvements.

---

## Bugs & Issues

- [ ] **Rate limit memory leak** - `analysisLimits` Map in `apps/api/src/routes/drafts.ts` is never cleaned up. Old timestamps accumulate. Add periodic cleanup or use a TTL cache.

- [ ] **Tool matching false positives** - `ilike(tools.slug, '%${term}%')` in `tool-matching.ts` causes issues (e.g., "go" matches "django", "mongodb"). Use exact match or bounded wildcards.

- [ ] **SSE connection cleanup** - If client disconnects mid-poll, the SSE endpoint continues polling the database for up to 2 minutes. Add abort signal handling.

---

## Missing Features

- [ ] **Resume failed drafts** - Users currently can't retry a failed draft without starting over. Add a "Retry" button that re-queues scrape job.

- [ ] **Draft listing UI** - No UI to see pending/failed drafts. Users can't resume interrupted analyses. Add `/submit/drafts` page using `GET /api/v1/drafts`.

- [ ] **Rate limit visibility** - Users don't know how many analyses they have left. Return `remaining` count in rate limit error and show in UI.

- [ ] **Duplicate URL detection** - Same URL can be submitted multiple times by the same user. Check for existing draft/project with same URL.

- [ ] **Manual pre-publish LLM check flow** - Before publishing manual submissions, run the same standalone analyzing view used by URL/Repo submissions (no tabs/back during analysis) and only proceed to publish after the check completes.

- [ ] **Fixture user for seeding/tests** - Add an optional seed user for quick local logins and test flows.

- [ ] **Anonymous user actions (future)** - Expand anonymous accounts beyond visitor counting so anon sessions can like/comment (with anti-abuse controls like Captcha/Turnstile/rate limits) while still supporting seamless anon → real account linking/migration.

- [ ] **Field save indicator** - No visual feedback when auto-saving fields on blur. Add "Saving..."/"Saved" indicator.

- [ ] **Character counts** - No character count indicators on title (255), tagline (500), description (10000) inputs.

- [ ] **Discard confirmation** - "Start Over" button discards without confirmation. Add modal for confirmation.

- [ ] **Admin tag alias/merge tooling (deferred)** - Add admin UI/workflow to merge duplicate technology tags and manage aliases after open tag creation ships. Context: `design/project-tags-open-taxonomy.md`.

---

## Performance

- [ ] **Redis for rate limiting** - In-memory rate limiting doesn't work across multiple API instances. Migrate to Redis sorted sets.

- [ ] **PostgreSQL LISTEN/NOTIFY for SSE** - Currently polling every 1s. Use NOTIFY when draft status changes to eliminate polling.

- [ ] **Cache tool list** - `TagEditor` fetches all tools on every mount. Cache in SWR with longer TTL, or prefetch.

- [ ] **Cache tool matching** - `matchToolsToDatabase` queries DB on every analysis. Cache the slug→id mapping.

- [ ] **Offload static assets to CDN** - Move `/uploads/*` to S3/R2/CloudFlare. Configure cache headers and CORS at CDN level.

---

## Security

- [ ] **URL blocklist expansion** - Add more URL shorteners (bit.ly, t.co, etc.) and known spam domains to `url-validation.ts`.

- [ ] **Adopt npm profanity package for tool/tag creation (deferred)** - Evaluate and integrate a maintained profanity library for server-side new-tag moderation while keeping DB `tools.status` as source of truth. Investigation: [Profanity package investigation](debug/profanity-package-investigation.md).

- [ ] **Rate limit SSE connections** - No limit on concurrent SSE connections per user. Could exhaust server resources.

- [ ] **Screenshot fetch timeout** - Fetching Firecrawl screenshot URLs has no timeout. Add `AbortController` with 30s timeout.

- [ ] **Stricter LLM response parsing** - Currently uses regex to find JSON in response. Could fail on malformed responses. Add JSON schema validation with zod.

- [ ] **Validate screenshot URLs** - Before storing screenshot URL, verify it's accessible and is actually an image.

---

## Code Quality

- [ ] **Worker runtime: move from tsx to compiled JS** - Refactor production worker startup to use `node dist/index.js` instead of `tsx src/index.ts`. Required follow-up:
  - Fix ESM import resolution in worker build output (missing `.js` extensions)
  - Build and export `@slop/db` and `@slop/shared` as runtime JS artifacts
  - Update Render start command to use compiled worker output
  - Verify prod startup with environment-only config (no dotenv)

- [ ] **Move tool aliases to database** - Hardcoded `TOOL_ALIASES` in `tool-matching.ts` should be a database table for easier management.

- [ ] **Version LLM prompts** - Store prompt versions for A/B testing and rollback. Track which version generated each extraction.

- [ ] **Form library for DraftReview** - Component has 7+ pieces of local state. Consider react-hook-form or similar.

- [ ] **Consistent error codes** - Some endpoints return string errors, others return codes. Standardize across all draft endpoints.

- [ ] **Remove unsafe type casts** - Several `as` casts in handlers (e.g., `payload as ScrapeUrlPayload`). Add runtime validation with zod.

---

## UX Improvements

- [ ] **Autosave indicator** - Show "Saving..." / "Saved ✓" when fields are saved on blur.

- [ ] **Preview before submit** - Let users preview how their project will appear on the site before submitting.

- [ ] **Progress within steps** - AnalysisProgress only shows step completion, not progress within steps. Add percentage or spinner.

- [ ] **Keyboard shortcuts** - Add Cmd+Enter to submit, Escape to cancel editing inline fields.

- [ ] **Empty state for TagEditor** - Show placeholder text when no tools detected: "No technologies detected - add some!"

- [ ] **URL validation feedback** - Show real-time validation as user types URL (debounced), not just on submit.

- [ ] **Display mode A/B test** - Randomize default feed display mode and measure engagement.

- [ ] **Username change cooldown/rate limit** - Add policy guardrails for frequent username changes (for example: max N changes per 24h or a 7-day cooldown), with clear in-product messaging.

- [ ] **Username history for moderation** - Track username change history for abuse investigations and moderator tooling.

---

## Monitoring & Observability

- [ ] **Structured metrics** - Replace console.log with proper metrics (DataDog, Prometheus). Track:
  - Analysis success/failure rates by URL type
  - Scrape/analyze duration histograms
  - LLM token usage per analysis
  - Field edit rates (how often users modify extracted values)
  - Screenshot fallback usage (README image vs GitHub OG vs Firecrawl)

- [ ] **Admin observability page** - Add a general observability page to the admin view with worker metrics (queue depth, job age, failures) and API health summaries.

- [ ] **Error alerting** - Send alerts on repeated failures, API errors, or unusual patterns.

- [ ] **LLM accuracy tracking** - Log original extracted values vs final submitted values to measure prompt quality.

---

## Testing

- [ ] **Unit tests: URL detection** - Test all URL types, edge cases, malformed URLs.

- [ ] **Unit tests: Tool matching** - Test alias resolution, partial matches, empty input.

- [ ] **Unit tests: LLM response parsing** - Test valid JSON, markdown-wrapped JSON, invalid responses.

- [ ] **Integration tests: Draft flow** - Test create → scrape → analyze → edit → submit pipeline.

- [ ] **E2E tests: Browser flow** - Test full user journey in Playwright/Cypress.

---

## Documentation

- [ ] **API documentation** - Document all `/api/v1/drafts/*` endpoints with request/response schemas.

- [ ] **Architecture diagram** - Visual diagram of scrape → analyze → submit flow.

- [ ] **Deployment guide** - Document required env vars, database migrations, worker setup.

---

## Future Ideas

- [ ] **Bulk URL analysis** - Let users submit multiple URLs at once for batch processing.

- [ ] **URL suggestions** - Auto-suggest related URLs (e.g., npm package → GitHub repo).

- [ ] **Smart screenshot cropping** - Use AI to crop screenshots to the most interesting part.

- [ ] **GitHub OAuth integration** - For GitHub URLs, fetch additional data via GitHub API (stars, language, etc.).

- [ ] **Scheduled re-scraping** - Periodically re-scrape project URLs to update screenshots and detect dead links.

- [ ] **Suggest GitHub-handle adoption after linking** - If a Google-first user links GitHub, offer one-click switch to their GitHub handle when available.

- [ ] **User-submitted tools** - Allow users to suggest new tools/technologies not in the database. Requires:
  - Tool submission form (name, slug, optional icon URL)
  - Moderation flow for new tool names (flag overt dangerous/illegal/NSFW terms)
  - Admin approval queue for pending tools
  - Most legitimate tech tools should auto-approve; only flag clear violations
  - Consider reusing existing text moderation with tool-specific prompt
