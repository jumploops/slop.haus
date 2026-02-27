type GtagParamValue = string | number | boolean | null | undefined;
type GtagParams = Record<string, GtagParamValue>;
type GtagArgs = [string, ...unknown[]];

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: GtagArgs) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

function getDisableFlagKey(): `ga-disable-${string}` {
  return `ga-disable-${GA_MEASUREMENT_ID}`;
}

export function setAnalyticsCollectionEnabled(enabled: boolean): void {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) {
    return;
  }

  window[getDisableFlagKey()] = !enabled;
}

export function setAnalyticsConsent(granted: boolean): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
  });
}

function canTrack(): boolean {
  if (
    typeof window === "undefined" ||
    !GA_MEASUREMENT_ID ||
    typeof window.gtag !== "function"
  ) {
    return false;
  }

  return window[getDisableFlagKey()] !== true;
}

export function pageview(url: string): void {
  if (!canTrack()) {
    return;
  }

  const gtag = window.gtag;
  if (!gtag) {
    return;
  }

  gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

export function event(action: string, params: GtagParams = {}): void {
  if (!canTrack()) {
    return;
  }

  const gtag = window.gtag;
  if (!gtag) {
    return;
  }

  gtag("event", action, params);
}
