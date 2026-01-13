export const URL_TYPES = [
  "github",
  "gitlab",
  "npm",
  "pypi",
  "chrome_webstore",
  "steam",
  "live_site",
] as const;

export type UrlType = (typeof URL_TYPES)[number];

export interface DetectedUrl {
  type: UrlType;
  originalUrl: string;
  canonicalUrl: string;
  isRepo: boolean;
  isStorefront: boolean;
}

/**
 * Detect the type of URL and normalize it
 */
export function detectUrlType(url: string): DetectedUrl {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const canonicalUrl = url.split("?")[0].replace(/\/$/, "");

  if (host === "github.com") {
    return {
      type: "github",
      originalUrl: url,
      canonicalUrl,
      isRepo: true,
      isStorefront: false,
    };
  }

  if (host === "gitlab.com") {
    return {
      type: "gitlab",
      originalUrl: url,
      canonicalUrl,
      isRepo: true,
      isStorefront: false,
    };
  }

  if (host === "npmjs.com" || host === "npm.im") {
    return {
      type: "npm",
      originalUrl: url,
      canonicalUrl,
      isRepo: true,
      isStorefront: false,
    };
  }

  if (host === "pypi.org") {
    return {
      type: "pypi",
      originalUrl: url,
      canonicalUrl,
      isRepo: true,
      isStorefront: false,
    };
  }

  if (host === "chrome.google.com" && parsed.pathname.includes("/webstore/")) {
    return {
      type: "chrome_webstore",
      originalUrl: url,
      canonicalUrl: url, // Keep query params for Chrome Web Store
      isRepo: false,
      isStorefront: true,
    };
  }

  if (host === "store.steampowered.com") {
    return {
      type: "steam",
      originalUrl: url,
      canonicalUrl: url, // Keep query params for Steam
      isRepo: false,
      isStorefront: true,
    };
  }

  return {
    type: "live_site",
    originalUrl: url,
    canonicalUrl,
    isRepo: false,
    isStorefront: false,
  };
}
