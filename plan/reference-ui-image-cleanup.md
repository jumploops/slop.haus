# Reference UI Image Cleanup Plan

Status: Draft

## Goal
- Remove most `reference-ui/public` assets that were copied into `apps/web/public`.
- Record every current usage so we can swap in approved replacements.

## Findings
### Inventory copied into `apps/web/public`
- Placeholder/project images:
  - `colorful-email-app-interface-with-mood-indicators.jpg`
  - `minimalist-todo-app-with-philosophical-quotes-over.jpg`
  - `chaotic-colorful-css-code-editor.jpg`
  - `futuristic-calendar-with-glowing-quantum-particles.jpg`
  - `sticky-notes-app-with-sarcastic-handwriting.jpg`
  - `pitch-deck-generator-with-money-and-rocket-emojis.jpg`
  - `placeholder.jpg`
- Avatar images:
  - `anonymous-user-avatar.jpg`
  - `cartoon-face-avatar.jpg`
  - `cat-in-box-avatar.jpg`
  - `glitch-art-avatar.jpg`
  - `money-bag-avatar.jpg`
  - `pixel-art-green-avatar.png`
  - `smiling-face-with-sunglasses-avatar.jpg`
  - `thinking-emoji-avatar.jpg`
  - `placeholder-user.jpg`
- Badges/retro buttons:
  - `award-trophy-best-website-90s-animated-gif-gold.jpg`
  - `best-viewed-netscape-navigator-badge-90s.jpg`
  - `geocities-badge-animated-90s.jpg`
  - `internet-explorer-badge-90s-blue.jpg`
  - `made-with-notepad-badge-90s-web.jpg`
  - `webring-badge-animated.jpg`
- Icons/logos:
  - `apple-icon.png`
  - `icon-dark-32x32.png`
  - `icon-light-32x32.png`
  - `icon.svg`
  - `placeholder-logo.png`
  - `placeholder-logo.svg`
  - `placeholder.svg`

### Current usage in code
- `apps/web/src/lib/utils.ts` uses the placeholder/project images and `placeholder.jpg` in `getPlaceholderImage`.
- `getPlaceholderImage` is used by:
  - `apps/web/src/components/project/ProjectCard.tsx`
  - `apps/web/src/components/project/ProjectDetails.tsx`
  - `apps/web/src/components/project/ScreenshotEditor.tsx`
  - `apps/web/src/components/submit/EditableProjectPreview.tsx`
  - `apps/web/src/app/my/projects/page.tsx`
- No other direct references found to the remaining files via `rg` across `apps/web`.

## Proposed plan
### Phase 1: Decide replacements
- Confirm which assets are allowed to remain (if any).
- Define new placeholder image strategy (single fallback, new set, or generated).
- If app icons are needed, decide on new approved assets and update metadata.

### Phase 2: Update references
- Replace `getPlaceholderImage` list and fallback with approved assets.
- Update any component-level references if we introduce new placeholders.

### Phase 3: Remove unused assets
- Delete the unused files from `apps/web/public`.
- Re-run usage search to ensure no stale references remain.

## Files to change
- `apps/web/src/lib/utils.ts`
- `apps/web/public/*` (selected removals)
- `apps/web/src/app/layout.tsx` or metadata files (if we replace icons)

## Blockers / Unknowns
- Which assets are approved to keep versus replace?
- Are any of the public icons referenced implicitly by Next.js or deployment tooling?
- Do any existing project records rely on these local file paths?

## Verification checklist
- `rg -n "<filename>" apps/web` shows no references to removed assets.
- Run `pnpm -F @slop/web exec tsc --noEmit` if we touch TS files.
- Manually load homepage and project pages to confirm placeholders render.
