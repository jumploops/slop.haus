"use client";

import { SWRProvider } from "@/lib/swr-config";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { LoginModalContext, useLoginModalState } from "@/hooks/useLoginModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { SlopModeProvider } from "@/lib/slop-mode";

export function Providers({ children }: { children: React.ReactNode }) {
  const loginModalState = useLoginModalState();

  return (
    <ThemeProvider>
      <SlopModeProvider>
        <SWRProvider>
          <ToastProvider>
            <LoginModalContext.Provider value={loginModalState}>
              {children}
              <LoginModal />
            </LoginModalContext.Provider>
          </ToastProvider>
        </SWRProvider>
      </SlopModeProvider>
    </ThemeProvider>
  );
}
