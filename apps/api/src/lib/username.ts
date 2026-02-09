import { randomInt } from "node:crypto";
import { db } from "@slop/db";
import { user } from "@slop/db/schema";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  isDisallowedGeneratedUsername,
  normalizeUsername,
  validateUsername,
} from "@slop/shared";
import { and, ne, sql } from "drizzle-orm";

const ADJECTIVES = [
  "amber",
  "brisk",
  "bubbly",
  "calm",
  "clever",
  "cosmic",
  "crisp",
  "daring",
  "electric",
  "fuzzy",
  "gentle",
  "glossy",
  "happy",
  "lively",
  "lucky",
  "mellow",
  "minty",
  "neon",
  "nimble",
  "pixel",
  "playful",
  "quiet",
  "rapid",
  "shiny",
  "silver",
  "smart",
  "smooth",
  "snappy",
  "sunny",
  "tidy",
  "vivid",
  "vocal",
  "wavy",
  "zesty",
] as const;

const NOUNS = [
  "badger",
  "beam",
  "bot",
  "builder",
  "comet",
  "craft",
  "drift",
  "echo",
  "forge",
  "fox",
  "glider",
  "groove",
  "harbor",
  "kit",
  "lab",
  "maker",
  "mint",
  "moose",
  "nova",
  "otter",
  "pilot",
  "pixel",
  "puffin",
  "rocket",
  "ship",
  "sparrow",
  "sprout",
  "stack",
  "studio",
  "tiger",
  "trail",
  "vibe",
  "wave",
  "whale",
] as const;

type UsernameSource = "github" | "google_random" | "manual" | "seed";

function truncateUsername(value: string): string {
  if (value.length <= USERNAME_MAX_LENGTH) return value;
  return value.slice(0, USERNAME_MAX_LENGTH);
}

function withSuffix(base: string, suffix: string): string {
  const maxBaseLength = USERNAME_MAX_LENGTH - suffix.length - 1;
  const safeBase = base.slice(0, Math.max(maxBaseLength, USERNAME_MIN_LENGTH));
  return `${safeBase}_${suffix}`;
}

async function usernameExists(
  usernameValue: string,
  excludeUserId?: string
): Promise<boolean> {
  const normalized = normalizeUsername(usernameValue);
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(
      excludeUserId
        ? and(
            sql`lower(${user.username}) = ${normalized}`,
            ne(user.id, excludeUserId)
          )
        : sql`lower(${user.username}) = ${normalized}`
    )
    .limit(1);

  return Boolean(existing);
}

export async function isUsernameAvailable(
  usernameValue: string,
  options?: { excludeUserId?: string }
): Promise<boolean> {
  return !(await usernameExists(usernameValue, options?.excludeUserId));
}

export function generateRandomUsernameCandidate(): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const adjective = ADJECTIVES[randomInt(0, ADJECTIVES.length)];
    const noun = NOUNS[randomInt(0, NOUNS.length)];
    const number = randomInt(10, 9999);
    const candidate = normalizeUsername(`${adjective}_${noun}_${number}`);
    if (!isDisallowedGeneratedUsername(candidate)) {
      return truncateUsername(candidate);
    }
  }

  return `user_${randomInt(100000, 999999)}`;
}

export async function ensureUniqueUsername(
  candidate: string,
  options?: { excludeUserId?: string }
): Promise<string> {
  const normalized = normalizeUsername(candidate);
  const validation = validateUsername(normalized);
  const base = validation.valid
    ? normalized
    : generateRandomUsernameCandidate();

  if (!(await usernameExists(base, options?.excludeUserId))) {
    return base;
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = String(randomInt(10, 9999));
    const next = withSuffix(base, suffix);
    if (!(await usernameExists(next, options?.excludeUserId))) {
      return next;
    }
  }

  const fallback = withSuffix("user", String(randomInt(100000, 999999)));
  if (!(await usernameExists(fallback, options?.excludeUserId))) {
    return fallback;
  }

  throw new Error("Unable to generate a unique username");
}

export function parseUsernameSource(value: unknown): UsernameSource {
  if (
    value === "github" ||
    value === "google_random" ||
    value === "manual" ||
    value === "seed"
  ) {
    return value;
  }
  return "manual";
}

export function usernameCandidateFromEmail(email: string): string {
  const [localPart] = email.split("@");
  return normalizeUsername(localPart || "");
}
