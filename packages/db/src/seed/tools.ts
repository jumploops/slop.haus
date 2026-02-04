import { inArray } from "drizzle-orm";
import { tools } from "../schema";
import { insertInChunks, uuidFromSeed } from "./utils";

const toolSeeds = [
  // AI Tools
  { name: "Claude", slug: "claude" },
  { name: "ChatGPT", slug: "chatgpt" },
  { name: "Cursor", slug: "cursor" },
  { name: "GitHub Copilot", slug: "github-copilot" },
  { name: "v0", slug: "v0" },
  { name: "Bolt", slug: "bolt" },
  { name: "Replit Agent", slug: "replit-agent" },
  { name: "Windsurf", slug: "windsurf" },

  // Frameworks
  { name: "Next.js", slug: "nextjs" },
  { name: "React", slug: "react" },
  { name: "Vue", slug: "vue" },
  { name: "Svelte", slug: "svelte" },
  { name: "Astro", slug: "astro" },
  { name: "Remix", slug: "remix" },
  { name: "Nuxt", slug: "nuxt" },
  { name: "SvelteKit", slug: "sveltekit" },

  // Backend
  { name: "Node.js", slug: "nodejs" },
  { name: "Express", slug: "express" },
  { name: "Hono", slug: "hono" },
  { name: "Fastify", slug: "fastify" },
  { name: "tRPC", slug: "trpc" },

  // Databases
  { name: "PostgreSQL", slug: "postgresql" },
  { name: "MySQL", slug: "mysql" },
  { name: "SQLite", slug: "sqlite" },
  { name: "MongoDB", slug: "mongodb" },
  { name: "Supabase", slug: "supabase" },
  { name: "PlanetScale", slug: "planetscale" },
  { name: "Neon", slug: "neon" },
  { name: "Turso", slug: "turso" },

  // ORMs
  { name: "Drizzle", slug: "drizzle" },
  { name: "Prisma", slug: "prisma" },

  // Styling
  { name: "Tailwind CSS", slug: "tailwindcss" },
  { name: "shadcn/ui", slug: "shadcn-ui" },
  { name: "Radix UI", slug: "radix-ui" },

  // Deployment
  { name: "Vercel", slug: "vercel" },
  { name: "Netlify", slug: "netlify" },
  { name: "Cloudflare", slug: "cloudflare" },
  { name: "Railway", slug: "railway" },
  { name: "Fly.io", slug: "fly-io" },
  { name: "Render", slug: "render" },

  // Auth
  { name: "Better Auth", slug: "better-auth" },
  { name: "NextAuth", slug: "nextauth" },
  { name: "Clerk", slug: "clerk" },
  { name: "Auth0", slug: "auth0" },

  // Other
  { name: "TypeScript", slug: "typescript" },
  { name: "Zod", slug: "zod" },
  { name: "React Query", slug: "react-query" },
];

export type ToolRow = typeof tools.$inferInsert;

export async function seedTools(db: any): Promise<Map<string, string>> {
  const rows: ToolRow[] = toolSeeds.map((tool) => ({
    id: uuidFromSeed(`tool:${tool.slug}`),
    ...tool,
  }));

  await insertInChunks(db, tools, rows);

  const slugs = toolSeeds.map((tool) => tool.slug);
  const found = await db
    .select({ id: tools.id, slug: tools.slug })
    .from(tools)
    .where(inArray(tools.slug, slugs));

  return new Map(found.map((tool) => [tool.slug, tool.id]));
}

export const commonToolSlugs = toolSeeds.map((tool) => tool.slug);
