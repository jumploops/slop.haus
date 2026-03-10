# Mobile Page Speed Deferred Work

**Status:** Active  
**Last Updated:** 2026-03-09  
**Owner:** Web + API

## Purpose

Track items that were not completed during the first mobile-performance pass, were intentionally deferred based on current measurements, or still need explicit verification before the work can be considered closed.

## Pending Verification

### 1. Post-change forced-reflow trace attribution

- Status: not yet re-traced after the Phase 2 and Phase 4 changes
- Why it is still open:
  - `SlopGoo` was confirmed as a contributor in the baseline investigation
  - the dominant late-LCP path is fixed, but we have not yet captured a fresh trace to prove the original forced-reflow signal is materially reduced
- Next step:
  - capture a new Chrome performance trace for `/` on mobile
  - confirm whether intro/consent/SlopGoo work still appears in the forced-layout hotspot list

### 2. Live S3 cache-header verification for historical screenshot objects

- Status: not yet refreshed
- Why it is still open:
  - new uploads now receive immutable cache headers in code
  - previously uploaded S3 objects keep their old metadata until re-uploaded or explicitly updated
- Next step:
  - refresh metadata or re-upload at least one live screenshot used on `/`
  - verify the response includes `Cache-Control: public, max-age=31536000, immutable`

### 3. Desktop and Lighthouse/PSI reruns

- Status: not yet rerun in this phase set
- Why it is still open:
  - local Chrome mobile measurements are strong enough to guide implementation
  - they do not replace an updated Lighthouse/PSI before/after record for mobile and desktop
- Next step:
  - rerun Lighthouse or PSI for `/` on both mobile and desktop
  - record exact dates, environment, and resulting metrics in Phase 5

### 4. Manual QA matrix

- Status: not completed
- Why it is still open:
  - we validated key mobile paths with automated measurement
  - we have not yet manually walked the full matrix across intro state, slop mode, consent state, and desktop behavior
- Next step:
  - execute the matrix in [phase-5-verification-and-regression-guardrails.md](/Users/adam/code/slop.haus/plan/mobile-page-speed/phase-5-verification-and-regression-guardrails.md)

## Deferred Implementation Work

### 1. Shared auth/session boot reduction

- Status: deferred to a possible second Phase 4 pass
- Why it was deferred:
  - the first Phase 4 pass already removed the larger `like-state` and visitor-count storm
  - the remaining network signal is now mostly shared auth/session boot rather than per-card churn
- Current evidence:
  - warm local mobile runs still show `3` `GET /api/auth/get-session` requests plus one anonymous sign-in `OPTIONS` and `POST`
- Next step:
  - audit `useSession()` consumers in header, mobile nav, auth buttons, and feed-shell surfaces
  - decide whether further delay/server-seeding is worth the added complexity

### 2. Wider feed-adjacent image cleanup

- Status: deferred
- Why it was deferred:
  - the measured root feed path is already clean on mobile after Phase 3
  - other `<img>` surfaces still exist, but they were not part of the first measured bottleneck
- Examples:
  - [ProjectDetails.tsx](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectDetails.tsx)
  - [EditableProjectPreview.tsx](/Users/adam/code/slop.haus/apps/web/src/components/submit/EditableProjectPreview.tsx)
- Next step:
  - only pursue if desktop/manual QA or Lighthouse still points to these surfaces

## Explicitly Skipped For This Pass

### 1. Server-side feed caching changes

- Status: intentionally skipped
- Why it was skipped:
  - local evidence never supported the `web -> api` SSR bootstrap path as the first-order bottleneck
  - changing cache semantics would introduce freshness tradeoffs without current proof of meaningful gain
- Re-entry condition:
  - only revisit if later production-relevant timing shows server TTFB is a real contributor

### 2. Broad JS modernization or whole-site redesign

- Status: intentionally skipped
- Why it was skipped:
  - the measured issues were specific to above-the-fold rendering, hidden images, cache policy, and client boot fan-out
  - broad modernization would expand scope without improving the immediate verification story

## Re-entry Order

1. Finish Phase 5 verification: Lighthouse/PSI, desktop check, manual QA, and a fresh forced-reflow trace.
2. Refresh one live S3 screenshot object and verify its cache headers.
3. If first-load auth/session work still matters after verification, continue with a second Phase 4 pass focused on session consumers.
