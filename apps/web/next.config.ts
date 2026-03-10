import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

type RemotePattern = Exclude<
  NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number],
  URL
>;

loadRepoEnv();

function loadRepoEnv() {
  if (typeof process.loadEnvFile !== "function") {
    return;
  }

  const envPath = path.join(repoRoot, ".env");
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

function readEnv(key: string): string | null {
  const raw = process.env[key];
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveS3PublicUrl(): string | null {
  const explicit = readEnv("S3_PUBLIC_URL");
  if (explicit) {
    return explicit;
  }

  const bucket = readEnv("S3_BUCKET");
  if (!bucket) {
    return null;
  }

  const endpoint = readEnv("S3_ENDPOINT");
  if (endpoint) {
    return `${endpoint.replace(/\/$/, "")}/${bucket}`;
  }

  const region = readEnv("S3_REGION") || "us-east-1";
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

function buildRemotePattern(urlValue: string): RemotePattern {
  const url = new URL(urlValue);
  const pathname = url.pathname.replace(/\/$/, "");
  const protocol = url.protocol === "https:" ? "https" : "http";

  return {
    protocol,
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
    pathname: pathname ? `${pathname}/**` : "/**",
  };
}

function resolveImageRemotePatterns(): RemotePattern[] {
  const candidates = [
    readEnv("STORAGE_PUBLIC_URL") || "http://localhost:3001/uploads",
    resolveS3PublicUrl(),
  ].filter(Boolean) as string[];

  return candidates
    .filter((value, index, values) => values.indexOf(value) === index)
    .map((value) => buildRemotePattern(value));
}

const nextConfig: NextConfig = {
  transpilePackages: ["@slop/shared"],
  images: {
    remotePatterns: resolveImageRemotePatterns(),
  },
};

export default nextConfig;
