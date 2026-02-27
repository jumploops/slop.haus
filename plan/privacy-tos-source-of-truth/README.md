# Privacy + ToS Source-of-Truth Plan

## Overview
Build a code-backed inventory of application behavior and data handling to support drafting a Privacy Policy and Terms of Service.

## Deliverable
- Root markdown report: `POLICY_TOS_SOURCE_OF_TRUTH.md`

## Phases

| Phase | File | Status | Goal |
|---|---|---|---|
| 1 | `phase-1-auth-and-data-inventory.md` | Completed | Identify auth/OAuth flows, data model, cookies, logs, and user-generated content |
| 2 | `phase-2-automation-vendors-security-retention.md` | Completed | Identify agents/automation, third parties, security controls, deletion/retention, moderation |
| 3 | `phase-3-deliverable-synthesis.md` | Completed | Produce final questionnaire answers + artifact list + policy drafting inputs |

## Verification Checklist
- [x] OAuth providers/scopes/token handling verified from code and env docs
- [x] DB schema inventory extracted (PII vs non-PII)
- [x] Cookie/session/CSRF behavior identified
- [x] Third-party service list and data flow mapped
- [x] Logging, retention, deletion behavior documented with confidence levels
- [x] Public/private visibility and moderation controls documented
- [x] Open questions and unknowns called out for engineering follow-up
