import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

export type LegalDocSlug = "privacy" | "terms";

export interface LegalDocument {
  slug: LegalDocSlug;
  title: string;
  effectiveDate: string;
  lastUpdated: string;
  version: string;
  contactEmail?: string;
  body: string;
}

const LEGAL_DOCS_DIR_CANDIDATES = [
  path.resolve(process.cwd(), "legal"),
  path.resolve(process.cwd(), "..", "legal"),
  path.resolve(process.cwd(), "..", "..", "legal"),
];

async function readLegalDoc(slug: LegalDocSlug): Promise<string> {
  for (const dir of LEGAL_DOCS_DIR_CANDIDATES) {
    const filePath = path.join(dir, `${slug}.md`);
    try {
      return await readFile(filePath, "utf8");
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: unknown }).code)
          : "";
      if (code === "ENOENT") {
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Legal document "${slug}" not found. Checked: ${LEGAL_DOCS_DIR_CANDIDATES.join(", ")}`
  );
}

function parseFrontMatter(raw: string): {
  frontMatter: Record<string, string>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontMatter: {}, body: raw.trim() };
  }

  const block = match[1] || "";
  const frontMatter: Record<string, string> = {};

  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const idx = trimmed.indexOf(":");
    if (idx <= 0) {
      continue;
    }

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^['"]|['"]$/g, "");
    frontMatter[key] = value;
  }

  return {
    frontMatter,
    body: raw.slice(match[0].length).trim(),
  };
}

export const getLegalDocument = cache(
  async (slug: LegalDocSlug): Promise<LegalDocument> => {
    const raw = await readLegalDoc(slug);
    const { frontMatter, body } = parseFrontMatter(raw);

    return {
      slug,
      title:
        frontMatter.title || (slug === "privacy" ? "Privacy Policy" : "Terms of Service"),
      effectiveDate: frontMatter.effectiveDate || "",
      lastUpdated: frontMatter.lastUpdated || "",
      version: frontMatter.version || "",
      contactEmail: frontMatter.contactEmail || undefined,
      body,
    };
  }
);
