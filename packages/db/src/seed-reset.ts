import { pathToFileURL } from "node:url";
import { resetDatabase } from "./reset";
import { seedDatabase } from "./seed";

function isDirectExecution(metaUrl: string): boolean {
  const entryFile = process.argv[1];
  if (!entryFile) return false;
  return pathToFileURL(entryFile).href === metaUrl;
}

export async function resetAndSeedDatabase(): Promise<void> {
  await resetDatabase();
  await seedDatabase();
}

async function main(): Promise<void> {
  await resetAndSeedDatabase();
}

if (isDirectExecution(import.meta.url)) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
