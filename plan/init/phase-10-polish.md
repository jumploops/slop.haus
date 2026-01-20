# Phase 10: Performance, Security & Polish

## Goal
Production hardening, caching, and security measures.

## Tasks

### 10.1 Database indexing
- Index on projects: slug, status, created_at, normal_score, dev_score
- Index on comments: project_id, parent_comment_id
- Index on votes: project_id + rater_type + rater_key_hash
- Index on jobs: status, run_at
- Analyze query plans, add indexes as needed

### 10.2 Feed caching
- Cache computed hot feed in Redis (or in-memory)
- TTL: 1-5 minutes
- Invalidate on significant vote changes
- Edge cache (CDN) for public feeds

### 10.3 Hot score precomputation
- Background job to compute hot scores periodically
- Store precomputed score on project record
- Reduces read-time computation

### 10.4 Rate limiting
- Edge rate limiting (Cloudflare/WAF)
- API rate limits per endpoint:
  - Vote: 30/min per rater
  - Submit: 5/hour per user
  - Comment: 30/min per user
- Return appropriate 429 responses

### 10.5 Vote abuse detection
- Track voting patterns
- Detect: mass voting, rapid toggling, coordinated attacks
- CAPTCHA gate for suspicious traffic (Turnstile)
- Shadow-ban capability for bad actors

### 10.6 Security headers
- CSP, HSTS, X-Frame-Options
- CORS configuration
- Cookie security (HttpOnly, Secure, SameSite)

### 10.7 Input validation hardening
- Zod schemas for all inputs
- URL validation (no javascript:, data:, etc.)
- XSS prevention in markdown rendering
- SQL injection prevention (Drizzle parameterizes)

### 10.8 Error handling
- Consistent error response format
- No stack traces in production
- Error logging with context
- User-friendly error messages

### 10.9 Monitoring and logging
- Structured logging (JSON)
- Request tracing
- Error alerting
- Performance metrics (response times, DB query times)

### 10.10 Deployment configuration
- Docker/container setup
- Environment variable management
- Health check endpoints
- Graceful shutdown handling

### 10.11 Anonymous credential research
- Investigate Cloudflare Privacy Pass / ACT
- Design integration points if viable
- Document findings for future phase

## Dependencies
- All previous phases

## Output
- Production-ready application
- Good performance under load
- Security best practices implemented
- Monitoring and observability in place
