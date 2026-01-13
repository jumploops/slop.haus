# Future Enhancements

## Infrastructure

- [ ] **Offload static assets to CDN** - Move `/uploads/*` (screenshots, etc.) to S3/R2/CloudFlare for better performance and scalability. Configure cache headers and CORS at the CDN level.

## Performance

- [ ] **Redis for rate limiting** - Replace in-memory rate limiting with Redis for multi-instance deployments (see `apps/api/src/routes/drafts.ts`)

## Monitoring

- [ ] **Structured metrics** - Replace console.log metrics with proper observability (DataDog, Prometheus, etc.)
- [ ] **Track LLM field edit rates** - Measure how often users edit auto-extracted fields to improve prompts

## Security

- [ ] **URL blocklist** - Add blocklist for URL shorteners and known spam domains (see `plan/url-first-onboarding/phase-8-polish.md` for reference implementation)
