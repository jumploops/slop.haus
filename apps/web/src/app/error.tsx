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
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="text-center max-w-[480px]">
        <div className="text-danger mb-6">
          <ErrorIcon />
        </div>
        <h1 className="text-[1.75rem] font-bold mb-2">Something went wrong</h1>
        <p className="text-muted mb-6">
          An unexpected error occurred. Please try again or contact support if
          the problem persists.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={reset}>
            Try Again
          </Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/")}>
            Go Home
          </Button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 text-left p-4 bg-bg-secondary rounded-lg text-xs">
            <summary className="cursor-pointer text-muted mb-2">Error Details</summary>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all">{error.message}</pre>
            {error.digest && <p>Digest: {error.digest}</p>}
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
