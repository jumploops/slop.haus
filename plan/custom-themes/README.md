# Custom Themes Plan

Status: draft
Owner: TBD
Last updated: 2026-01-20

## Overview

Implement the semantic theming pipeline described in `design/semantic-theme-pipeline.md`, with safe user themes compiled from JSON, theme previews via `.theme-scope`, and a simple loading screen for user themes.

## Goals

- Keep Tailwind as the authoring surface for base UI.
- Create a semantic recipe layer and structural tokens.
- Implement a safe ThemeSpec compiler for user themes.
- Ensure theme previews work consistently.
- Add a lightweight theme-loading screen for user themes.

## Non-Goals

- Arbitrary user CSS or selectors.
- Theme marketplace or moderation tools.
- Full refactor of all pages before v1.

## Phases

| Phase | Name | Status | Summary |
|------:|------|--------|---------|
| 1 | ThemeSpec + Compiler | completed | Schema, validation, compile to variable-only CSS with preview selectors |
| 2 | Semantic Recipes + Tokens | completed | Add recipes layer, expand tokens for structure/layout |
| 3 | Runtime + Loading Screen | completed | Boot script, user theme apply flow, preview scoping |
| 4 | Lint + CI Enforcement | pending | Block raw utilities in primitives, add lint script/ESLint rule |
| 5 | Migrate Core Primitives | completed | Button, Card, Input, Modal, Tabs, Badge, Toast |
| 6 | Built-in Theme Wiring | completed | Enable retro/default theme files + presets integration |

## Dependencies

- `design/semantic-theme-pipeline.md`
- `design/theme-review-retro-vs-current.md`

## Notes

- Keep user theme CSS variable-only (no `url()`, no selectors).
- Require `.theme-scope` emission for previews.
- Favor enums/allowlists over freeform values.
