export const CONSENT_CONTEXT_COOKIE_NAME = "slop_consent_context";
export const COOKIE_CONSENT_STATE_COOKIE_NAME = "slop_consent_state";
export const CONSENT_STATE_STORAGE_KEY = "slop:cookieConsent";
export const OPEN_PRIVACY_CHOICES_EVENT = "slop:open-privacy-choices";
export const COOKIE_CONSENT_UPDATED_EVENT = "slop:cookie-consent-updated";
export const COOKIE_CONSENT_RESET_EVENT = "slop:cookie-consent-reset";
export const CONSENT_POLICY_VERSION =
  process.env.NEXT_PUBLIC_COOKIE_BANNER_POLICY_VERSION || "2026-02-27";
const COOKIE_CONSENT_STATE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type AnalyticsConsentValue = "granted" | "denied";
export type ConsentDecisionSource =
  | "geo_required"
  | "geo_not_required"
  | "global_override";

export type ConsentContextSource = "geo" | "unknown" | "global_override";

export interface CookieConsentState {
  analytics: AnalyticsConsentValue;
  timestamp: number;
  policyVersion: string;
  countryCodeAtDecision?: string;
  decisionSource: ConsentDecisionSource;
}

export interface ConsentContext {
  required: boolean;
  countryCode: string | null;
  source: ConsentContextSource;
  evaluatedAt: number;
}

export interface CookieConsentUpdatedDetail {
  context: ConsentContext;
  state: CookieConsentState;
  analyticsEnabled: boolean;
}

function getCookieValueFromCookieString(
  cookieHeader: string | null | undefined,
  name: string
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawKey, ...valueParts] = cookie.trim().split("=");
    if (rawKey !== name) {
      continue;
    }

    const rawValue = valueParts.join("=");
    if (!rawValue) {
      return null;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

function decodeCookieValue(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function parseBooleanEnv(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) {
    return fallback;
  }

  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

export function isCookieBannerEnabled(): boolean {
  return parseBooleanEnv(process.env.NEXT_PUBLIC_COOKIE_BANNER_ENABLED, true);
}

export function isCookieBannerForceGlobal(): boolean {
  return parseBooleanEnv(process.env.NEXT_PUBLIC_COOKIE_BANNER_FORCE_GLOBAL, false);
}

export function serializeConsentContext(context: ConsentContext): string {
  const params = new URLSearchParams();
  params.set("v", "1");
  params.set("r", context.required ? "1" : "0");
  params.set("c", context.countryCode || "");
  params.set("s", context.source);
  params.set("t", String(context.evaluatedAt));
  return params.toString();
}

export function parseConsentContext(
  raw: string | null | undefined
): ConsentContext | null {
  if (!raw) {
    return null;
  }

  const params = new URLSearchParams(raw);
  if (params.get("v") !== "1") {
    return null;
  }

  const required = params.get("r");
  if (required !== "0" && required !== "1") {
    return null;
  }

  const source = params.get("s");
  if (source !== "geo" && source !== "unknown" && source !== "global_override") {
    return null;
  }

  const timestamp = Number(params.get("t"));
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return null;
  }

  const countryCode = params.get("c") || null;

  return {
    required: required === "1",
    countryCode,
    source,
    evaluatedAt: timestamp,
  };
}

export function serializeCookieConsentState(state: CookieConsentState): string {
  return JSON.stringify(state);
}

export function parseCookieConsentState(
  raw: string | null | undefined
): CookieConsentState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    const analytics = parsed.analytics;
    if (analytics !== "granted" && analytics !== "denied") {
      return null;
    }

    const timestamp = parsed.timestamp;
    if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
      return null;
    }

    const policyVersion = parsed.policyVersion;
    if (typeof policyVersion !== "string" || policyVersion.length === 0) {
      return null;
    }

    const decisionSource = parsed.decisionSource;
    if (
      decisionSource !== "geo_required" &&
      decisionSource !== "geo_not_required" &&
      decisionSource !== "global_override"
    ) {
      return null;
    }

    const countryCodeAtDecision = parsed.countryCodeAtDecision;
    if (
      countryCodeAtDecision !== undefined &&
      typeof countryCodeAtDecision !== "string"
    ) {
      return null;
    }

    return {
      analytics,
      timestamp,
      policyVersion,
      countryCodeAtDecision,
      decisionSource,
    };
  } catch {
    return null;
  }
}

export function isConsentStateCurrent(
  state: CookieConsentState | null,
  policyVersion = CONSENT_POLICY_VERSION
): state is CookieConsentState {
  return !!state && state.policyVersion === policyVersion;
}

export function getDefaultConsentContext(): ConsentContext {
  return {
    required: true,
    countryCode: null,
    source: "unknown",
    evaluatedAt: Date.now(),
  };
}

export function readConsentContextFromDocument(): ConsentContext | null {
  if (typeof document === "undefined") {
    return null;
  }

  const raw = getCookieValueFromCookieString(
    document.cookie,
    CONSENT_CONTEXT_COOKIE_NAME
  );
  return parseConsentContext(raw);
}

export function loadCookieConsentState(): CookieConsentState | null {
  if (typeof document !== "undefined") {
    const fromCookie = readConsentStateFromDocument();
    if (fromCookie) {
      return fromCookie;
    }
  }

  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(CONSENT_STATE_STORAGE_KEY);
  return parseCookieConsentState(raw);
}

export function persistCookieConsentState(state: CookieConsentState): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  window.localStorage.setItem(
    CONSENT_STATE_STORAGE_KEY,
    serializeCookieConsentState(state)
  );
  document.cookie = buildConsentStateCookieString(serializeCookieConsentState(state));
}

export function clearCookieConsentState(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  window.localStorage.removeItem(CONSENT_STATE_STORAGE_KEY);
  document.cookie = buildConsentStateCookieString("", 0);
  window.dispatchEvent(new Event(COOKIE_CONSENT_RESET_EVENT));
}

export function readConsentStateFromDocument(): CookieConsentState | null {
  if (typeof document === "undefined") {
    return null;
  }

  const raw = getCookieValueFromCookieString(
    document.cookie,
    COOKIE_CONSENT_STATE_COOKIE_NAME
  );
  return parseCookieConsentState(raw);
}

export function readConsentStateFromCookieValue(
  raw: string | null | undefined
): CookieConsentState | null {
  return parseCookieConsentState(decodeCookieValue(raw));
}

export function resolveAnalyticsEnabled(
  context: ConsentContext,
  state: CookieConsentState | null,
  bannerEnabled = isCookieBannerEnabled()
): boolean {
  if (!bannerEnabled) {
    return true;
  }

  if (context.required) {
    return state?.analytics === "granted";
  }

  if (!state) {
    return true;
  }

  return state.analytics === "granted";
}

export function emitCookieConsentUpdated(
  detail: CookieConsentUpdatedDetail
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<CookieConsentUpdatedDetail>(COOKIE_CONSENT_UPDATED_EVENT, {
      detail,
    })
  );
}

function buildConsentStateCookieString(
  value: string,
  maxAgeSeconds = COOKIE_CONSENT_STATE_COOKIE_MAX_AGE_SECONDS
): string {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";

  return [
    `${COOKIE_CONSENT_STATE_COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}
