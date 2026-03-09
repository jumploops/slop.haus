import { spawn } from "node:child_process";
import fs from "node:fs";
import {
  loadRepoEnv,
  readEnv,
  repoRoot,
  resolveChromeBin,
  resolveProjectPath,
} from "./lib/chrome-env.mjs";

loadRepoEnv();

const chromeBin = resolveChromeBin();
const userDataDir = resolveProjectPath(readEnv("CHROME_USER_DATA_DIR", ".chrome/slop-haus"));
const remoteDebuggingPort = readEnv("CHROME_REMOTE_DEBUGGING_PORT", "9222");
const startUrl = readEnv("CHROME_START_URL", "http://localhost:3000/");

fs.mkdirSync(userDataDir, { recursive: true });

const args = [
  `--user-data-dir=${userDataDir}`,
  "--no-first-run",
  "--no-default-browser-check",
];

if (remoteDebuggingPort.length > 0) {
  args.push(`--remote-debugging-port=${remoteDebuggingPort}`);
}

if (startUrl.length > 0) {
  args.push(startUrl);
}

const child = spawn(chromeBin, args, {
  cwd: repoRoot,
  detached: true,
  stdio: "ignore",
});

child.unref();

console.log("Launched Chrome with repo profile.");
console.log(`CHROME_BIN=${chromeBin}`);
console.log(`CHROME_USER_DATA_DIR=${userDataDir}`);
if (remoteDebuggingPort.length > 0) {
  console.log(`CHROME_REMOTE_DEBUGGING_PORT=${remoteDebuggingPort}`);
}
if (startUrl.length > 0) {
  console.log(`CHROME_START_URL=${startUrl}`);
}
