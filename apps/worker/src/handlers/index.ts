import { registerHandler } from "../worker";
import { handleEnrichScreenshot } from "./enrich-screenshot";
import { handleEnrichReadme } from "./enrich-readme";
import { handleModerateAsync } from "./moderate-async";

export function registerAllHandlers() {
  registerHandler("enrich_screenshot", handleEnrichScreenshot);
  registerHandler("enrich_readme", handleEnrichReadme);
  registerHandler("moderate_async", handleModerateAsync);

  console.log("Registered job handlers: enrich_screenshot, enrich_readme, moderate_async");
}
