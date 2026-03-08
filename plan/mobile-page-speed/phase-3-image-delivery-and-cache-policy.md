# Phase 3: Image Delivery + Cache Policy

**Status:** Planned  
**Owner:** Web + API  
**Depends On:** Phase 2

## Goal

Eliminate wasted mobile image bytes, improve feed thumbnail delivery, and close the gap behind the current cache-lifetime audit.

This phase addresses two related problems:

1. images that should not be fetched on mobile
2. images that are fetched but are not cached or sized efficiently

## Files To Change

- [/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx)
- possible shared image consumers if the same pattern is reused:
  - [/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectDetails.tsx](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectDetails.tsx)
  - [/Users/adam/code/slop.haus/apps/web/src/components/submit/EditableProjectPreview.tsx](/Users/adam/code/slop.haus/apps/web/src/components/submit/EditableProjectPreview.tsx)
- [/Users/adam/code/slop.haus/apps/web/next.config.ts](/Users/adam/code/slop.haus/apps/web/next.config.ts)
- [/Users/adam/code/slop.haus/apps/api/src/index.ts](/Users/adam/code/slop.haus/apps/api/src/index.ts)
- possible supporting touch:
  - [/Users/adam/code/slop.haus/apps/api/src/lib/storage.ts](/Users/adam/code/slop.haus/apps/api/src/lib/storage.ts)
  - [/Users/adam/code/slop.haus/apps/web/src/lib/utils.ts](/Users/adam/code/slop.haus/apps/web/src/lib/utils.ts)

## Recommended Strategy

1. Stop rendering hidden mobile thumbnails at all in list mode.
2. Move visible feed thumbnails onto a real responsive-loading path.
3. Add explicit cache policy for uploaded screenshots that matches actual URL mutability.
4. Verify production image host configuration so optimized loading is usable outside local dev.

## Tasks

1. Update feed-card markup so mobile-hidden list thumbnails are not present in the DOM on mobile initial render.
2. Convert visible feed thumbnails to `next/image` or an equivalent responsive strategy with:
   - intrinsic dimensions
   - correct `sizes`
   - lazy loading for non-critical images
   - `decoding="async"` where appropriate
3. Ensure the first visible card or hero image path does not accidentally become over-lazy if it is the LCP candidate after Phase 2.
4. Review placeholder/static images used as fallbacks and confirm they are not unusually large for their rendered size.
5. Lock upload caching strategy:
   - use long-lived immutable caching only if URLs are versioned/unique
   - otherwise choose a shorter TTL plus revalidation behavior
6. Add the chosen `Cache-Control` policy to local/static upload serving in the API runtime.
7. Confirm `next.config.ts` covers the real production media host, not just localhost.
8. Re-run Lighthouse/Network checks to confirm the transfer-size and cache-lifetime audits improve materially.

## Design Notes

- The current `hidden sm:block` pattern is especially suspicious because it can hide bytes without preventing requests.
- Responsive image work should be based on the actual rendered card sizes in list vs grid modes.
- If upload URLs are mutable, do not mark them `immutable` just to satisfy Lighthouse.

## Code Snippets

```tsx
// apps/web/src/components/project/ProjectCard.tsx (conceptual)
{showThumbnail ? (
  <Image
    src={thumbnailUrl}
    alt={project.title}
    fill
    sizes="(max-width: 639px) 0px, (max-width: 1024px) 192px, 256px"
  />
) : null}
```

```ts
// apps/api/src/index.ts (conceptual)
c.header("Cache-Control", "public, max-age=31536000, immutable");
```

## Verification Checklist

- [ ] Mobile no longer requests thumbnails that are visually hidden in list mode.
- [ ] Visible feed thumbnails use responsive sizing instead of raw unbounded `<img>` tags.
- [ ] Cache headers for uploaded screenshots are explicit and match the selected mutability strategy.
- [ ] Production media-host configuration is valid for the chosen image-loading path.
- [ ] Lighthouse cache-lifetime and transfer-size findings improve materially.
- [ ] No new card-layout or CLS regressions are introduced on desktop or mobile.

## Risks / Watchpoints

1. `next/image` adoption can fail if remote host configuration is incomplete.
2. Incorrect `sizes` values can still lead to larger-than-needed downloads.
3. Immutable caching is unsafe if screenshot URLs can be overwritten in place.

## Exit Criteria

- Image transfer on mobile is materially smaller and better aligned with what is actually visible.
- Screenshot delivery is backed by an explicit, defensible cache policy.
- Feed cards remain visually correct across list/grid variants and breakpoints.

