import type { NextRequest } from "next/server";

const EEA_COUNTRY_CODES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IS",
  "IE",
  "IT",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
] as const;

const CONSENT_REQUIRED_COUNTRY_CODES = new Set<string>([
  ...EEA_COUNTRY_CODES,
  "GB",
  "CH",
]);

const UNKNOWN_COUNTRY_CODES = new Set(["", "MISSING", "XX", "T1", "UNKNOWN"]);
const PREFETCH_VALUE = "prefetch";

function isPrefetchRequest(request: NextRequest): boolean {
  const purpose = request.headers.get("purpose")?.toLowerCase();
  if (purpose === PREFETCH_VALUE) {
    return true;
  }

  const secPurpose = request.headers.get("sec-purpose")?.toLowerCase();
  return secPurpose === PREFETCH_VALUE;
}

export function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const code = raw.trim().toUpperCase();
  if (UNKNOWN_COUNTRY_CODES.has(code)) {
    return null;
  }

  if (!/^[A-Z]{2}$/.test(code)) {
    return null;
  }

  return code;
}

export function isConsentRequiredCountry(code: string | null): boolean {
  if (!code) {
    return false;
  }

  return CONSENT_REQUIRED_COUNTRY_CODES.has(code);
}

export function isBrowserLikeRequest(request: NextRequest): boolean {
  if (request.nextUrl.searchParams.has("_rsc")) {
    return false;
  }

  if (isPrefetchRequest(request)) {
    return false;
  }

  const secFetchDest = request.headers.get("sec-fetch-dest")?.toLowerCase();
  if (secFetchDest === "document") {
    return true;
  }

  if (request.method.toUpperCase() !== "GET") {
    return false;
  }

  const accept = request.headers.get("accept")?.toLowerCase() ?? "";
  return accept.includes("text/html");
}

