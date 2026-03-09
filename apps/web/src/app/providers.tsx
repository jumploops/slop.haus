"use client";

import { SWRProvider } from "@/lib/swr-config";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { LoginModalContext, useLoginModalState } from "@/hooks/useLoginModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { EnsureAnonymous } from "@/components/auth/EnsureAnonymous";
import { SlopModeProvider } from "@/lib/slop-mode";
import { ConsentManager } from "@/components/privacy/ConsentManager";
import type { ConsentContext, CookieConsentState } from "@/lib/privacy/consent";

interface ProvidersProps {
  children: React.ReactNode;
  initialConsentContext: ConsentContext;
  initialConsentState: CookieConsentState | null;
}

export function Providers({
  children,
  initialConsentContext,
  initialConsentState,
}: ProvidersProps) {
  const loginModalState = useLoginModalState();

  return (
    <ThemeProvider>
      <SlopModeProvider>
        <SWRProvider>
          <ToastProvider>
            <LoginModalContext.Provider value={loginModalState}>
              <EnsureAnonymous />
              <ConsentManager
                initialContext={initialConsentContext}
                initialConsentState={initialConsentState}
              />
              {children}
              <LoginModal />
            </LoginModalContext.Provider>
          </ToastProvider>
        </SWRProvider>
      </SlopModeProvider>
    </ThemeProvider>
  );
}
