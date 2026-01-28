# GitHub Screenshot Hybrid Fallbacks

**Status:** Draft
**Date:** 2026-01-28
**Owner:** slop.haus team

## Overview
GitHub-only submissions (no `mainUrl`) currently land with placeholder imagery. We want a clearer, more approachable visual for these projects by adding a **hybrid fallback ladder**:

1. **Main URL screenshot** (existing behavior)
2. **README image extractor** (best real project visuals)
3. **GitHub social graph image** (reliable last resort)

This spec covers the worker pipeline changes, storage behavior, and minimal schema updates needed to support the fallback ladder.

## Goals
- Provide a meaningful visual for GitHub-only projects without a live site.
- Keep the draft review experience intact (screenshot visible before submit).
- Minimize latency; treat all new steps as best-effort.
- Track media source accurately in `project_media`.

## Non-Goals
- Screenshotting GitHub repo pages directly.
- Full README content analysis beyond image selection.
- Adding new UI components or changing card layouts.

## Current Flow (Relevant)
- GitHub/GitLab scraping uses markdown-only Firecrawl config.
- LLM extraction runs in `handleAnalyzeContent` and queues `scrape_screenshot` if a different `mainUrl` is found.
- GitHub-only repos with no `mainUrl` end in `ready` without a screenshot.

## Proposed Fallback Logic
**When input URL is GitHub/GitLab and `mainUrl` is missing**:
1. Extract README images from Firecrawl markdown.
2. Pick best candidate (basic heuristics + size check).
3. Download + upload to storage → set `draft.screenshotUrl`.
4. If no suitable image, derive GitHub social graph image URL → download + upload → set `draft.screenshotUrl`.

If a `mainUrl` exists, keep the existing Firecrawl screenshot path (no change).

## Data + Schema Changes
- **`project_media.media_source` enum**: add `readme_image` and `github_og`.
- **Drafts**: keep `screenshotUrl` only (no new column unless we want draft-level source tracking).

## Phases
| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Discovery + helper utilities | In Progress |
| 2 | README image extraction in draft pipeline | In Progress |
| 3 | GitHub social graph fallback + submission wiring | In Progress |

## Dependencies / Risks
- README image URLs may be relative or behind auth → need robust URL normalization and safety checks.
- GitHub OG endpoint behavior should be verified (rate limits, caching, format).
- Storage path + public URL must already be consistent (see `debug/screenshot-not-displaying.md`).

## Verification (High-Level)
- GitHub-only repo with README screenshot shows image on draft review.
- Repo with no README images shows GitHub social graph fallback.
- Repos with `mainUrl` still use live-site screenshots.
- Project submission stores `project_media` with correct `source`.
