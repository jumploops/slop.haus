const POSITIVE_HINTS = [
  "screenshot",
  "preview",
  "demo",
  "ui",
  "app",
  "interface",
  "dashboard",
  "screen",
];

const NEGATIVE_HINTS = [
  "badge",
  "shields",
  "license",
  "build",
  "status",
  "coverage",
  "npm",
  "pypi",
  "github",
  "gitlab",
  "version",
];

export interface ReadmeImageCandidate {
  url: string;
  alt: string;
  score: number;
}

export function extractReadmeImageCandidates(
  markdown: string,
  repoUrl: string | null
): ReadmeImageCandidate[] {
  const candidates: ReadmeImageCandidate[] = [];
  const seen = new Set<string>();

  if (!markdown) {
    return [];
  }

  const markdownImageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const htmlImageRegex = /<img[^>]*\s+src=["']([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null;

  while ((match = markdownImageRegex.exec(markdown)) !== null) {
    const alt = match[1] || "";
    const rawUrl = match[2] || "";
    const normalized = normalizeReadmeImageUrl(rawUrl, repoUrl);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    candidates.push({
      url: normalized,
      alt,
      score: scoreImageCandidate(normalized, alt),
    });
  }

  while ((match = htmlImageRegex.exec(markdown)) !== null) {
    const rawUrl = match[1] || "";
    const normalized = normalizeReadmeImageUrl(rawUrl, repoUrl);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    candidates.push({
      url: normalized,
      alt: "",
      score: scoreImageCandidate(normalized, ""),
    });
  }

  return candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return 0;
  });
}

export function buildGithubOgUrl(repoUrl: string): string | null {
  const repo = parseRepoIdentifier(repoUrl);
  if (!repo || repo.host !== "github.com") {
    return null;
  }

  return `https://opengraph.githubassets.com/1/${repo.owner}/${repo.repo}`;
}

function normalizeReadmeImageUrl(rawUrl: string, repoUrl: string | null): string | null {
  let trimmed = rawUrl.trim();
  if (!trimmed) return null;

  trimmed = trimmed.replace(/^<|>$/g, "");
  if (!trimmed || trimmed.startsWith("data:")) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    trimmed = `https:${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return normalizeGitBlobUrl(trimmed) || trimmed;
  }

  if (!repoUrl) {
    return null;
  }

  const repo = parseRepoIdentifier(repoUrl);
  if (!repo) {
    return null;
  }

  const path = trimmed.replace(/^\.\//, "").replace(/^\//, "");

  if (repo.host === "github.com") {
    return `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/HEAD/${path}`;
  }

  if (repo.host === "gitlab.com") {
    return `https://gitlab.com/${repo.owner}/${repo.repo}/-/raw/HEAD/${path}`;
  }

  return null;
}

function normalizeGitBlobUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const segments = parsed.pathname.split("/").filter(Boolean);

    if (host === "github.com") {
      const blobIndex = segments.indexOf("blob");
      if (blobIndex > 1 && segments.length > blobIndex + 2) {
        const owner = segments[0];
        const repo = segments[1];
        const branch = segments[blobIndex + 1];
        const filePath = segments.slice(blobIndex + 2).join("/");
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      }
    }

    if (host === "gitlab.com") {
      const blobIndex = segments.indexOf("blob");
      if (blobIndex > 1 && segments.length > blobIndex + 2) {
        const owner = segments[0];
        const repo = segments[1];
        const branch = segments[blobIndex + 1];
        const filePath = segments.slice(blobIndex + 2).join("/");
        return `https://gitlab.com/${owner}/${repo}/-/raw/${branch}/${filePath}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function parseRepoIdentifier(repoUrl: string): { host: string; owner: string; repo: string } | null {
  try {
    const parsed = new URL(repoUrl);
    const host = parsed.hostname.replace(/^www\./, "");
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      return null;
    }
    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/i, "");
    return { host, owner, repo };
  } catch {
    return null;
  }
}

function scoreImageCandidate(url: string, alt: string): number {
  const haystack = `${alt} ${url}`.toLowerCase();
  let score = 0;

  for (const hint of POSITIVE_HINTS) {
    if (haystack.includes(hint)) score += 3;
  }

  for (const hint of NEGATIVE_HINTS) {
    if (haystack.includes(hint)) score -= 4;
  }

  const extension = url.split("?")[0]?.split("#")[0]?.split(".").pop()?.toLowerCase();
  if (extension && ["png", "jpg", "jpeg", "webp"].includes(extension)) {
    score += 1;
  }
  if (extension === "svg") {
    score -= 2;
  }

  return score;
}
