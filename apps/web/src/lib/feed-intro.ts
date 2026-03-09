export const FEED_INTRO_DISMISSED_STORAGE_KEY = "slop:feedIntroDismissed";
export const FEED_INTRO_DISMISSED_COOKIE_NAME = "slop_feed_intro_dismissed";
const FEED_INTRO_COOKIE_VALUE = "1";
const FEED_INTRO_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isFeedIntroDismissedCookieValue(value: string | null | undefined): boolean {
  return value === FEED_INTRO_COOKIE_VALUE;
}

export function persistFeedIntroDismissed(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FEED_INTRO_DISMISSED_STORAGE_KEY, "true");
  document.cookie = buildFeedIntroCookieString(FEED_INTRO_COOKIE_VALUE, FEED_INTRO_COOKIE_MAX_AGE_SECONDS);
}

export function clearFeedIntroDismissed(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(FEED_INTRO_DISMISSED_STORAGE_KEY);
  document.cookie = buildFeedIntroCookieString("", 0);
}

function buildFeedIntroCookieString(value: string, maxAgeSeconds: number): string {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  return [
    `${FEED_INTRO_DISMISSED_COOKIE_NAME}=${value}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}
