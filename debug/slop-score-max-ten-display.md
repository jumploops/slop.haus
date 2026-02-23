# Slop Score Shows `10.0` Instead of `10` at Max

## Problem
Project score surfaces currently show one decimal place for all rated scores, including the maximum score (`10.0`).

## Investigation Steps
1. Searched web score display code for decimal formatting with `toFixed(1)`.
2. Found three project score render paths:
   - `apps/web/src/components/project/ProjectCard.tsx`
   - `apps/web/src/components/project/ScoreWidget.tsx`
   - `apps/web/src/components/project/EditableProject.tsx`
3. Confirmed each path formatted score text inline with `toFixed(1)`, with no shared max-score rule.

## Root Cause
Score formatting was duplicated across components and always forced one decimal place, so max score values rendered as `10.0`.

## Solution
1. Added shared formatter `formatSlopScore(score)` in `apps/web/src/lib/slop-score-presentation.ts`.
2. Updated all three project score surfaces to use the shared formatter.
3. Formatter now converts `10.0` display output to `10` while preserving decimal display for non-max scores.
