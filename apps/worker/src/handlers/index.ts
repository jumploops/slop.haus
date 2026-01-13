import { registerHandler } from "../worker";
import { handleEnrichScreenshot } from "./enrich-screenshot";
import { handleEnrichReadme } from "./enrich-readme";
import { handleModerateAsync } from "./moderate-async";
import { handleScrapeUrl } from "./scrape-url";
import { handleAnalyzeContent } from "./analyze-content";

export function registerAllHandlers() {
  registerHandler("enrich_screenshot", handleEnrichScreenshot);
  registerHandler("enrich_readme", handleEnrichReadme);
  registerHandler("moderate_async", handleModerateAsync);
  registerHandler("scrape_url", handleScrapeUrl);
  registerHandler("analyze_content", handleAnalyzeContent);

  console.log("Registered job handlers: enrich_screenshot, enrich_readme, moderate_async, scrape_url, analyze_content");
}
