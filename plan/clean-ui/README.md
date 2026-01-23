# Clean UI Refactor Plan

**Status:** Draft
**Owner:** TBD
**Last Updated:** 2026-01-22

Goal: Reskin `apps/web` to match `clean-ui/` (and `clean-ui/STYLE_GUIDE.md`) while simplifying the theme system to a standard TailwindCSS-only configuration. This plan breaks the work into phases with explicit file targets, tasks, and verification steps.

---

## Scope Summary

- Replace current theme/preset system with clean-ui style light/dark + system.
- Align tokens and classnames to clean-ui conventions (`bg-background`, `text-foreground`, etc.).
- Reskin core layouts and components to match clean-ui reference UI.
- Restyle non-reference pages (settings/admin/submit/etc.) using `STYLE_GUIDE.md`.
- Remove unused theme routes/components once migration is complete.

---

## Phases

| Phase | Name | Status | Key Outputs |
|------|------|--------|-------------|
| 1 | Audit + scaffolding | Pending | File inventory, migration checklist, baseline snapshot |
| 2 | Global styles + theme simplification | Pending | New globals.css, updated ThemeProvider, font setup |
| 3 | Core layout + shared components | Pending | Header/footer, banner, tokens in UI primitives |
| 4 | Page-level reskins | Pending | Feed + project detail + submit/settings/admin styles |
| 5 | Cleanup + QA | Pending | Remove old theme system, fix regressions, verify dark mode |

---

## Dependencies

- Approval on theme system removal (presets + user-generated themes).
- Agreement on header/nav structure (clean-ui vs current nav needs).
- Asset copy decision from `clean-ui/public` to `apps/web/public`.

---

## Notes

- All phases should keep design work consistent with `clean-ui/STYLE_GUIDE.md`.
- Use semantic Tailwind utilities only (no raw palette classes).
- Prefer updating existing files over creating new ones where possible.
