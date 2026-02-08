import { pathToFileURL } from "node:url";
import { reset } from "drizzle-seed";
import { db } from "./index";
import * as schema from "./schema";

const LOCAL_DB_HOSTS = new Set(["", "localhost", "127.0.0.1", "::1", "db", "postgres"]);

function isLocalDatabaseUrl(databaseUrl: string): boolean {
  try {
    const parsed = new URL(databaseUrl);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol !== "postgres:" && protocol !== "postgresql:") {
      return false;
    }

    return LOCAL_DB_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function assertResetAllowed(databaseUrl: string | undefined, allowNonLocalReset: boolean): void {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (allowNonLocalReset) {
    return;
  }

  if (!isLocalDatabaseUrl(databaseUrl)) {
    throw new Error(
      "Refusing to reset a non-local database. Set ALLOW_DB_RESET=1 to bypass this check."
    );
  }
}

function isDirectExecution(metaUrl: string): boolean {
  const entryFile = process.argv[1];
  if (!entryFile) return false;
  return pathToFileURL(entryFile).href === metaUrl;
}

export async function resetDatabase(): Promise<void> {
  const allowNonLocalReset = process.env.ALLOW_DB_RESET === "1";
  const databaseUrl = process.env.DATABASE_URL;
  assertResetAllowed(databaseUrl, allowNonLocalReset);

  console.log("Resetting database schema...");
  await reset(db, schema);
  console.log("Database reset complete.");
}

async function main(): Promise<void> {
  await resetDatabase();
}

if (isDirectExecution(import.meta.url)) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
