# Geo-Based Cookie Consent Banner (Design)

Status: draft  
Date: 2026-02-27  
Owner: TBD (Product + Engineering)

## Why This Doc
We have confirmed that `cf-ipcountry` is available on most requests in production, with occasional missing values:
- Example observed values: `US`, and occasionally `missing`.

We need a launch-ready consent design that:
- shows a banner only where required,
- keeps GA off until consent where required,
- preserves strictly necessary first-party cookies,
- gracefully handles missing geo headers.

## Scope
- Web consent UX and decision model for Google Analytics only.
- Geo-based gating using `cf-ipcountry`.
- Product behavior and acceptance criteria.

## Non-Goals
- Implementing code in this phase.
- Full CMP procurement/integration.
- Ads consent flows (no ads today).

## Decision Summary (Confirmed)
1. **Consent-required regions:** EEA + UK + Switzerland.
2. **Geo signal:** `cf-ipcountry` header (primary).
3. **Non-required regions default:** GA ON.
4. **If geo is missing/unknown:**
   - treat as consent-required for browser-like page requests,
   - do not force consent workflow for non-browser/background traffic.
5. **Cookie categories:**
   - Strictly necessary: always on.
   - Analytics (GA): off by default in consent-required flows until user opts in.
6. **Consent record for launch:** client-side only (no server-side consent audit log yet).
7. **No added DB complexity for geo travel scenarios:** do not persist/re-evaluate country in DB.
8. **Copy/policy cadence:** launch with one approved version; expect infrequent policy-version bumps.
9. **Fallback switch:** ability to force global banner if geo reliability changes.
10. **Browser-like detection rule (chosen):**
   - primary: `sec-fetch-dest=document`,
   - fallback: `GET` + `Accept` contains `text/html`,
   - exclusions: `_rsc` requests and prefetch requests (`purpose`/`sec-purpose`).

## Region Policy

### Consent-required region set
- EEA (EU member states + Iceland, Liechtenstein, Norway)
- UK (`GB`)
- Switzerland (`CH`)

### Country-code handling
- Header key: `cf-ipcountry`
- If code is in consent-required set: show banner unless prior choice exists.
- If code is not in set: no banner by default (still provide `Privacy choices` entry point).
- If header is missing or special/unknown (`missing`, `XX`, `T1`, empty):
  - browser-like page requests: treat as consent-required,
  - non-browser/background traffic: skip consent workflow.

Rationale: safer default for real users, less noise from bots/health checks.

## Cookie and Storage Categories (Product View)

### Strictly necessary (always enabled)
- Auth/session cookies used for sign-in/session continuity.
- Security/functional cookies required for site behavior.
- First-party functional identity cookies used to support rating workflows (when those actions are used).

### `slop_rater` classification note
- `slop_rater` is a first-party `HttpOnly` cookie set when a user performs a like action.
- It stores a random UUID that is HMAC-hashed server-side and used as pseudonymous rater identity (`raterKeyHash`) for:
  - one-like-per-project enforcement,
  - like-state lookup,
  - like rate limiting.
- It is not required for general browsing, but is required to provide the requested voting/like function reliably.
- Launch classification recommendation: **functional/strictly-necessary for the like feature** (not analytics/advertising).

### Analytics (requires opt-in in consent-required regions)
- Google Analytics cookies/storage and pageview/event collection.

### Preferences storage
- Local storage keys for UI preferences are not ad/analytics trackers, but should still be documented in Privacy Policy.

## UX Design

### Banner entry conditions
Show banner when all are true:
1. Request is browser-like page navigation.
2. Request is in consent-required region (or geo unknown for browser-like request).
3. No valid stored consent decision for current policy version.
4. User is on normal app page (not static assets).

### Browser-like request detection (implementation guidance)
- Consider request browser-like if either:
  - `sec-fetch-dest` equals `document`, or
  - request is `GET` and `Accept` includes `text/html`.
- Exclude from browser-like classification:
  - requests containing `_rsc` query parameter,
  - requests with `purpose: prefetch` or `sec-purpose: prefetch`.

### Banner content (MVP)
- Message: we use necessary cookies for core functionality and optional analytics to improve the product.
- Controls:
  - `Accept analytics`
  - `Reject analytics`
  - `Manage preferences`
- Link to Privacy Policy.

### Preferences modal/panel
- `Necessary cookies` toggle: ON, locked.
- `Analytics cookies` toggle: user-controllable.
- Save/apply and cancel actions.
- Explain revocation path.

### Persistent controls
- Footer link: `Privacy choices` (always visible).
- Re-opens preferences so user can change choice at any time.

## Behavior Matrix

1. Consent-required + no choice:
- Banner shown.
- GA disabled by default.

2. Consent-required + accepted:
- Banner hidden.
- GA enabled.

3. Consent-required + rejected:
- Banner hidden.
- GA remains disabled.

4. Non-required region + no choice:
- No banner by default.
- GA enabled by default.
- `Privacy choices` still available.

5. Geo missing/unknown + browser-like:
- Treated as consent-required.
- Banner shown, GA disabled until choice.

6. Geo missing/unknown + non-browser/background:
- No banner workflow.
- No change to browser consent state.

## Consent State Model (Proposed)
Store a minimal first-party consent record:
- `analytics`: `granted` | `denied`
- `timestamp`
- `policyVersion`
- `countryCodeAtDecision` (optional)
- `decisionSource`: `geo_required` | `geo_not_required` | `global_override`

Notes:
- Re-prompt when `policyVersion` changes materially.
- Keep schema intentionally small.
- Keep this client-side only for launch.
- Do not add server-side DB storage for consent in launch scope.

## GA Integration Requirements
- GA must not initialize analytics cookies in consent-required/unknown flows before consent.
- GA can initialize after explicit accept.
- Revocation from preferences must stop future analytics collection.
- Do not block necessary cookies when analytics is rejected.

## Operational Notes
- Keep current temporary geo debug logging until rollout confidence is high.
- Add a kill switch to force global banner if geo behavior becomes unreliable.
- Document geo fallback behavior in internal runbook.

## Remaining Open Question
1. None for launch in current scope.

## Acceptance Criteria (Design-Level)
- Banner appears in EEA/UK/CH and unknown-geo flows when no decision exists.
- GA is off before consent in those flows.
- Rejecting analytics does not impact core app usage.
- Necessary cookies continue to function regardless of analytics choice.
- `Privacy choices` is available globally.
- Banner can be globally forced by config if needed.

## Rollout Plan
1. Confirm region list and missing-header policy with legal/product.
2. Finalize banner/modal copy and policy links.
3. Implement behind feature flag.
4. Validate in production logs and browser tests across region scenarios.
5. Remove temporary geo debug logging after verification window.

## References
- Google EU User Consent Policy: https://www.google.com/about/company/user-consent-policy/
- Google EU User Consent Policy Help (scope and regions): https://www.google.com/about/company/user-consent-policy-help/
- UK ICO guidance on cookies and similar technologies: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/
- European Commission cookies policy page (necessary vs consented categories example): https://commission.europa.eu/cookies-policy_en
