import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  CONSENT_CONTEXT_COOKIE_NAME,
  isCookieBannerEnabled,
  isCookieBannerForceGlobal,
  parseConsentContext,
  serializeConsentContext,
  type ConsentContextSource,
} from "./lib/privacy/consent";
import {
  isBrowserLikeRequest,
  isConsentRequiredCountry,
  normalizeCountryCode,
} from "./lib/privacy/geo";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!isCookieBannerEnabled()) {
    return response;
  }

  if (!isBrowserLikeRequest(request)) {
    return response;
  }

  const country = normalizeCountryCode(request.headers.get("cf-ipcountry"));
  const forceGlobal = isCookieBannerForceGlobal();
  const requiredByGeo = country ? isConsentRequiredCountry(country) : true;
  const consentRequired = forceGlobal || requiredByGeo;
  const source: ConsentContextSource = forceGlobal
    ? "global_override"
    : country
      ? "geo"
      : "unknown";

  const existingContext = parseConsentContext(
    request.cookies.get(CONSENT_CONTEXT_COOKIE_NAME)?.value
  );
  const shouldReuseExistingContext =
    existingContext?.required === consentRequired &&
    existingContext.countryCode === country &&
    existingContext.source === source;

  const contextValue = serializeConsentContext({
    required: consentRequired,
    countryCode: country,
    source,
    evaluatedAt: shouldReuseExistingContext
      ? existingContext.evaluatedAt
      : Date.now(),
  });

  if (!shouldReuseExistingContext) {
    response.cookies.set({
      name: CONSENT_CONTEXT_COOKIE_NAME,
      value: contextValue,
      httpOnly: false,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
