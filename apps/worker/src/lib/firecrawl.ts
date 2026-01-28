// v2 Format Types
export interface ScreenshotFormat {
  type: "screenshot";
  fullPage?: boolean;
  quality?: number;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface JsonFormat {
  type: "json";
  prompt: string;
  schema: Record<string, unknown>;
}

export type Format = "markdown" | "links" | "html" | "rawHtml" | ScreenshotFormat | JsonFormat;

export interface FirecrawlScrapeOptions {
  url: string;
  formats: Format[];
  onlyMainContent?: boolean;
  waitFor?: number;
  timeout?: number;
  maxAge?: number;
}

export interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    screenshot?: string; // URL to screenshot image (not base64)
    links?: string[];
    html?: string;
    rawHtml?: string;
    metadata?: {
      title?: string;
      description?: string;
      ogImage?: string;
      sourceURL?: string;
      statusCode?: number;
    };
  };
  error?: string;
}

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function isRetryableStatus(status: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof HttpError) {
    return isRetryableStatus(error.status);
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return true;
    }

    const message = error.message.toLowerCase();
    return (
      message.includes("timeout") ||
      message.includes("timed out") ||
      message.includes("rate limit") ||
      message.includes("429") ||
      message.includes("503") ||
      message.includes("502") ||
      message.includes("econnreset") ||
      message.includes("econnrefused") ||
      message.includes("network")
    );
  }

  return false;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function scrape(options: FirecrawlScrapeOptions): Promise<FirecrawlScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not set");
  }

  const body: Record<string, unknown> = {
    url: options.url,
    formats: options.formats,
  };

  // Add optional parameters
  if (options.onlyMainContent !== undefined) {
    body.onlyMainContent = options.onlyMainContent;
  }
  if (options.waitFor !== undefined) {
    body.waitFor = options.waitFor;
  }
  if (options.timeout !== undefined) {
    body.timeout = options.timeout;
  }
  if (options.maxAge !== undefined) {
    body.maxAge = options.maxAge;
  }

  const requestTimeoutMs = (options.timeout ?? 45000) + 5000;

  const response = await fetchWithTimeout("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  }, requestTimeoutMs);

  if (!response.ok) {
    const errorText = await response.text();
    throw new HttpError(
      response.status,
      `Firecrawl API error: ${response.status} ${errorText}`
    );
  }

  const result = await response.json();
  return result as FirecrawlScrapeResult;
}
