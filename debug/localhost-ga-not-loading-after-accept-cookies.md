# Debug: GA Not Loading Locally After "Accept Cookies"

**Date:** 2026-02-27  
**Status:** Investigation complete (no code changes in this doc)  
**Scope:** `apps/web` local production behavior on `localhost`

## Problem Statement

In local production testing, after setting:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_COOKIE_BANNER_FORCE_GLOBAL`

the consent banner appears, but GA does not appear to load after clicking **Accept Cookies**.

## Expected Behavior From Current Code

1. `GoogleAnalytics` should only mount scripts when both conditions are true:
   - `GA_MEASUREMENT_ID` exists
   - `analyticsEnabled` is true
   - Reference: [`apps/web/src/components/analytics/GoogleAnalytics.tsx:52`](/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx:52 ), [`apps/web/src/components/analytics/GoogleAnalytics.tsx:118`](/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx:118 )
2. Clicking **Accept Cookies** should persist consent and emit an update event that flips analytics on.
   - Reference: [`apps/web/src/components/privacy/ConsentManager.tsx:84`](/Users/adam/code/slop.haus/apps/web/src/components/privacy/ConsentManager.tsx:84 )
3. On `localhost`, missing `cf-ipcountry` still results in `consentRequired=true` (safe mode), so banner can appear even without force-global.
   - Reference: [`apps/web/src/middleware.ts:30`](/Users/adam/code/slop.haus/apps/web/src/middleware.ts:30 )

## Investigation Findings

## 1) GA is hard-disabled when measurement ID is empty

`GA_MEASUREMENT_ID` is read from `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID`; if empty, GA effect exits immediately and script never renders.

- Reference: [`apps/web/src/lib/analytics/gtag.ts:13`](/Users/adam/code/slop.haus/apps/web/src/lib/analytics/gtag.ts:13 )
- Reference: [`apps/web/src/components/analytics/GoogleAnalytics.tsx:53`](/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx:53 )
- Reference: [`apps/web/src/components/analytics/GoogleAnalytics.tsx:118`](/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx:118 )

If this value is blank in the built client bundle, consent clicks will never load GA.

## 2) Consent flow itself appears correct

The accept path stores `analytics: "granted"` and emits `slop:cookie-consent-updated`, which `GoogleAnalytics` listens for.

- Reference: [`apps/web/src/components/privacy/ConsentManager.tsx:93`](/Users/adam/code/slop.haus/apps/web/src/components/privacy/ConsentManager.tsx:93 )
- Reference: [`apps/web/src/components/privacy/ConsentManager.tsx:98`](/Users/adam/code/slop.haus/apps/web/src/components/privacy/ConsentManager.tsx:98 )
- Reference: [`apps/web/src/components/analytics/GoogleAnalytics.tsx:96`](/Users/adam/code/slop.haus/apps/web/src/components/analytics/GoogleAnalytics.tsx:96 )

No obvious logic bug was found in the accept/reject event wiring.

## 3) Localhost banner appearance does not prove `FORCE_GLOBAL` is working

With no country header on localhost, middleware defaults to required consent. So seeing the banner locally does not confirm that `NEXT_PUBLIC_COOKIE_BANNER_FORCE_GLOBAL` is being read.

- Reference: [`apps/web/src/middleware.ts:28`](/Users/adam/code/slop.haus/apps/web/src/middleware.ts:28 )
- Reference: [`apps/web/src/middleware.ts:30`](/Users/adam/code/slop.haus/apps/web/src/middleware.ts:30 )

## 4) Strong evidence that build-time env controls GA ID

A controlled build attempt was run with:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST123456 NEXT_PUBLIC_COOKIE_BANNER_FORCE_GLOBAL=true pnpm -F @slop/web build
```

The build later failed due font network fetch restrictions in this sandbox, but generated server chunk output showed:

- `let h="G-TEST123456";` in `apps/web/.next/server/chunks/250.js`

This indicates the GA ID is compiled into artifacts during build.  
Implication: setting the env only for `start` (or only after building) is insufficient.

## 5) Build limitation encountered in this environment

Build failed here due blocked network access to Google Fonts (`getaddrinfo ENOTFOUND fonts.googleapis.com`), so full end-to-end runtime verification in this sandbox was not completed.

## Ranked Hypotheses

## H1 (Most likely): `NEXT_PUBLIC_GA_MEASUREMENT_ID` was not present for the build step

Symptoms match exactly:

- Banner works (independent of GA ID)
- Accept click works, but GA script never appears
- This happens when `GA_MEASUREMENT_ID === ""`

## H2: Built artifact is stale from an earlier build without GA env

If `next start` is launched without rebuilding after env updates, client bundle can still carry empty GA ID.

## H3: Browser extension/privacy blocking

Ad blockers or strict privacy tooling can block `googletagmanager.com` and `google-analytics.com`, even when app code is correct.

## H4: Env was set in a location/process not used by web build command

For example, env present in one shell/process but not the exact `pnpm -F @slop/web build` process.

## No-Code Verification Plan

1. Rebuild and start with env on both commands (same shell):

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX NEXT_PUBLIC_COOKIE_BANNER_FORCE_GLOBAL=true pnpm -F @slop/web build
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX NEXT_PUBLIC_COOKIE_BANNER_FORCE_GLOBAL=true pnpm -F @slop/web start
```

2. Before clicking accept, check browser console:
   - `window.gtag` should be `undefined`
3. Click **Accept Cookies**, then check:
   - `window.localStorage.getItem("slop:cookieConsent")` contains `"analytics":"granted"`
   - `window.gtag` becomes a function
   - Network shows `https://www.googletagmanager.com/gtag/js?id=...`
4. If still missing, disable ad blockers/privacy extensions and retest in clean profile/incognito.
5. Optional artifact sanity check (after build):
   - search `.next` for your measurement ID string to confirm it was compiled.

## Open Questions

1. How were env vars applied during local test (shell export, `.env` file, or only at runtime)?
2. Was `pnpm -F @slop/web build` rerun after adding `NEXT_PUBLIC_GA_MEASUREMENT_ID`?
3. Were browser extensions (uBlock/Brave Shields/etc.) enabled during test?
