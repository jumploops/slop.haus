"use client";

import { OPEN_PRIVACY_CHOICES_EVENT } from "@/lib/privacy/consent";

export function PrivacyChoicesButton() {
  return (
    <button
      type="button"
      className="font-mono text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
      onClick={() => window.dispatchEvent(new Event(OPEN_PRIVACY_CHOICES_EVENT))}
    >
      Privacy choices
    </button>
  );
}

