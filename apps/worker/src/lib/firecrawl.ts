export interface FirecrawlScrapeOptions {
  url: string;
  formats: ("markdown" | "screenshot")[];
  screenshotOptions?: {
    fullPage?: boolean;
    width?: number;
    height?: number;
  };
}

export interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    screenshot?: string; // Base64 encoded image
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

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: options.url,
      formats: options.formats,
      ...(options.screenshotOptions && { screenshotOptions: options.screenshotOptions }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result as FirecrawlScrapeResult;
}
