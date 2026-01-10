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
    <div className="error-page">
      <div className="error-content">
        <ErrorIcon />
        <h1>Something went wrong</h1>
        <p>
          An unexpected error occurred. Please try again or contact support if
          the problem persists.
        </p>
        <div className="error-actions">
          <Button variant="primary" onClick={reset}>
            Try Again
          </Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/")}>
            Go Home
          </Button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="error-details">
            <summary>Error Details</summary>
            <pre>{error.message}</pre>
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
