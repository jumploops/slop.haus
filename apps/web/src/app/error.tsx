"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
      <div className="border-2 border-dashed border-border bg-card p-6 text-center max-w-[520px]">
          <div className="mx-auto mb-4 h-16 w-16 border-2 border-destructive bg-destructive/10 text-destructive flex items-center justify-center">
            <ErrorIcon />
          </div>
          <h1 className="font-mono text-lg font-bold text-foreground">Something went wrong</h1>
          <p className="text-xs text-muted-foreground mt-3">
            An unexpected error occurred. Please try again or contact support if
            the problem persists.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-5">
            <Button variant="primary" onClick={reset}>
              Try Again
            </Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/")}>
              Go Home
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && (
            <details className="mt-6 text-left text-xs border-2 border-border bg-card p-3">
              <summary className="cursor-pointer text-muted-foreground font-bold">Error Details</summary>
              <div className="bg-background border-2 border-border p-3 mt-2">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all">{error.message}</pre>
                {error.digest && <p className="mt-2">Digest: {error.digest}</p>}
              </div>
            </details>
          )}
      </div>
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
