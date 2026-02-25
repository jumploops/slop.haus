# Profanity Package Investigation (Project Tools)

## Context

Current behavior is split across two mechanisms:

1. Static fragment denylist in shared validation:
- `packages/shared/src/tools.ts` (`DISALLOWED_TOOL_FRAGMENTS`, `isDisallowedToolName`, `isValidToolName`)
- `packages/shared/src/username.ts` (separate generated-username deny fragments)

2. Runtime DB policy enforcement:
- `apps/api/src/lib/tools.ts` rejects tags if a matching `tools` record has `status = "blocked"`
- `packages/db/src/schema/projects.ts` defines `tool_status` enum (`active`, `blocked`)

This means we already have a moderation control plane (`tools.status`), but the profanity signal for newly entered tags is currently a small hardcoded list.

## Candidate npm Libraries (as of February 24, 2026)

## 1) `obscenity`

- Repo: <https://github.com/jo3-l/obscenity>
- Strong TypeScript support and configurable matcher/pipeline.
- English preset explicitly states the dataset source is `cuss` (MIT), which is good provenance.
- No runtime dependencies (per package metadata).

Source-data note:
- `src/preset/english.ts` says it uses words from `cuss`.

## 2) `leo-profanity`

- Repo: <https://github.com/jojoee/leo-profanity>
- Very lightweight API (`check`, `clean`, add/remove words) and multiple languages.
- README documents several dictionary sources (including Shutterstock and other public lists).
- Latest GitHub release visible: `v1.9.0` (January 17, 2026).

Source-data note:
- Wordlists live under the repo `dictionary/` directory and are assembled from listed resources.

## 3) `@2toad/profanity`

- Repo: <https://github.com/2Toad/Profanity>
- TypeScript-first, zero dependencies, multi-language support, allowlist support.
- Maintains internal static word datasets (`src/data/...`).

Source-data note:
- Data is embedded in package source files; provenance is less explicit in README than `obscenity`/`leo-profanity`.

## 4) `bad-words`

- Repo: <https://github.com/web-mech/badwords>
- Very common/simple API.
- Uses `badwords-list` as source dependency.

Source-data note:
- `badwords-list` documents that the list is based on Google's banned-word list.

## Recommendation

Use `obscenity` for server-side profanity detection on new tag creation paths, while keeping DB `tools.status` as the final enforcement source.

Why:
- Clear dataset provenance (`cuss` for English).
- Good TS ergonomics and normalization capabilities (important for obfuscated profanity variants).
- No dependency chain bloat.

## Architecture Guardrails

1. Keep authoritative enforcement in the API/database:
- Profanity package should decide whether to auto-create a new tag.
- `tools.status = blocked` remains the canonical denylist for all reads/writes.

2. Do not ship the profanity dataset to the web bundle by default:
- `@slop/shared` is transpiled into `apps/web`; adding a large profanity package there increases client JS.
- Put profanity matching in API/worker server-only modules, and keep client-side checks as UX hints only.

3. Preserve existing allow cases for valid tech names:
- Keep current character policy (`+`, `#`, `.`, `/`, spaces, etc.).
- Add project-specific allowlist escapes for false positives if needed.

## Proposed Integration Plan (if approved)

1. Add `obscenity` to `apps/api` (and optionally `apps/worker` if worker-side filtering is required).
2. Add server helper (e.g. `apps/api/src/lib/profanity.ts`) that returns `{ blocked: boolean, reason?: string }`.
3. Call helper inside `resolveAndUpsertTools(...)` before insertion.
4. If blocked, return existing `TOOL_BLOCKED` response shape.
5. Keep shared fallback fragment checks for lightweight client validation, but rely on server decision.
6. Add tests for:
- obvious profanity blocked
- obfuscated variants blocked
- legitimate tech names not blocked (`C#`, `C++`, `Next.js`, `React Native`)

## Open Questions

1. Should profanity filtering apply to all user-input text fields eventually, or stay scoped to tool/tag creation?
2. Do we want an explicit per-project allowlist table to override false positives without code changes?
3. Should we log blocked attempts to moderation analytics beyond current structured logs?
