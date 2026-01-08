import { db } from "./index";
import { tools } from "./schema";

const commonTools = [
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

export async function seedTools() {
  console.log("Seeding tools...");

  for (const tool of commonTools) {
    await db
      .insert(tools)
      .values(tool)
      .onConflictDoNothing({ target: tools.slug });
  }

  console.log(`Seeded ${commonTools.length} tools`);
}

// Run if executed directly
seedTools()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
