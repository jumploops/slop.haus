"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface CookieConsentBannerProps {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
  onManage: () => void;
}

export function CookieConsentBanner({
  open,
  onAccept,
  onReject,
  onManage,
}: CookieConsentBannerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[calc(100%-2rem)] max-w-md">
      <div className="border-2 border-border bg-card p-4 shadow-lg">
        <p className="text-sm text-foreground">
          We use necessary cookies for core site functionality and optional
          analytics cookies to improve product performance.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Analytics are optional. See our{" "}
          <Link
            href="/privacy"
            className="font-semibold text-foreground underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={onAccept}>
            Accept Cookies
          </Button>
          <Button size="sm" variant="secondary" onClick={onReject}>
            Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={onManage}>
            Manage preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
