# Privacy + Consent Launch Minimum (Design Doc)

Status: draft  
Date: 2026-02-26  
Owner: TBD (Product + Eng)

## Context
We currently load GA4 on page load whenever `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set (`apps/web/src/components/analytics/GoogleAnalytics.tsx`).

We are based in California, currently do not run ads, do not do targeted advertising, and do not intentionally sell/share personal data. We are drafting Privacy Policy and ToS separately.

This doc defines the minimum product/UX scope to launch responsibly with GA and avoid obvious policy/compliance gaps.

## Goals
- Ship a consent UX that is valid for EEA/UK/Switzerland users.
- Keep implementation minimal and pragmatic.
- Cover launch-critical product/privacy gaps beyond banner UI.
- Keep global user experience simple.

## Non-goals
- Full legal drafting (handled in separate Privacy Policy / ToS workstreams).
- Enterprise CMP rollout or multi-vendor consent orchestration.
- Ads consent flows (we currently do not run ads).

## Regulatory Assumptions (Product-Level)
Not legal advice; for product planning only.

- **EEA/UK/CH:** non-essential analytics cookies generally require opt-in consent before set/use. GA’s EU User Consent Policy also requires valid consent handling, revocation, and consent records.
- **California:** no standalone cookie opt-in rule equivalent to EU ePrivacy for analytics-only setup, but CCPA/CPRA obligations may still apply (notice at collection, privacy disclosures, rights handling if thresholds/coverage apply).
- **If we truly do not sell/share:** “Do Not Sell or Share” flow may not be required; this must be confirmed with counsel because third-party analytics configurations can change that assessment.

## Options: Geo-based vs Global Banner

### Option A (Preferred): Geo-based banner
Show consent banner only for EEA/UK/CH traffic.

Pros:
- Better UX for non-EEA users.
- Aligns effort with highest-risk jurisdictions.

Cons:
- Requires reliable country detection strategy.
- More edge-case testing and fallback handling.

### Option B (Fallback): Global banner
Show same consent banner to all users.

Pros:
- Lowest implementation risk.
- Simple, uniform behavior and QA.

Cons:
- Adds friction for all users.
- Potentially unnecessary in CA/US-only contexts.

### Recommendation
- Start with **Option A** if we can get stable country detection from hosting/CDN headers with low effort.
- If geo signal is unavailable/unstable, ship **Option B** to avoid launch delay.

## Launch-Minimum Scope

### 1) Consent UX (MVP)
- Banner with 3 clear actions:
  - `Accept analytics`
  - `Reject analytics`
  - `Manage preferences`
- No pre-checked consent for analytics.
- Must allow user to continue using site if they reject.
- Banner must link to Privacy Policy.

### 2) Consent preferences surface
- Add persistent footer link: `Privacy choices` (or `Cookie settings`).
- Clicking reopens preferences modal/panel.
- User can change choice any time.

### 3) Consent state model
- Persist minimal consent record client-side:
  - `choice` (`granted`/`denied`)
  - `timestamp`
  - `policyVersion` (for re-prompt when policy materially changes)
  - `regionDecisionSource` (`geo` or `global`)
- Keep storage minimal and first-party.

### 4) GA behavior requirements
- GA must not initialize analytics cookies before consent in consent-required regions.
- Use Google consent mode defaults before measurement events.
- Update consent state immediately after user choice.
- If user revokes consent, stop new analytics collection and honor updated state going forward.

### 5) “Other missing product aspects” required for launch
- **Public legal links:** add Privacy Policy + ToS links in footer and auth-related surfaces.
- **Notice at collection location:** clear notice at/near collection points (sign-in/submission flows) pointing to Privacy Policy.
- **User rights intake channel:** provide one clear method (email or form) for access/delete/correct requests.
- **Internal operations owner:** designate who handles privacy requests and SLA target.
- **Vendor disclosure readiness:** maintain a short internal vendor list + what data each receives.

## Out-of-Scope for Initial Launch (Can Follow Shortly After)
- Full self-serve DSAR portal.
- Automated identity verification workflow.
- Fine-grained consent categories beyond analytics.
- Multi-language consent UX.

## Product Decisions Required Before Implementation
1. Geo detection source:
   - trusted request header from platform/CDN, or
   - third-party geolocation lookup, or
   - fallback global banner.
2. Banner strategy:
   - geo-based now vs global now.
3. Rights intake endpoint:
   - support email vs web form.
4. Re-consent trigger:
   - policy-version based vs fixed time interval.
5. Copy authority:
   - who signs off final user-facing consent/legal text.

## Open Questions
1. Are we definitively in-scope for CCPA/CPRA right now (threshold analysis), or preparing ahead of threshold?
2. Does our GA configuration use any features that could be interpreted as “sharing” under CPRA (for example, future ad-related settings)?
3. Do we need to honor Global Privacy Control today, even if we assert no sale/share?
4. What is our final source of truth for country detection on current hosting stack?
5. Should we store server-side consent logs (in addition to client state) for auditability?
6. What exact SLA do we commit to for privacy requests (delete/correct/access)?
7. Should anonymous users see consent banner before anonymous auth bootstrap, or can it appear after shell load?

## UX Content Requirements (Draft)
- Banner headline: concise and neutral.
- Body: explain analytics purpose (site performance/usage insights), no ad targeting.
- Buttons: equal prominence for accept/reject.
- Preferences: clear statement that choice can be changed anytime via footer link.

## QA / Acceptance Criteria
- In consent-required regions:
  - No analytics cookies set before consent.
  - `Reject` path keeps app fully usable.
  - `Accept` enables measurement.
  - Revocation updates behavior on subsequent navigation/page loads.
- In non-consent-required regions (if geo-based):
  - Banner behavior matches regional rules.
  - No false positives from geo fallback path.
- Legal links visible in footer and functional.
- Privacy request channel visible and documented internally.

## Rollout Plan (Suggested)
1. Finalize decisions on geo strategy + rights intake channel.
2. Finalize UX copy with legal review.
3. Implement banner/preferences + consent mode wiring.
4. Add footer legal links and privacy choices entry point.
5. Run region-based QA and launch.

## References
- Google EU User Consent Policy: https://www.google.com/about/company/user-consent-policy/
- Google Consent Mode (web): https://developers.google.com/tag-platform/security/guides/consent
- ICO cookies guidance (UK): https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/
- California AG CCPA overview/FAQ: https://www.oag.ca.gov/privacy/ccpa
- CPPA FAQ (rights and opt-out signal): https://cppa.ca.gov/faq
