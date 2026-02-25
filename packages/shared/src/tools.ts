export const TOOL_MAX_PER_PROJECT = 10;
export const TOOL_MAX_NAME_LENGTH = 100;

// Allows spaces and common technology punctuation (e.g. C#, C++, Next.js, React Native).
export const TOOL_NAME_PATTERN = /^[\p{L}\p{N} .+#/()'&-]+$/u;

// Keep this list minimal and explicit to avoid false positives.
const DISALLOWED_TOOL_FRAGMENTS = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "dick",
  "penis",
  "porn",
  "nazi",
  "hitler",
];

export function normalizeToolName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isValidToolName(raw: string): boolean {
  const normalized = normalizeToolName(raw);
  if (!normalized || normalized.length > TOOL_MAX_NAME_LENGTH) return false;
  if (!TOOL_NAME_PATTERN.test(normalized)) return false;
  return !isDisallowedToolName(normalized);
}

export function isDisallowedToolName(raw: string): boolean {
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!normalized) return false;
  return DISALLOWED_TOOL_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

export function slugifyToolName(raw: string): string {
  return normalizeToolName(raw)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/&/g, " and ")
    .replace(/[./]/g, " ")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function canonicalizeToolInput(raw: string): {
  name: string;
  slug: string;
} | null {
  const name = normalizeToolName(raw);
  if (!isValidToolName(name)) return null;
  const slug = slugifyToolName(name);
  if (!slug) return null;
  return { name, slug };
}
