# Theme Toggle in User Dropdown – Design Options

**Status:** Draft
**Date:** 2026-01-23

## Goal

Design a theme control that feels consistent with the option menu’s typography and spacing while remaining quick to use. The current inline button feels visually mismatched.

## Constraints

- Clean‑ui style: monospace labels, dashed borders, muted surfaces.
- Dropdown is compact; avoid large controls.
- Keep light/dark/system support unless we decide otherwise.

## Option A — Segmented Mini Toggle (Inline)

**Description**
A compact 3‑segment control (SYS / LIGHT / DARK) aligned to the right of a “Theme” row. Each segment is a tiny button using the same border/dashed language.

**Pros**
- Fast, one‑click selection.
- Visually cohesive with button styling.
- Clear at a glance.

**Cons**
- Slightly wider row; may feel cramped on narrow dropdowns.

**Notes**
- Use 2px dashed border, small caps labels, and subtle background for active state.

## Option B — Single Toggle Row (Cycle)

**Description**
A single menu row labeled “Theme” with a small right‑aligned icon + short text (e.g. “System”, “Light”, “Dark”). Clicking the row cycles through themes.

**Pros**
- Minimal footprint.
- Looks like a standard menu action.

**Cons**
- Less discoverable than explicit choices.
- Requires multiple clicks to reach a desired mode.

## Option C — Inline Select / Mini Dropdown

**Description**
A compact select control to the right of “Theme”, using a tiny caret and the same border style as other inputs.

**Pros**
- Familiar control; explicit choices.
- Fits the clean‑ui input language.

**Cons**
- Selects inside dropdowns can feel clunky on mobile.

## Option D — Submenu (Theme →)

**Description**
Add a “Theme” row with a chevron that opens a nested submenu listing System / Light / Dark.

**Pros**
- Keeps main menu clean.
- Scales if we add more theme options.

**Cons**
- More complex interaction (hover/second click).
- Harder on touch devices.

## Option E — Icon‑Only Toggle (Cycle)

**Description**
A small icon button (sun/moon/monitor) placed inline on the right of “Theme”, but without the full button chrome. Clicking cycles modes.

**Pros**
- Compact, visually light.
- Keeps the row consistent with menu typography.

**Cons**
- Less explicit; relies on icon meaning.

## Recommendation Criteria

- **Clarity:** Users should understand available modes quickly.
- **Compactness:** Avoid growing the dropdown height too much.
- **Consistency:** Matches the clean‑ui dashed/bold menu style.
- **Mobile friendliness:** Prefer tap‑friendly without nested menus.

## Next Step

Pick one approach and iterate the exact Tailwind classes + layout in the dropdown row.
