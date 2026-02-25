import { db } from "@slop/db";
import { tools } from "@slop/db/schema";
import { eq } from "drizzle-orm";
import {
  TOOL_MAX_PER_PROJECT,
  isValidToolName,
  normalizeToolName,
} from "@slop/shared";

// Tool slug cache - avoids DB query on every analysis
let toolSlugCache: Set<string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached tool slugs, refreshing if stale
 */
async function getToolSlugs(): Promise<Set<string>> {
  const now = Date.now();
  if (toolSlugCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return toolSlugCache;
  }

  console.log("Refreshing tool slug cache...");
  const allTools = await db
    .select({ slug: tools.slug })
    .from(tools)
    .where(eq(tools.status, "active"));
  toolSlugCache = new Set(allTools.map((t) => t.slug));
  cacheTimestamp = now;
  console.log(`Tool cache loaded: ${toolSlugCache.size} tools`);

  return toolSlugCache;
}

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

  // Get cached tool slugs
  const allSlugs = await getToolSlugs();

  // Normalize detected tools (preserve display casing for unknown tags)
  const normalizedDetected = detectedTools
    .map((tool) => normalizeToolName(tool))
    .filter((tool) => isValidToolName(tool))
    .map((tool) => ({ raw: tool, lower: tool.toLowerCase() }));

  if (!normalizedDetected.length) return [];

  // Build search terms including aliases
  const searchTerms = new Set<string>();
  for (const { lower } of normalizedDetected) {
    searchTerms.add(lower);
    // Check if this matches any alias
    for (const [canonical, aliases] of Object.entries(TOOL_ALIASES)) {
      if (aliases.includes(lower)) {
        searchTerms.add(canonical);
      }
    }
  }

  // Match against cached slugs (in-memory, no DB query!)
  const matched = new Set<string>();
  const allSlugArray = [...allSlugs];

  for (const term of searchTerms) {
    if (term.length <= 3) {
      // Short terms: exact match only
      if (allSlugs.has(term)) {
        matched.add(term);
      }
    } else {
      // Longer terms: exact match or compound slug match
      for (const slug of allSlugArray) {
        if (
          slug === term ||
          slug.startsWith(`${term}-`) ||
          slug.endsWith(`-${term}`)
        ) {
          matched.add(slug);
        }
      }
    }
  }

  const matchedArray = [...matched];

  // Preserve unknown-but-valid tags for submit-time persistence.
  const unknownTags: string[] = [];
  for (const { raw, lower } of normalizedDetected) {
    const knownByExactSlug = allSlugs.has(lower);
    const knownByAlias = Object.entries(TOOL_ALIASES).some(([canonical, aliases]) =>
      aliases.includes(lower) && allSlugs.has(canonical)
    );
    const knownByCompoundMatch = lower.length > 3 && allSlugArray.some((slug) =>
      slug === lower || slug.startsWith(`${lower}-`) || slug.endsWith(`-${lower}`)
    );

    if (knownByExactSlug || knownByAlias || knownByCompoundMatch) {
      continue;
    }

    if (!unknownTags.some((tool) => tool.toLowerCase() === raw.toLowerCase())) {
      unknownTags.push(raw);
    }
  }

  // Known slugs first, then unknown names. Bounded by project tool cap.
  return [...matchedArray, ...unknownTags].slice(0, TOOL_MAX_PER_PROJECT);
}
