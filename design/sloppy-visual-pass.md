# Slop.haus Sloppy Visual Pass Review

**Status:** Draft  
**Date:** 2026-01-28

## Goal
Make the UI feel intentionally “sloppy” while staying readable and navigable for launch. The look should signal playful, vibecoded chaos without harming core UX (feed browse, submit, project detail, auth).

## Current Design Review (Quick Audit)

**Core layout + chrome**
- Root layout uses a construction-marquee banner, sticky header, and a clean max-width container. (`apps/web/src/app/layout.tsx`)
- Global palette + tokens are cohesive; overall vibe is “clean but playful” rather than “messy.” (`apps/web/src/app/globals.css`)
- Header logo already has character (brick text, rotating hover), but the nav and buttons are clean and aligned. (`apps/web/src/components/layout/Header.tsx`)

**Feed + cards**
- Feed page relies on tabbed controls, view toggles, and tidy card stacks. (`apps/web/src/app/page.tsx`)
- Project cards are structured and consistent; the only “slop” is small hover rotations + a rotated score badge. (`apps/web/src/components/project/ProjectCard.tsx`)

**Project detail**
- Detail page has a strong hero image and crisp card sections; minimal decorative chaos (only tiny corner blocks). (`apps/web/src/components/project/ProjectDetails.tsx`)
- Score widget is neat and modular with a slight rotation on the score chip. (`apps/web/src/components/project/ScoreWidget.tsx`)

**Submit flow**
- Submit view is clean, bordered, and standard form UI (lots of whitespace and alignment). (`apps/web/src/app/submit/page.tsx`)

## What Already Feels Sloppy (Keep + Amplify)
- Construction marquee strip and dashed borders establish a lo-fi vibe.
- Handcrafted logo treatment (brick + wet paint fonts) sets a playful tone.
- Small rotations on cards and score chips add a hint of wonkiness.
- Visitor counter has a retro web feel.

## What Still Feels Too Clean
- Layout grid is very aligned; most sections are square, even, and centered.
- Sloppiness only appears on hover; initial view is polished.
- No texture or physicality (paper, tape, smudges, torn edges, etc.).
- Buttons, tabs, and form inputs feel generic despite the fun palette.

## Sloppy Treatment Ideas (10–20 options)
Below are candidate interventions; most are CSS-only and can be applied incrementally.

1. **Persistent micro-rotation + nudge per card** — apply tiny `rotate(-1.5deg..1.5deg)` and `translate` offsets to each card based on a stable hash of project ID (not random per render) so it feels crooked but consistent.
2. **“Hanging” elements** — add pseudo-element strings to badges (e.g., “New”, slop score) and make them swing slightly on load/hover.
3. **Tape/staple corners** — use pseudo-elements to “tape” cards or images with skewed translucent rectangles, staples, or paperclips.
4. **Drippy “goo” edges** — apply SVG mask or CSS `filter: url(#goo)` on separators or badge backgrounds to look slightly melted.
5. **Torn paper dividers** — replace section borders with torn-edge SVG masks or `clip-path` on headers and panel tops.
6. **Misregistered shadows** — use offset, double shadows (2–3 layers) for cards and buttons to feel mis-printed.
7. **Wobbly outlines** — add a subtle `stroke-dasharray` or SVG outline around cards to look hand-drawn.
8. **Sticky-note badges** — restyle labels (“new”, slop score, tool tags) as crooked Post-its with folded corners.
9. **Smudged highlighter accents** — add irregular highlight swashes behind headings (via `linear-gradient` + `background-size` with jittered edges).
10. **Bent screenshot frames** — add a pseudo “frame” around images that’s slightly skewed or misaligned (like a pasted photo).
11. **Glitchy marquee timing** — vary speed or offset of the construction banner so it feels imperfect (small pauses or jump-cuts every few cycles).
12. **Ink splatter / marker doodles** — overlay subtle doodle SVGs behind cards or next to headings (low opacity, theme-aware).
13. **Uneven button edges** — use `clip-path` or multiple borders to make buttons look imperfectly cut.
14. **Offset section headers** — shift headings a few pixels off-grid with asymmetrical padding (a little misalignment makes the rest feel sloppy).
15. **Sticker stacks** — add 2–3 layered “sticker” rectangles behind select badges or counters with rotated layers.
16. **Text baseline jitter** — apply `skew` or `translateY` on individual letters for “slop” words (use sparingly in headings).
17. **Noise + paper texture** — low-opacity noise layer on the page or cards to reduce the clean digital look.
18. **Broken grid** — introduce occasional “too wide” or “too narrow” cards in the feed (every Nth card) to disrupt uniformity.

## Guardrails (So It’s Still Usable)
- Keep primary text fully readable; slop is decorative, not functional.
- Avoid layout shift on hover; apply offsets at rest or via stable transforms.
- Use token-based colors; ensure contrast remains accessible.
- Cap animations: subtle and low-frequency (prefer swing/float over constant jitter).

## Suggested Next Step
Pick 3–5 low-risk ideas (e.g., micro-rotation, tape corners, smudged highlights, misregistered shadows) and prototype them on feed cards + project detail hero before expanding to forms and nav.
