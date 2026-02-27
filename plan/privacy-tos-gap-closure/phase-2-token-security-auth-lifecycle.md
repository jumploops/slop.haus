# Phase 2: Token Security + Auth Lifecycle

**Status:** Not Started  
**Owner:** API + Infra + Security  
**Depends On:** Phase 1 (parallelizable where needed)

## Goal
Finalize defensible security commitments for OAuth/session credentials and align implementation with policy language.

## Deliverables
1. OAuth token handling contract:
   - storage location
   - encryption posture
   - lifecycle (issue, refresh, revoke, delete)
2. Session/security controls summary for policy text.
3. Gap tickets for encryption/revocation improvements if required.

## Checklist
- [ ] Confirm current storage behavior for `account.accessToken`, `refreshToken`, `idToken`.
- [ ] Decide and document token protection posture (application-level encryption or accepted equivalent control set).
- [ ] Define unlink/account-delete revocation behavior (local delete only vs provider revoke attempts).
- [ ] Document secret management and key-rotation ownership.
- [ ] Publish operational runbook for token compromise response.

## Exit Criteria
- Approved token/security commitments exist and are implementable.
- Policy language can accurately describe storage, protection, and deletion/revocation behavior.

