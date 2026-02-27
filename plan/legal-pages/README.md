# Legal Pages Plan

**Status:** Completed  
**Last Updated:** 2026-02-27  
**Owner:** Web + Product

## Goal
Ship launch-ready Privacy Policy and Terms of Service as markdown-with-front-matter and render them at `/privacy` and `/terms`.

## Scope
- Author initial policy text aligned with current implementation.
- Store legal docs as markdown with front matter.
- Implement simple markdown + front matter rendering for Next.js app routes.
- Add route pages for `/privacy` and `/terms`.

## Phases

| Phase | Status | Goal |
| --- | --- | --- |
| 1 | Completed | Add markdown legal docs with front matter |
| 2 | Completed | Implement markdown/front-matter loader + renderer |
| 3 | Completed | Add `/privacy` + `/terms` routes and wire links |

## Exit Criteria
- [x] `legal/privacy.md` exists with front matter.
- [x] `legal/terms.md` exists with front matter.
- [x] `/privacy` renders privacy markdown content.
- [x] `/terms` renders terms markdown content.
- [x] Footer contains visible legal links.
