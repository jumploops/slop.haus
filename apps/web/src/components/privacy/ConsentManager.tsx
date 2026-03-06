"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CONSENT_POLICY_VERSION,
  COOKIE_CONSENT_RESET_EVENT,
  OPEN_PRIVACY_CHOICES_EVENT,
  emitCookieConsentUpdated,
  getDefaultConsentContext,
  isConsentStateCurrent,
  isCookieBannerEnabled,
  loadCookieConsentState,
  persistCookieConsentState,
  readConsentContextFromDocument,
  resolveAnalyticsEnabled,
  type ConsentContext,
  type ConsentDecisionSource,
  type CookieConsentState,
} from "@/lib/privacy/consent";
import { CookieConsentBanner } from "./CookieConsentBanner";
import { CookiePreferencesDialog } from "./CookiePreferencesDialog";

function resolveDecisionSource(context: ConsentContext): ConsentDecisionSource {
  if (context.source === "global_override") {
    return "global_override";
  }

  return context.required ? "geo_required" : "geo_not_required";
}

export function ConsentManager() {
  const [isReady, setIsReady] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [context, setContext] = useState<ConsentContext>(getDefaultConsentContext);
  const [consentState, setConsentState] = useState<CookieConsentState | null>(null);

  useEffect(() => {
    if (!isCookieBannerEnabled()) {
      queueMicrotask(() => {
        setIsReady(true);
      });
      return;
    }

    const nextContext = readConsentContextFromDocument() || getDefaultConsentContext();
    const parsedConsent = loadCookieConsentState();
    const nextConsent = isConsentStateCurrent(parsedConsent, CONSENT_POLICY_VERSION)
      ? parsedConsent
      : null;

    queueMicrotask(() => {
      setContext(nextContext);
      setConsentState(nextConsent);
      setBannerOpen(nextContext.required && !nextConsent);
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isCookieBannerEnabled()) {
      return;
    }

    const openPreferences = () => setPreferencesOpen(true);
    const resetConsent = () => {
      const nextContext =
        readConsentContextFromDocument() || getDefaultConsentContext();
      setContext(nextContext);
      setConsentState(null);
      setBannerOpen(nextContext.required);
      setPreferencesOpen(false);
    };

    window.addEventListener(OPEN_PRIVACY_CHOICES_EVENT, openPreferences);
    window.addEventListener(COOKIE_CONSENT_RESET_EVENT, resetConsent);

    return () => {
      window.removeEventListener(OPEN_PRIVACY_CHOICES_EVENT, openPreferences);
      window.removeEventListener(COOKIE_CONSENT_RESET_EVENT, resetConsent);
    };
  }, []);

  const analyticsEnabled = useMemo(() => {
    return resolveAnalyticsEnabled(context, consentState);
  }, [context, consentState]);

  function commitConsent(analyticsGranted: boolean) {
    const nextState: CookieConsentState = {
      analytics: analyticsGranted ? "granted" : "denied",
      timestamp: Date.now(),
      policyVersion: CONSENT_POLICY_VERSION,
      countryCodeAtDecision: context.countryCode || undefined,
      decisionSource: resolveDecisionSource(context),
    };

    persistCookieConsentState(nextState);
    setConsentState(nextState);
    setBannerOpen(false);
    setPreferencesOpen(false);

    emitCookieConsentUpdated({
      context,
      state: nextState,
      analyticsEnabled: resolveAnalyticsEnabled(context, nextState),
    });
  }

  if (!isReady || !isCookieBannerEnabled()) {
    return null;
  }

  return (
    <>
      <CookieConsentBanner
        open={bannerOpen}
        onAccept={() => commitConsent(true)}
        onReject={() => commitConsent(false)}
        onManage={() => setPreferencesOpen(true)}
      />
      <CookiePreferencesDialog
        open={preferencesOpen}
        analyticsEnabled={analyticsEnabled}
        onClose={() => setPreferencesOpen(false)}
        onSave={(value) => commitConsent(value)}
      />
    </>
  );
}
