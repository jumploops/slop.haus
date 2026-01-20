# Phase 4: Lint + CI Enforcement

Status: pending

## Goal

Prevent raw Tailwind utilities from leaking into primitive components and enforce semantic class usage.

## Scope

- Add a lint rule or script to flag raw palette utilities in primitives.
- Require semantic classes for core UI components.
- Gate on CI.

## Files to Change

- `scripts/lint-semantic.mjs` (new) or ESLint custom rule
- `package.json` (add lint script)
- `apps/web/package.json` (optional) or root CI config

## Implementation Notes

- Start with a script-based lint (regex + allowlist), replace with ESLint rule later.
- Target `apps/web/src/components/ui/**` and `apps/web/src/components/layout/**`.
- Allow a small set of structural utilities only when semantic classes are present.

## Verification Checklist

- [ ] Lint fails on raw palette classes in primitives.
- [ ] Lint passes on semantic-only usage.
- [ ] CI runs the semantic lint.
