# Phase 7 — External API Timeouts & Retry Policy

**Status:** completed
**Priority:** P1

## Problem
Worker calls to Firecrawl/Anthropic lack explicit timeouts and unified retry classification, risking stuck jobs.

## Goals
- Enforce request timeouts for all external calls.
- Classify retryable vs. permanent errors consistently.

## Proposed Approach
- Wrap fetch with `AbortController` and per-service timeout budgets.
- Centralize retryable error detection in a shared helper.
- Ensure job handlers throw only on retryable failures.

## Files to Change
- `apps/worker/src/lib/firecrawl.ts`
- `apps/worker/src/handlers/analyze-content.ts`
- `apps/worker/src/handlers/moderate-async.ts`
- `apps/worker/src/handlers/scrape-url.ts`

## Verification Checklist
- [ ] Jobs time out and retry appropriately when upstream is slow.
- [ ] Non-retryable failures mark drafts/projects as failed without requeue.

## Rollout
- Deploy worker changes; monitor job failure rates.
