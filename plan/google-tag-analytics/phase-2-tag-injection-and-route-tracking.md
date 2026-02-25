# Phase 2: Tag Injection + SPA Pageview Tracking

**Status:** Implemented (2026-02-25, pending runtime QA)  
**Owner:** Web  
**Depends On:** Phase 1

## Implementation Notes

- Added `GoogleAnalytics` client component at:
  - `/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx`
- Integrated component once in root layout:
  - `/Users/adam/code/slop.haus/apps/web/src/app/layout.tsx`
- Implemented route-change pageview dispatch using `usePathname()` + `useSearchParams()`.
- GA scripts are conditionally rendered only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is present.

## Goal

Load Google tag globally and emit pageview hits for both initial render and client-side route transitions in Next.js App Router.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx` (new)
- `/Users/adam/code/slop.haus/apps/web/src/app/layout.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/lib/analytics/gtag.ts` (if helper adjustments are needed)

## Tasks

1. Add client component `GoogleAnalytics` that returns `null` when no measurement ID is configured.
2. Use `next/script` to load:
   - `https://www.googletagmanager.com/gtag/js?id=...`
   - inline `gtag('js', new Date())` + `gtag('config', id, { send_page_view: false })`
3. Inside `GoogleAnalytics`, track route changes with `usePathname()` and `useSearchParams()` and call shared `pageview(...)`.
4. Mount `GoogleAnalytics` once in root layout so coverage includes all pages.
5. Keep existing `VisitorCounter` and API behavior untouched.

## Code Snippets (Conceptual)

```tsx
<Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
<Script id="ga-init" strategy="afterInteractive">
  {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });`}
</Script>
```

## Verification Checklist

- [x] No analytics scripts render when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset (by code path).
- [x] Analytics scripts render exactly once when env var is set (single root mount).
- [ ] Initial load sends one pageview.
- [ ] Client-side navigation sends one pageview per route change.
- [ ] No duplicate pageview spike from automatic + manual config.
- [x] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- GA tag is globally wired and App Router navigations are tracked consistently.
