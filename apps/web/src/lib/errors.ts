/**
 * Convert API/system errors to user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("rate limit")) {
      return "You've analyzed too many URLs recently. Please wait a bit and try again.";
    }
    if (message.includes("not found")) {
      return "We couldn't find that page. Please check the URL and try again.";
    }
    if (message.includes("timeout")) {
      return "The page took too long to load. Try again or use manual entry.";
    }
    if (message.includes("blocked") || message.includes("forbidden")) {
      return "This website doesn't allow automated access. Try manual entry instead.";
    }
    if (message.includes("github not linked")) {
      return "Please link your GitHub account to submit projects.";
    }
    if (message.includes("unauthorized")) {
      return "Please sign in to continue.";
    }
    if (message.includes("invalid url")) {
      return "Please enter a valid URL.";
    }
    if (message.includes("internal url") || message.includes("private ip")) {
      return "Internal URLs are not allowed.";
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export type RecoveryAction = "retry" | "manual" | "wait";

export interface ErrorRecovery {
  message: string;
  action: RecoveryAction;
  waitSeconds?: number;
}

/**
 * Get recovery suggestions based on error code
 */
export function getErrorRecovery(code?: string): ErrorRecovery {
  switch (code) {
    case "SCRAPE_FAILED":
      return {
        message: "We couldn't read that page.",
        action: "manual",
      };
    case "ANALYSIS_FAILED":
      return {
        message: "We couldn't extract project details.",
        action: "retry",
      };
    case "TIMEOUT":
      return {
        message: "Analysis took too long.",
        action: "retry",
      };
    case "RATE_LIMIT":
      return {
        message: "Too many requests.",
        action: "wait",
        waitSeconds: 60,
      };
    case "DRAFT_NOT_FOUND":
      return {
        message: "Draft not found or expired.",
        action: "manual",
      };
    case "INVALID_URL":
      return {
        message: "Invalid URL format.",
        action: "retry",
      };
    default:
      return {
        message: "Something went wrong.",
        action: "retry",
      };
  }
}
