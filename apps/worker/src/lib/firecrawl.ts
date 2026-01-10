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
    screenshot?: string; // Base64 encoded image
    links?: string[];
    html?: string;
    rawHtml?: string;
    metadata?: {
      title?: string;
      description?: string;
      ogImage?: string;
    };
  };
  error?: string;
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

  const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result as FirecrawlScrapeResult;
}
