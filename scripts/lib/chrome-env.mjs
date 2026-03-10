import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "../..");

export function loadRepoEnv() {
  const envPath = path.join(repoRoot, ".env");
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envPath);
  }
}

export function readEnv(key, fallback) {
  const raw = process.env[key];
  if (raw === undefined) {
    return fallback;
  }
  return raw.trim();
}

export function resolveProjectPath(value) {
  if (path.isAbsolute(value)) {
    return value;
  }
  return path.resolve(repoRoot, value);
}

export function resolveChromeBin() {
  const configured = readEnv("CHROME_BIN", "");
  if (configured) {
    const configuredPath = resolveMaybeAbsolute(configured);
    if (!fs.existsSync(configuredPath)) {
      throw new Error(
        `CHROME_BIN does not exist: ${configuredPath}\n` +
          "Update CHROME_BIN in .env to point at your local Chrome executable."
      );
    }
    return configuredPath;
  }

  const candidates = getPlatformChromeCandidates();
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not find a Chrome binary. Set CHROME_BIN in .env.\nChecked: ${candidates.join(", ")}`
  );
}

function resolveMaybeAbsolute(value) {
  if (path.isAbsolute(value)) {
    return value;
  }
  return path.resolve(repoRoot, value);
}

function getPlatformChromeCandidates() {
  switch (process.platform) {
    case "darwin":
      return [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        path.join(
          process.env.HOME || "",
          "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        ),
      ];
    case "win32": {
      const localAppData = process.env.LOCALAPPDATA || "";
      const programFiles = process.env.ProgramFiles || "C:\\Program Files";
      const programFilesX86 =
        process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

      return [
        path.join(programFiles, "Google/Chrome/Application/chrome.exe"),
        path.join(programFilesX86, "Google/Chrome/Application/chrome.exe"),
        path.join(localAppData, "Google/Chrome/Application/chrome.exe"),
      ];
    }
    default:
      return [
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
      ];
  }
}
