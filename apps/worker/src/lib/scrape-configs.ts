import type { UrlType } from "@slop/shared";
import type { Format } from "./firecrawl";

export interface ScrapeConfig {
  formats: Format[];
  onlyMainContent: boolean;
  timeout: number;
  waitFor?: number;
}

/**
 * Get the appropriate Firecrawl configuration for a given URL type
 */
export function getScrapeConfig(urlType: UrlType): ScrapeConfig {
  switch (urlType) {
    case "github":
    case "gitlab":
      // Repos: just need markdown content, no screenshot needed
      return {
        formats: ["markdown"],
        onlyMainContent: false, // Need full page for metadata
        timeout: 30000,
      };

    case "npm":
    case "pypi":
      // Package pages: markdown content
      return {
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
      };

    case "chrome_webstore":
    case "steam":
      // Storefronts: both markdown and screenshot, wait for dynamic content
      return {
        formats: [
          "markdown",
          {
            type: "screenshot",
            fullPage: false,
            viewport: { width: 1280, height: 800 },
          },
        ],
        onlyMainContent: true,
        timeout: 45000,
        waitFor: 2000, // Wait for dynamic content to load
      };

    case "live_site":
    default:
      // Live sites: both markdown and screenshot
      return {
        formats: [
          "markdown",
          {
            type: "screenshot",
            fullPage: false,
            viewport: { width: 1280, height: 800 },
          },
        ],
        onlyMainContent: true,
        timeout: 60000,
      };
  }
}
