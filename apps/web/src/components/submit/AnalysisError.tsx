"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getErrorMessage, getErrorRecovery, type RecoveryAction } from "@/lib/errors";

interface AnalysisErrorProps {
  error: string | Error;
  errorCode?: string;
  onRetry: () => void;
  onManualEntry: () => void;
}

export function AnalysisError({
  error,
  errorCode,
  onRetry,
  onManualEntry,
}: AnalysisErrorProps) {
  const [waitRemaining, setWaitRemaining] = useState<number | null>(null);

  const errorMessage = getErrorMessage(error);
  const recovery = getErrorRecovery(errorCode);

  // Handle countdown for rate limit wait
  useEffect(() => {
    if (recovery.action === "wait" && recovery.waitSeconds) {
      setWaitRemaining(recovery.waitSeconds);

      const interval = setInterval(() => {
        setWaitRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [recovery.action, recovery.waitSeconds]);

  const getActionButton = (action: RecoveryAction) => {
    switch (action) {
      case "retry":
        return (
          <Button onClick={onRetry} variant="primary">
            Try Again
          </Button>
        );
      case "manual":
        return (
          <Button onClick={onManualEntry} variant="primary">
            Enter Details Manually
          </Button>
        );
      case "wait":
        return (
          <Button
            onClick={onRetry}
            variant="primary"
            disabled={waitRemaining !== null}
          >
            {waitRemaining !== null
              ? `Wait ${waitRemaining}s`
              : "Try Again"}
          </Button>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
        <div className="bg-bg border-2 border-[color:var(--border)] p-4">
          <div className="flex justify-center mb-3 text-danger">
            <WarningIcon />
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-bold text-danger mb-2">Analysis Failed</h3>
            <p className="text-sm text-fg">{errorMessage}</p>

            {recovery.message !== errorMessage && (
              <p className="text-xs text-muted mt-2">{recovery.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {getActionButton(recovery.action)}

            {recovery.action !== "manual" && (
              <Button onClick={onManualEntry} variant="ghost">
                Enter Manually Instead
              </Button>
            )}

            {recovery.action === "manual" && (
              <Button onClick={onRetry} variant="ghost">
                Try Different URL
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
