# Vibe Badge Tier Color Mismatch (Sample vs Current)

## Status

- **Type:** Investigation
- **Date:** 2026-03-03
- **Scope:** Badge color/tone parity with `reference/vibe_badges`
- **Code changes in this investigation:** None (debug doc only)

## Problem Statement

Reported mismatch after integration:

1. Top tier (`90`/`100`) appears as a different green than the sample implementation.
2. Middle tier (`50`) is no longer blue.

## Investigation Steps

1. Compared sample tone config in:
   - `/Users/adam/code/slop.haus/reference/vibe_badges/components/vibe-badge.tsx`
2. Compared current app tone config in:
   - `/Users/adam/code/slop.haus/apps/web/src/components/project/VibeBadge.tsx`
3. Reviewed theme token values in:
   - `/Users/adam/code/slop.haus/apps/web/src/app/globals.css`
4. Verified bucket/label computation logic in:
   - `/Users/adam/code/slop.haus/apps/web/src/lib/vibe-taxonomy.ts`

## Findings

### 1) Color mapping diverges from sample (high confidence)

Sample (`LEVEL_CONFIG`) maps:
- `40`/`50` -> `sky` (`text-sky-400`, `bg-sky-500/10`, `ring-sky-500/25`)
- `80`/`90`/`100` -> `emerald` (`text-emerald-400`, `bg-emerald-500/10`, `ring-emerald-500/25`)

Current app (`VIBE_TONE_BY_BUCKET`) maps:
- `40`/`50` -> `accent` (`bg-accent/20 text-accent border-accent/40`)
- `80`/`90`/`100` -> `slop-lime` background/border and `text-foreground`

This is a direct mapping mismatch, not a rendering bug.

### 2) `50` appears non-blue because `accent` token is orange-ish (high confidence)

In current theme:
- `--accent: oklch(0.75 0.18 25)` (warm/orange hue)

So a `50` badge mapped to `accent` will not be blue.

### 3) Top tier appears different because it is not using emerald classes (high confidence)

Current top tiers use:
- `bg-slop-lime/20`
- `border-slop-lime/50`
- `text-foreground`

`--slop-lime` is not the same as Tailwind emerald tone, and `text-foreground` further removes explicit green text coloring used by sample.

### 4) Bucketing logic is not the cause of this specific color complaint (high confidence)

`vibe-taxonomy.ts` uses rounded deciles (`Math.round(percent / 10) * 10`) per product decision. That may affect *which* tier is selected near boundaries, but it does not explain why `50` is non-blue or `90/100` are non-emerald.

## Root Cause Hypothesis

Primary hypothesis (very high confidence):
- During integration, badge tones were intentionally remapped from sample Tailwind palette colors to local semantic/slop tokens. This introduced palette drift from the visual reference.

Secondary hypothesis (high confidence):
- The current semantic token set does not include dedicated vibe-tier hues equivalent to sample `sky/teal/emerald`, so using existing `accent`/`slop-lime` tokens cannot produce sample parity.

## Why This Matches The Report

- Report: "middle tier 50% no longer blue" -> current `50` uses `accent` (orange), not sky.
- Report: "top tier is a different green" -> current `90/100` uses slop-lime + foreground text, not emerald classes.

## Suggested Next-Step Options (no code changes yet)

1. **Sample-parity path:** Use sample palette classes directly in `VibeBadge` tone mapping (`sky`, `teal`, `emerald`, etc.).
2. **Tokenized parity path:** Introduce dedicated `vibe-*` semantic tokens (including blue and emerald equivalents), then map tiers to those tokens.
3. **Hybrid path:** Keep semantic approach generally, but allow curated palette classes only inside `VibeBadge` to match the approved reference exactly.

