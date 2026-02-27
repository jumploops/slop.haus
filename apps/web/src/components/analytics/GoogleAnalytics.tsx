"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  GA_MEASUREMENT_ID,
  pageview,
  setAnalyticsCollectionEnabled,
  setAnalyticsConsent,
} from "@/lib/analytics/gtag";
import {
  CONSENT_POLICY_VERSION,
  COOKIE_CONSENT_RESET_EVENT,
  CONSENT_STATE_STORAGE_KEY,
  COOKIE_CONSENT_UPDATED_EVENT,
  getDefaultConsentContext,
  isConsentStateCurrent,
  isCookieBannerEnabled,
  loadCookieConsentState,
  readConsentContextFromDocument,
  resolveAnalyticsEnabled,
  type CookieConsentUpdatedDetail,
} from "@/lib/privacy/consent";

function buildTrackedUrl(pathname: string, searchParams: URLSearchParams): string {
  const search = searchParams.toString();
  return search.length > 0 ? `${pathname}?${search}` : pathname;
}

function readAnalyticsEnabledSnapshot(): boolean {
  const bannerEnabled = isCookieBannerEnabled();
  if (!bannerEnabled) {
    return true;
  }

  const context = readConsentContextFromDocument() || getDefaultConsentContext();
  const parsedConsent = loadCookieConsentState();
  const consentState = isConsentStateCurrent(parsedConsent, CONSENT_POLICY_VERSION)
    ? parsedConsent
    : null;

  return resolveAnalyticsEnabled(context, consentState, bannerEnabled);
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) {
      return;
    }

    const applyAnalyticsState = (enabled: boolean) => {
      setAnalyticsEnabled(enabled);
      setAnalyticsCollectionEnabled(enabled);
      setAnalyticsConsent(enabled);

      if (!enabled) {
        setIsReady(false);
      } else if (typeof window.gtag === "function") {
        setIsReady(true);
      }
    };

    applyAnalyticsState(readAnalyticsEnabledSnapshot());

    const handleConsentUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentUpdatedDetail>).detail;
      if (!detail) {
        applyAnalyticsState(readAnalyticsEnabledSnapshot());
        return;
      }

      applyAnalyticsState(detail.analyticsEnabled);
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key !== null &&
        event.key !== CONSENT_STATE_STORAGE_KEY
      ) {
        return;
      }

      applyAnalyticsState(readAnalyticsEnabledSnapshot());
    };

    const handleConsentReset = () => {
      applyAnalyticsState(readAnalyticsEnabledSnapshot());
    };

    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsentUpdated);
    window.addEventListener(COOKIE_CONSENT_RESET_EVENT, handleConsentReset);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        COOKIE_CONSENT_UPDATED_EVENT,
        handleConsentUpdated
      );
      window.removeEventListener(COOKIE_CONSENT_RESET_EVENT, handleConsentReset);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !isReady || !analyticsEnabled) {
      return;
    }

    pageview(buildTrackedUrl(pathname, searchParams));
  }, [analyticsEnabled, isReady, pathname, searchParams]);

  if (!GA_MEASUREMENT_ID || !analyticsEnabled) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => setIsReady(true)}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', { analytics_storage: 'granted' });
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
