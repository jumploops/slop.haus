export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

// Keep this list limited to obvious unsafe/profane fragments for generated usernames only.
const DISALLOWED_GENERATED_FRAGMENTS = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "dick",
  "penis",
  "porn",
  "sex",
  "nazi",
  "hitler",
];

export interface UsernameValidationResult {
  valid: boolean;
  reason?: string;
}

export function normalizeUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s.-]+/g, "_")
    .replace(/[^a-z0-9_]+/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function validateUsername(username: string): UsernameValidationResult {
  if (!username) {
    return { valid: false, reason: "Username is required" };
  }

  if (username.length < USERNAME_MIN_LENGTH) {
    return {
      valid: false,
      reason: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
    };
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return {
      valid: false,
      reason: `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
    };
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return {
      valid: false,
      reason: "Username can only contain lowercase letters, numbers, and underscores",
    };
  }

  return { valid: true };
}

export function isDisallowedGeneratedUsername(username: string): boolean {
  return DISALLOWED_GENERATED_FRAGMENTS.some((fragment) =>
    username.includes(fragment)
  );
}

