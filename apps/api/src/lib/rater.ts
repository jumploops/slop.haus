import { createHmac, randomUUID } from "crypto";
import { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";

const RATER_COOKIE = "slop_rater";
const DEV_RATER_COOKIE = "slop_dev_rater";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return secret;
}

/**
 * Hash a rater ID using HMAC-SHA256
 */
export function hashRaterId(raterId: string): string {
  return createHmac("sha256", getSecret()).update(raterId).digest("hex");
}

/**
 * Get or create public rater identity
 * Returns the hashed rater key
 */
export function getOrCreatePublicRater(c: Context): string {
  let raterId = getCookie(c, RATER_COOKIE);

  if (!raterId) {
    raterId = randomUUID();
    setCookie(c, RATER_COOKIE, raterId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }

  return hashRaterId(raterId);
}

/**
 * Get public rater identity if exists (doesn't create)
 * Returns the hashed rater key or null
 */
export function getPublicRater(c: Context): string | null {
  const raterId = getCookie(c, RATER_COOKIE);
  return raterId ? hashRaterId(raterId) : null;
}

/**
 * Get dev rater identity if exists
 * Returns the hashed rater key or null
 */
export function getDevRater(c: Context): string | null {
  const raterId = getCookie(c, DEV_RATER_COOKIE);
  return raterId ? hashRaterId(raterId) : null;
}

/**
 * Issue a new dev rater credential
 * Called when a verified dev requests their credential
 */
export function issueDevCredential(c: Context): void {
  const raterId = randomUUID();
  setCookie(c, DEV_RATER_COOKIE, raterId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Check if dev credential exists
 */
export function hasDevCredential(c: Context): boolean {
  return !!getCookie(c, DEV_RATER_COOKIE);
}
