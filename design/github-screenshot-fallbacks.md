# GitHub-Only Screenshot Fallbacks (Design Directions)

**Doc status:** Draft (for discussion)
**Date:** 2026-01-28
**Owner:** slop.haus team

## Goal
Make GitHub-only projects feel intentional and approachable in the feed + project page by providing a meaningful visual even when there is no live site (`mainUrl`).

## Current Implementation (Snapshot)

### Draft analysis pipeline (new submissions)
- **API entry:** `POST /api/v1/drafts/analyze` creates `enrichmentDrafts` row and queues `scrape_url` job. (`apps/api/src/routes/drafts.ts`)
- **Scraping:** `handleScrapeUrl` uses Firecrawl v2 with config based on URL type. GitHub/GitLab configs request **markdown only** (no screenshot). (`apps/worker/src/handlers/scrape-url.ts`, `apps/worker/src/lib/scrape-configs.ts`)
- **LLM extraction:** `handleAnalyzeContent` calls Anthropic (model: `claude-3-5-haiku-latest`) with scraped markdown + metadata. It extracts title, tagline, description, tools, and linked URLs (mainUrl + repoUrl). (`apps/worker/src/handlers/analyze-content.ts`, `apps/worker/src/lib/extraction-prompt.ts`)
- **Screenshot follow-up:** If the input URL is GitHub/GitLab and the LLM found a **different** `mainUrl`, the worker queues `scrape_screenshot` to capture a live-site screenshot. (`apps/worker/src/handlers/analyze-content.ts`, `apps/worker/src/handlers/scrape-screenshot.ts`)
- **Draft readiness:** For GitHub-only repos with **no mainUrl**, the draft becomes `ready` without any screenshot and the UI falls back to placeholder imagery. (`apps/web/src/lib/utils.ts`)

### Project enrichment (post-submission)
- **Project creation from draft:** If a draft already has a screenshot, it’s copied into `projectMedia`. (`apps/api/src/routes/drafts.ts`)
- **Enrichment jobs:** If no screenshot exists but `mainUrl` does, queue `enrich_screenshot`. If `repoUrl` exists, queue `enrich_readme`. (`apps/api/src/routes/drafts.ts`, `apps/api/src/routes/projects.ts`)
- **README enrichment:** Firecrawl markdown scrape on repo URL; optionally fills description. (`apps/worker/src/handlers/enrich-readme.ts`)
- **Screenshot enrichment:** Firecrawl screenshot of `mainUrl` → upload → `projectMedia`. (`apps/worker/src/handlers/enrich-screenshot.ts`)

### Resulting gap
If a project only has a GitHub repo and **no mainUrl**, we have **no screenshot source** (by design), so the UI uses a generic placeholder image. This is the gap to address.

---

## Design Directions (2–5)

### Direction 1: README Image Harvest ("Best Available Screenshot")
**Concept:** Parse README markdown, extract image URLs, pick the best candidate, and store as the project screenshot.

- **Data sources:** README markdown from Firecrawl (already in pipeline), `og:image` if present in metadata.
- **Selection heuristic:** First large image, or prefer images with keywords ("screenshot", "demo", "preview"). Optionally verify dimensions after download.
- **Pros:** Uses real project visuals; most OSS projects already include screenshots.
- **Cons:** Image quality and aspect ratios vary; many READMEs have badges/logos only.
- **Implementation impact:** Add a lightweight image selection step in `analyze_content` or a follow-up job (e.g. `extract_readme_image`).

### Direction 2: GitHub Social Preview ("Repo Card")
**Concept:** Use GitHub’s Open Graph/social preview image for the repo when no README screenshot exists.

- **Data sources:** Repo metadata + social preview URL; can be derived without scraping the repo page.
- **Pros:** Always available; visually consistent; low effort and fast.
- **Cons:** Looks like a GitHub card (less brand personality); not a real product UI.
- **Implementation impact:** Add repo metadata fetch (GitHub API or Open Graph URL) and store image as fallback if no README image is found.

### Direction 3: Dynamic Cover Image ("Generated Project Poster")
**Concept:** Generate a branded, deterministic image from repo details (name, author, tagline/description, tool tags, stars, last updated).

- **Data sources:** LLM extraction output + GitHub metadata (stars, language, owner avatar).
- **Rendering:** Server-side image generation (e.g., `satori` + `sharp`) to produce a 5:3 or 16:10 poster.
- **Pros:** Fully controllable aesthetic; consistent across the feed; good even when no images exist.
- **Cons:** Engineering effort; must avoid looking generic or repetitive.
- **Implementation impact:** New image pipeline + storage; render only when no real screenshot is available.

### Direction 4: README Snapshot ("Doc Preview")
**Concept:** Capture a cropped screenshot of the README section of the GitHub page (not the whole repo page), focusing on the first section and any images.

- **Data sources:** Firecrawl screenshot of GitHub with scroll/clip settings (if possible) or HTML rendering to image.
- **Pros:** Represents the project contextually; doesn’t require a live site.
- **Cons:** GitHub UI chrome; looks less like a product image; may violate “we don’t screenshot GitHub” intent.
- **Implementation impact:** Add a GitHub-only screenshot config that focuses on README region (if supported).

### Direction 5: Hybrid Fallback Ladder
**Concept:** Combine directions into a **fallback order** to maximize quality:

1. Screenshot from `mainUrl` (current behavior)
2. README image harvest (Direction 1)
3. GitHub social preview (Direction 2)
4. Dynamic cover (Direction 3)
5. Existing placeholder image

- **Pros:** Highest chance of a meaningful visual; predictable logic.
- **Cons:** More moving parts; requires clear precedence rules and caching.

---

## Decision Criteria
- **Visual quality:** Does the image feel like a product, not a placeholder?
- **Consistency:** Can we keep cards uniform in the feed?
- **Cost + latency:** Avoid heavy scraping or long job chains.
- **Reliability:** Works when README is sparse, private assets are blocked, or GitHub throttles.
- **Maintenance:** Prefer minimal API dependencies where possible.

## Open Questions
- Do we want to explicitly avoid GitHub UI screenshots (brand/product decision)?
- Is it acceptable to depend on GitHub API for repo metadata + social previews?
- Should dynamic covers adopt slop.haus branding or adapt to repo language/theme?
- What’s the minimum quality bar before showing a fallback instead of the current placeholders?

## Suggested Next Step
Pick **2–3 directions** to prototype behind a feature flag, then compare feed quality and job latency in staging.
