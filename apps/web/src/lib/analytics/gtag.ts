type GtagParamValue = string | number | boolean | null | undefined;
type GtagParams = Record<string, GtagParamValue>;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (command: "config" | "event" | "js", targetIdOrName: string | Date, params?: GtagParams) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

function canTrack(): boolean {
  return typeof window !== "undefined" && Boolean(GA_MEASUREMENT_ID) && typeof window.gtag === "function";
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
