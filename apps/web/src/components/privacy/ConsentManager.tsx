"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CONSENT_POLICY_VERSION,
  COOKIE_CONSENT_RESET_EVENT,
  OPEN_PRIVACY_CHOICES_EVENT,
  emitCookieConsentUpdated,
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

interface ConsentManagerProps {
  initialContext: ConsentContext;
  initialConsentState: CookieConsentState | null;
}

function resolveDecisionSource(context: ConsentContext): ConsentDecisionSource {
  if (context.source === "global_override") {
    return "global_override";
  }

  return context.required ? "geo_required" : "geo_not_required";
}

function resolveInitialConsentSnapshot(
  initialContext: ConsentContext,
  initialConsentState: CookieConsentState | null,
  bannerEnabled: boolean
) {
  if (!bannerEnabled) {
    return {
      context: initialContext,
      consentState: initialConsentState,
      bannerOpen: false,
    };
  }

  const context = readConsentContextFromDocument() || initialContext;
  const parsedConsent = loadCookieConsentState();
  const consentState = isConsentStateCurrent(parsedConsent, CONSENT_POLICY_VERSION)
    ? parsedConsent
    : initialConsentState;

  return {
    context,
    consentState,
    bannerOpen: context.required && !consentState,
  };
}

export function ConsentManager({
  initialContext,
  initialConsentState,
}: ConsentManagerProps) {
  const bannerEnabled = isCookieBannerEnabled();
  const initialSnapshot = useMemo(
    () =>
      resolveInitialConsentSnapshot(
        initialContext,
        initialConsentState,
        bannerEnabled
      ),
    [bannerEnabled, initialContext, initialConsentState]
  );
  const [bannerOpen, setBannerOpen] = useState(initialSnapshot.bannerOpen);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [context, setContext] = useState<ConsentContext>(initialSnapshot.context);
  const [consentState, setConsentState] = useState<CookieConsentState | null>(
    initialSnapshot.consentState
  );

  useEffect(() => {
    if (!bannerEnabled) {
      return;
    }

    const openPreferences = () => setPreferencesOpen(true);
    const resetConsent = () => {
      const nextContext = readConsentContextFromDocument() || initialContext;
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
  }, [bannerEnabled, initialContext]);

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

  if (!bannerEnabled) {
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
