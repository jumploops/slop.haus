import { db } from "@slop/db";
import { tools } from "@slop/db/schema";
import { ilike, or } from "drizzle-orm";

// Common aliases for tool names
const TOOL_ALIASES: Record<string, string[]> = {
  typescript: ["ts", "typescript"],
  javascript: ["js", "javascript", "node", "nodejs"],
  python: ["py", "python", "python3"],
  react: ["react", "reactjs", "react.js"],
  nextjs: ["next", "nextjs", "next.js"],
  vue: ["vue", "vuejs", "vue.js"],
  angular: ["angular", "angularjs"],
  tailwind: ["tailwind", "tailwindcss"],
  openai: ["openai", "gpt", "chatgpt", "gpt-4", "gpt-3"],
  anthropic: ["anthropic", "claude"],
  vercel: ["vercel"],
  supabase: ["supabase"],
  prisma: ["prisma"],
  drizzle: ["drizzle", "drizzle-orm"],
  postgres: ["postgres", "postgresql", "pg"],
  mysql: ["mysql"],
  mongodb: ["mongodb", "mongo"],
  redis: ["redis"],
  docker: ["docker"],
  kubernetes: ["kubernetes", "k8s"],
  aws: ["aws", "amazon web services"],
  firebase: ["firebase"],
  stripe: ["stripe"],
  rust: ["rust"],
  go: ["go", "golang"],
  java: ["java"],
  kotlin: ["kotlin"],
  swift: ["swift"],
  flutter: ["flutter"],
  svelte: ["svelte", "sveltekit"],
  astro: ["astro"],
  remix: ["remix"],
  express: ["express", "expressjs"],
  fastapi: ["fastapi"],
  django: ["django"],
  flask: ["flask"],
  rails: ["rails", "ruby on rails"],
};

export async function matchToolsToDatabase(
  detectedTools: string[]
): Promise<string[]> {
  if (detectedTools.length === 0) return [];

  // Normalize detected tools
  const normalizedDetected = detectedTools.map((t) => t.toLowerCase().trim());

  // Build search conditions
  const searchTerms = new Set<string>();
  for (const detected of normalizedDetected) {
    searchTerms.add(detected);
    // Check if this matches any alias
    for (const [canonical, aliases] of Object.entries(TOOL_ALIASES)) {
      if (aliases.includes(detected)) {
        searchTerms.add(canonical);
      }
    }
  }

  // Query database for matching tools
  const conditions = Array.from(searchTerms).map((term) =>
    ilike(tools.slug, `%${term}%`)
  );

  if (conditions.length === 0) return [];

  const matchedTools = await db
    .select({ slug: tools.slug })
    .from(tools)
    .where(or(...conditions));

  // Return unique slugs, max 10
  const slugs = [...new Set(matchedTools.map((t) => t.slug))];
  return slugs.slice(0, 10);
}
