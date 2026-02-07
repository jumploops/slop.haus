import { defineConfig } from "drizzle-kit";

const rawDatabaseUrl = process.env.DATABASE_URL;

if (!rawDatabaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const databaseUrl = withDefaultSslMode(rawDatabaseUrl);

function withDefaultSslMode(connectionString: string): string {
  const parsed = new URL(connectionString);
  const explicitSsl = parsed.searchParams.has("sslmode") || parsed.searchParams.has("ssl");

  if (explicitSsl) {
    return parsed.toString();
  }

  const overrideSslMode = process.env.DRIZZLE_SSL_MODE?.trim();
  if (overrideSslMode) {
    parsed.searchParams.set("sslmode", overrideSslMode);
    return parsed.toString();
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (localHosts.has(parsed.hostname)) {
    return parsed.toString();
  }

  // Remote Postgres providers (e.g., Render) generally require TLS.
  parsed.searchParams.set("sslmode", "require");
  return parsed.toString();
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
