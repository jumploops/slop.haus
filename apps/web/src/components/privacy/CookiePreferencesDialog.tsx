"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface CookiePreferencesDialogProps {
  open: boolean;
  analyticsEnabled: boolean;
  onClose: () => void;
  onSave: (analyticsEnabled: boolean) => void;
}

export function CookiePreferencesDialog({
  open,
  analyticsEnabled,
  onClose,
  onSave,
}: CookiePreferencesDialogProps) {
  const [analyticsDraft, setAnalyticsDraft] = useState<boolean | null>(null);
  const analyticsValue = analyticsDraft ?? analyticsEnabled;

  const handleClose = () => {
    setAnalyticsDraft(null);
    onClose();
  };

  const handleSave = () => {
    onSave(analyticsValue);
    setAnalyticsDraft(null);
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title="Privacy choices">
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Necessary cookies stay on. You can choose whether analytics cookies
          are enabled.
        </p>

        <section className="border-2 border-border bg-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-foreground">
                Necessary cookies
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Required for auth, security, and core app functionality.
              </p>
            </div>
            <span className="rounded border-2 border-border bg-muted px-2 py-1 text-[10px] font-mono font-bold uppercase text-foreground">
              Always on
            </span>
          </div>
        </section>

        <section className="border-2 border-border bg-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-foreground">
                Analytics cookies
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Help us understand site usage and improve product experience.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={analyticsValue}
                onChange={(event) => setAnalyticsDraft(event.target.checked)}
              />
              Enable
            </label>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={handleSave}
          >
            Save choices
          </Button>
          <Button size="sm" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
