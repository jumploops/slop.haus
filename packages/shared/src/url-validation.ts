const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];

const BLOCKED_IP_PATTERNS = [
  /^10\.\d+\.\d+\.\d+$/, // 10.x.x.x
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/, // 172.16-31.x.x
  /^192\.168\.\d+\.\d+$/, // 192.168.x.x
];

const BLOCKED_DOMAINS = [
  // URL shorteners (potential abuse)
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
];

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
}

/**
 * Validate and normalize a URL for scraping
 */
export function validateUrl(url: string): UrlValidationResult {
  // Check URL format
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  // Check protocol
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, error: "Only HTTP/HTTPS URLs are allowed" };
  }

  // Check for blocked hosts
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.includes(host)) {
    return { valid: false, error: "Internal URLs are not allowed" };
  }

  // Check for blocked IP patterns
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(host)) {
      return { valid: false, error: "Private IP addresses are not allowed" };
    }
  }

  // Check for blocked domains
  for (const domain of BLOCKED_DOMAINS) {
    if (host === domain || host.endsWith(`.${domain}`)) {
      return { valid: false, error: "URL shorteners are not allowed" };
    }
  }

  // Normalize URL (remove trailing slash)
  const normalized = parsed.href.replace(/\/$/, "");

  return { valid: true, normalizedUrl: normalized };
}
