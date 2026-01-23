# Dismissible Feed Intro (Post Your Slop)

Status: draft
Owner: TBD

## Current implementation review
- Location: `apps/web/src/app/page.tsx`
- Structure:
  - “Fresh Slop Daily” headline in a dashed, rotated badge block.
  - Subtext: “The premier destination for rating vibecoded apps. Upvote the best. Review the rest.”
  - Date strip centered between horizontal rules (`formattedDate`).
- This is static content at the top of the feed page; no dismissal, no persistence.

## Goal
Turn the intro into a dismissible “getting started” banner for posting AI-assisted apps, with localStorage persistence. Keep the visual vibe (rotated badge + date strip styling), but update copy to emphasize:
- “Post your slop”
- This is the only place where slop is encouraged
- Real humans/devs will rate it

## Dismissible behavior (recommended)
- Store a flag in `localStorage` (e.g., `slop:feedIntroDismissed=true`).
- On mount, read the flag and hide the banner if dismissed.
- Provide a small “Dismiss” button (or “Got it”) in the intro block.
- Keep dismissal local to the user/device (no auth required).

## Where to put the date styling
We can keep the date strip styling but repurpose it for a secondary callout:
- Option A: replace date with a short, stylized kicker (e.g., “HUMANS RATE THIS SLOP”).
- Option B: keep the same strip but show “Dev‑rated” / “Human‑rated” / “Vibes enforced”.
- Option C: keep the date strip style as the dismiss button container (e.g., “Dismiss” in the same pill style).

## Component structure idea
- Extract a `FeedIntroBanner` component (optional, same file or new component).
- Layout:
  - Top: main badge/title (new copy)
  - Middle: 1–2 line explainer
  - Bottom: stylized strip with “Human‑rated” copy + dismiss action aligned right

## Copy ideas (5–10)

### Simple / clear
1) **Title:** Post your slop
   **Body:** The only place where AI‑assisted apps are encouraged. Humans and devs will rate it.

2) **Title:** Ship your slop
   **Body:** Don’t hide it. This is the home for AI‑made apps, judged by real humans.

3) **Title:** Submit your AI app
   **Body:** Slop is welcome here. Real people and devs will review it.

4) **Title:** Post your build
   **Body:** AI‑assisted projects, openly judged. Humans + devs rate the slop.

### Playful / mid‑tone
5) **Title:** Slop, but make it public
   **Body:** The only corner of the internet that *wants* your AI apps. Humans will score it.

6) **Title:** The slop registry
   **Body:** Upload your AI‑made app. Real people + devs decide if it’s solid.

7) **Title:** The slop queue
   **Body:** Post it. Humans and devs will rate your AI build with real scores.

### Unhinged
8) **Title:** Confess your slop
   **Body:** This is the one place slop is encouraged. Humans will judge you anyway.

9) **Title:** Drop your slop, coward
   **Body:** AI‑assisted apps welcome. Real devs will rate the damage.

10) **Title:** Slop court is in session
    **Body:** Submit your AI build. Humans decide if it’s immaculate or criminal.

## Open questions
- Should the dismiss action be “Dismiss”, “Got it”, or “Hide this”?
- Do we want to keep the rotated badge style for the title, or switch to the date-strip style?
- Should the banner reappear after a period (e.g., 30 days), or remain dismissed permanently?
