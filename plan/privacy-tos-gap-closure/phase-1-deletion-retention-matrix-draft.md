# Phase 1 Draft: Deletion + Retention Matrix (Review Draft)

**Status:** Draft for review  
**Date:** 2026-02-27  
**Purpose:** Starting point for product/legal decision-making. Not final policy language.

## Deletion Matrix (Draft)

| Data Class | Current State (Code) | Draft Launch Commitment (Proposed) | Open Decision |
| --- | --- | --- | --- |
| User account row (`user`) | No explicit account deletion workflow | Provide account deletion request path; delete/anonymize within SLA | Hard delete vs anonymized tombstone |
| OAuth account tokens (`account`) | Tokens stored in DB columns | Delete local token records at account deletion/unlink | Attempt provider-side token revocation? |
| Sessions (`session`) | Server-side session records with token/IP/UA | Revoke active sessions immediately at account deletion | Session retention window after deactivation |
| User-generated projects/comments | Status-driven moderation/removal patterns | Define whether deletion removes content or anonymizes author identity | License/persistence model post-deletion |
| Favorites/votes/likes | User-linked interaction records | Delete or irreversibly de-identify with account deletion | Keep aggregate counters only? |
| Moderation + flags | Reporter/mod records retained | Retain where needed for abuse/legal integrity; de-identify user linkage when possible | Minimum retention window and legal-hold exception |
| Enrichment drafts/jobs | Operational records with content/URLs | Enforce finite retention and purge schedule | Exact TTL by status/type |
| Object storage media | Upload/screenshot URLs tied to projects | Delete orphaned media on content/account deletion workflow | Backup/replica purge lag |
| Logs (app/platform) | Not policy-committed in repo | Publish fixed retention windows and redaction expectations | Final retention durations |
| Backups | Not policy-committed in repo | Publish backup retention + eventual purge timeline | Exact timeline for full erase |

## Retention Targets (Initial Strawman)

| Category | Strawman Retention |
| --- | --- |
| Session rows | 30-90 days after expiry |
| App/platform access logs | 30-90 days |
| Moderation/abuse records | 12-24 months |
| Enrichment drafts/jobs | 30-180 days (status-dependent) |
| Backups | 30-35 days rolling |

## Notes
- Values above are placeholders to accelerate decisions; final numbers require infra/legal sign-off.
- Any published retention statement must match actual enforced automation (TTL/lifecycle/purge jobs).

