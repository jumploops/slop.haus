"use client";

import { SWRProvider } from "@/lib/swr-config";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { LoginModalContext, useLoginModalState } from "@/hooks/useLoginModal";
import { LoginModal } from "@/components/auth/LoginModal";

export function Providers({ children }: { children: React.ReactNode }) {
  const loginModalState = useLoginModalState();

  return (
    <ThemeProvider>
      <SWRProvider>
        <ToastProvider>
          <LoginModalContext.Provider value={loginModalState}>
            {children}
            <LoginModal />
          </LoginModalContext.Provider>
        </ToastProvider>
      </SWRProvider>
    </ThemeProvider>
  );
}
