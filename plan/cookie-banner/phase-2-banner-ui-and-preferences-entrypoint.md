# Phase 2: Banner UI and Preferences Entrypoint

**Status:** Completed (2026-02-27)  
**Owner:** Web + Product  
**Depends On:** Phase 1

## Implementation Notes
- Added consent UI components:
  - `apps/web/src/components/privacy/CookieConsentBanner.tsx`
  - `apps/web/src/components/privacy/CookiePreferencesDialog.tsx`
  - `apps/web/src/components/privacy/ConsentManager.tsx`
  - `apps/web/src/components/privacy/PrivacyChoicesButton.tsx`
- Wired consent manager globally in `apps/web/src/app/providers.tsx`.
- Added persistent footer `Privacy choices` entrypoint in `apps/web/src/app/layout.tsx`.
- Implemented client-side consent interactions:
  - Accept/Reject from banner
  - Manage preferences modal with locked necessary cookies + analytics toggle
  - Persist choice to local storage using Phase 1 schema
  - Reopen preferences via global browser event trigger

## Goal
Implement the consent banner and preferences UX with a persistent global `Privacy choices` entrypoint, using the Phase 1 decision model.

## Files To Change
- `/Users/adam/code/slop.haus/apps/web/src/components/privacy/CookieConsentBanner.tsx` (new)
- `/Users/adam/code/slop.haus/apps/web/src/components/privacy/CookiePreferencesDialog.tsx` (new)
- `/Users/adam/code/slop.haus/apps/web/src/components/privacy/ConsentManager.tsx` (new)
- `/Users/adam/code/slop.haus/apps/web/src/app/providers.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/app/layout.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/layout/Header.tsx` (optional)

## Tasks
1. Build a client-side consent manager that:
   - reads region/consent context,
   - decides whether to show banner,
   - writes consent state to client storage.
2. Implement banner with required controls:
   - `Accept analytics`,
   - `Reject analytics`,
   - `Manage preferences`,
   - Privacy Policy link.
3. Implement preferences dialog:
   - necessary cookies = ON/locked,
   - analytics toggle controllable,
   - save/cancel behavior.
4. Add persistent `Privacy choices` entrypoint in footer (or equivalent global location).
5. Ensure no UX regression for auth/session and existing app navigation.

## Implementation Notes
- Keep copy minimal and product-approved; legal can iterate copy text separately.
- Persist decision once and avoid repeat prompting unless policy version changes.
- Ensure banner does not render for static assets or API/background requests.

## Conceptual Snippet
```ts
if (consentRequired && !hasValidConsent(policyVersion)) {
  openBanner();
}
```

## Verification Checklist
- [x] Banner appears in required/unknown-browser flows with no prior decision.
- [x] Banner not shown in non-required regions by default.
- [x] Preferences dialog can reopen from global `Privacy choices` entrypoint.
- [x] Necessary cookies cannot be disabled in UI.
- [x] Consent persists across reloads.
- [x] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria
- Consent UX is complete, accessible, and wired to persisted client state.
