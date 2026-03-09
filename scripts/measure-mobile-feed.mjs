import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import {
  loadRepoEnv,
  readEnv,
  repoRoot,
  resolveChromeBin,
  resolveProjectPath,
} from "./lib/chrome-env.mjs";

loadRepoEnv();

const chromeBin = resolveChromeBin();
const cliArgs = process.argv.slice(2);
const dismissIntro = cliArgs.includes("--dismiss-intro");
const startUrl =
  cliArgs.find((arg) => !arg.startsWith("--")) || readEnv("CHROME_START_URL", "http://localhost:3000/");
const scenarioLabel = dismissIntro ? "intro-dismissed" : "default";
const artifactsDir = resolveProjectPath(".chrome/measurements");
const profileRoot = resolveProjectPath(readEnv("CHROME_USER_DATA_DIR", ".chrome/slop-haus"));
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = path.join(profileRoot, "phase-1-mobile", runId);
const outputFile = path.join(artifactsDir, `mobile-feed-${scenarioLabel}-${runId}.json`);

fs.mkdirSync(runDir, { recursive: true });
fs.mkdirSync(artifactsDir, { recursive: true });

const chrome = spawn(
  chromeBin,
  [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${runDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--mute-audio",
    "about:blank",
  ],
  {
    cwd: repoRoot,
    stdio: ["ignore", "ignore", "pipe"],
  }
);

let stderr = "";
chrome.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

let closed = false;
chrome.on("exit", () => {
  closed = true;
});

process.on("exit", () => {
  if (!closed) {
    chrome.kill("SIGTERM");
  }
});

const requests = new Map();
const events = [];
let client = null;
let rawProbe = null;
let metrics = { metrics: [] };
let summary = null;
let failure = null;

try {
  const { port, wsUrl } = await waitForDevTools(runDir);
  const pageTarget = await getPageTarget(port);
  client = await createCdpClient(pageTarget.webSocketDebuggerUrl || wsUrl);

  client.on("Network.requestWillBeSent", (params) => {
    requests.set(params.requestId, {
      requestId: params.requestId,
      url: params.request.url,
      method: params.request.method,
      type: params.type || null,
      initiator: params.initiator?.type || null,
      documentURL: params.documentURL || null,
      wallTime: params.wallTime || null,
    });
  });

  client.on("Network.responseReceived", (params) => {
    const existing = requests.get(params.requestId) || { requestId: params.requestId };
    requests.set(params.requestId, {
      ...existing,
      url: params.response.url,
      type: params.type || existing.type || null,
      status: params.response.status,
      mimeType: params.response.mimeType,
      headers: params.response.headers,
      fromDiskCache: params.response.fromDiskCache || false,
      fromServiceWorker: params.response.fromServiceWorker || false,
      protocol: params.response.protocol || null,
    });
  });

  client.on("Network.loadingFinished", (params) => {
    const existing = requests.get(params.requestId) || { requestId: params.requestId };
    requests.set(params.requestId, {
      ...existing,
      encodedDataLength: params.encodedDataLength,
    });
  });

  client.on("Network.loadingFailed", (params) => {
    const existing = requests.get(params.requestId) || { requestId: params.requestId };
    requests.set(params.requestId, {
      ...existing,
      failed: true,
      errorText: params.errorText,
      canceled: params.canceled || false,
    });
  });

  client.on("Page.loadEventFired", () => {
    events.push({ type: "loadEventFired", ts: Date.now() });
  });
  client.on("Page.frameStartedLoading", (params) => {
    events.push({ type: "frameStartedLoading", frameId: params.frameId, ts: Date.now() });
  });
  client.on("Page.frameStoppedLoading", (params) => {
    events.push({ type: "frameStoppedLoading", frameId: params.frameId, ts: Date.now() });
  });
  client.on("Page.frameNavigated", (params) => {
    events.push({
      type: "frameNavigated",
      frameId: params.frame.id,
      url: params.frame.url,
      ts: Date.now(),
    });
  });

  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Network.enable");
  await client.send("Performance.enable");
  await client.send("Log.enable");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  await client.send("Network.clearBrowserCache").catch(() => {});
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
    positionX: 0,
    positionY: 0,
    screenOrientation: {
      type: "portraitPrimary",
      angle: 0,
    },
  });
  await client.send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 1,
  });
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await client.send("Emulation.setUserAgentOverride", {
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/122.0.0.0 Mobile/15E148 Safari/604.1",
    platform: "iPhone",
    acceptLanguage: "en-US,en",
  });
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 1.6 * 1024 * 1024 / 8,
    uploadThroughput: 750 * 1024 / 8,
    connectionType: "cellular4g",
  });
  await client.send("Page.addScriptToEvaluateOnNewDocument", {
    source: getPerfProbeSource(),
  });
  if (dismissIntro) {
    await seedDismissedIntroCookie(client, startUrl);
    await client.send("Page.addScriptToEvaluateOnNewDocument", {
      source: getDismissIntroSource(startUrl),
    });
  }

  await client.send("Page.navigate", { url: startUrl });
  await waitForDocumentReady(client, startUrl, 20000);
  await sleep(5000);

  rawProbe = await readPerfProbe(client);
  metrics = await client.send("Performance.getMetrics");

  summary = buildSummary({
    scenarioLabel,
    url: startUrl,
    rawProbe,
    requestList: Array.from(requests.values()),
    metrics,
    outputFile,
    runDir,
  });

  writeArtifact({
    outputFile,
    status: "success",
    runDir,
    url: startUrl,
    scenarioLabel,
    rawProbe,
    metrics,
    requests: Array.from(requests.values()),
    summary,
    events,
    stderr,
  });

  console.log(`Saved measurement: ${outputFile}`);
  console.log(`Scenario: ${scenarioLabel}`);
  console.log(
    `LCP: ${formatMs(summary.lcpMs)} ${summary.lcpElement ? `(${summary.lcpElement})` : ""}`
  );
  console.log(`FCP: ${formatMs(summary.fcpMs)}`);
  console.log(`CLS: ${summary.cls ?? "n/a"}`);
  console.log(`Document TTFB: ${formatMs(summary.documentResponseStartMs)}`);
  console.log(`Image requests: ${summary.imageRequestCount}`);
  console.log(`Hidden image nodes requested: ${summary.hiddenRequestedImages.length}`);
  console.log(`Unique hidden image assets requested: ${summary.uniqueHiddenRequestedImageCount}`);
  if (summary.introMarkEntries.length > 0) {
    console.log(
      `Intro marks: ${summary.introMarkEntries
        .map((entry) => `${entry.name}@${formatMs(entry.startTime)}`)
        .join(", ")}`
    );
  }
  if (summary.slopGooMeasureCount > 0) {
    console.log(
      `SlopGoo measures: ${summary.slopGooMeasureCount} calls, ${formatMs(summary.slopGooTotalDurationMs)} total, ${formatMs(summary.slopGooMaxDurationMs)} max`
    );
    console.log(`SlopGoo triggers: ${JSON.stringify(summary.slopGooTriggerCounts)}`);
    console.log(
      `SlopGoo timing: first=${formatMs(summary.slopGooFirstMeasureStartMs)}, lastEnd=${formatMs(summary.slopGooLastMeasureEndMs)}`
    );
  }
  for (const hiddenImageUrl of summary.uniqueHiddenRequestedImageUrls.slice(0, 5)) {
    console.log(`Hidden image requested: ${hiddenImageUrl}`);
  }
  for (const cacheFinding of summary.cacheFindings.slice(0, 5)) {
    console.log(
      `Cache header: ${cacheFinding.cacheControl || "<missing>"} | ${cacheFinding.url}`
    );
  }
} catch (error) {
  failure = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack || null : null,
  };

  if (client) {
    rawProbe = rawProbe || (await readPerfProbe(client).catch(() => null));
    metrics = metrics.metrics.length > 0 ? metrics : await client.send("Performance.getMetrics").catch(() => ({ metrics: [] }));
  }

  summary = buildSummary({
    scenarioLabel,
    url: startUrl,
    rawProbe,
    requestList: Array.from(requests.values()),
    metrics,
    outputFile,
    runDir,
  });

  writeArtifact({
    outputFile,
    status: "error",
    runDir,
    url: startUrl,
    scenarioLabel,
    rawProbe,
    metrics,
    requests: Array.from(requests.values()),
    summary,
    events,
    stderr,
    failure,
  });

  console.error(`Saved partial measurement: ${outputFile}`);
  console.error(failure.message);
  throw error;
} finally {
  if (client) {
    await client.send("Browser.close").catch(() => {});
  }
  await sleep(300);
  if (!closed) {
    chrome.kill("SIGTERM");
  }
}

function buildSummary({ scenarioLabel, url, rawProbe, requestList, metrics, outputFile, runDir }) {
  const lcpEntry = rawProbe?.lcpEntries?.at(-1) || null;
  const fcpEntry =
    rawProbe?.paintEntries?.find((entry) => entry.name === "first-contentful-paint") || null;
  const navigation = rawProbe?.navigation || null;
  const imageStates = rawProbe?.imageStates || [];
  const markEntries = rawProbe?.markEntries || [];
  const introMarkEntries = markEntries.filter((entry) => entry.name.startsWith("feed:intro:"));
  const slopSamples = rawProbe?.slopDebug?.samples || [];
  const slopMeasureSamples = slopSamples.filter((sample) => sample.name === "slop-goo:measure");
  const imageRequests = requestList.filter((request) => request.type === "Image");
  const hiddenRequestedImages = imageStates.filter((image) => {
    if (image.visible) {
      return false;
    }
    return imageRequests.some((request) => urlsMatch(request.url, image.src));
  });
  const uniqueHiddenRequestedImageUrls = [...new Set(hiddenRequestedImages.map((image) => image.src))];

  const cacheFindings = imageRequests
    .map((request) => ({
      url: request.url,
      cacheControl: headerValue(request.headers, "cache-control"),
      mimeType: request.mimeType || null,
      encodedDataLength: request.encodedDataLength || null,
    }))
    .filter((request) => Boolean(request.url));

  const slopGooTriggerCounts = slopMeasureSamples.reduce((acc, sample) => {
    const trigger = sample.detail?.trigger || "unknown";
    acc[trigger] = (acc[trigger] || 0) + 1;
    return acc;
  }, {});

  const slopGooMeasureDurations = slopMeasureSamples.map((sample) => sample.duration || 0);
  const slopGooMeasureStarts = slopMeasureSamples.map((sample) => sample.startTime || 0);

  return {
    scenarioLabel,
    url,
    outputFile,
    runDir,
    lcpMs: lcpEntry?.startTime ?? null,
    lcpElement: lcpEntry?.elementSummary ?? null,
    fcpMs: fcpEntry?.startTime ?? null,
    cls: rawProbe?.cls ?? null,
    documentResponseStartMs: navigation?.responseStart ?? null,
    documentDomContentLoadedMs: navigation?.domContentLoadedEventEnd ?? null,
    documentLoadMs: navigation?.loadEventEnd ?? null,
    imageRequestCount: imageRequests.length,
    hiddenRequestedImages,
    uniqueHiddenRequestedImageUrls,
    uniqueHiddenRequestedImageCount: uniqueHiddenRequestedImageUrls.length,
    cacheFindings,
    introMarkEntries,
    slopGooMeasureCount: slopMeasureSamples.length,
    slopGooTotalDurationMs: slopGooMeasureDurations.reduce((sum, value) => sum + value, 0),
    slopGooMaxDurationMs: slopGooMeasureDurations.length ? Math.max(...slopGooMeasureDurations) : 0,
    slopGooFirstMeasureStartMs: slopGooMeasureStarts.length ? Math.min(...slopGooMeasureStarts) : null,
    slopGooLastMeasureEndMs: slopMeasureSamples.length
      ? Math.max(...slopMeasureSamples.map((sample) => (sample.startTime || 0) + (sample.duration || 0)))
      : null,
    slopGooTriggerCounts,
    slopGooSamples: slopSamples,
    apiRequests: requestList.filter((request) => request.url?.includes("/api/v1/projects")),
    performanceMetricNames: (metrics.metrics || []).map((metric) => metric.name),
  };
}

function writeArtifact({
  outputFile,
  status,
  runDir,
  url,
  scenarioLabel,
  rawProbe,
  metrics,
  requests,
  summary,
  events,
  stderr,
  failure = null,
}) {
  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        status,
        url,
        scenarioLabel,
        runDir,
        probe: rawProbe,
        performanceMetrics: metrics.metrics || [],
        requests,
        summary,
        events,
        stderr: stderr.trim() || null,
        failure,
      },
      null,
      2
    )
  );
}

function formatMs(value) {
  if (typeof value !== "number") {
    return "n/a";
  }
  return `${value.toFixed(1)} ms`;
}

function headerValue(headers, key) {
  if (!headers) {
    return null;
  }
  const match = Object.entries(headers).find(([headerKey]) => headerKey.toLowerCase() === key);
  return match ? String(match[1]) : null;
}

function urlsMatch(a, b) {
  try {
    return new URL(a).href === new URL(b).href;
  } catch {
    return a === b;
  }
}

function getPerfProbeSource() {
  return `
    (() => {
      const probe = {
        lcpEntries: [],
        paintEntries: [],
        cls: 0,
        navigation: null,
        imageStates: [],
      };

      function summarizeElement(el) {
        if (!el) return null;
        const tag = el.tagName ? el.tagName.toLowerCase() : "unknown";
        const id = el.id ? \`#\${el.id}\` : "";
        const className = typeof el.className === "string"
          ? el.className.trim().split(/\\s+/).filter(Boolean).slice(0, 3).map((name) => \`.\${name}\`).join("")
          : "";
        const text = (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 80);
        const src = "currentSrc" in el ? (el.currentSrc || el.src || null) : null;
        return [tag + id + className, text, src].filter(Boolean).join(" | ");
      }

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          probe.lcpEntries.push({
            name: entry.name,
            startTime: entry.startTime,
            renderTime: entry.renderTime,
            loadTime: entry.loadTime,
            size: entry.size,
            url: entry.url || null,
            elementSummary: summarizeElement(entry.element),
          });
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          probe.paintEntries.push({
            name: entry.name,
            startTime: entry.startTime,
          });
        }
      }).observe({ type: "paint", buffered: true });

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            probe.cls += entry.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });

      window.addEventListener("load", () => {
        const nav = performance.getEntriesByType("navigation")[0];
        if (nav) {
          probe.navigation = {
            responseStart: nav.responseStart,
            domContentLoadedEventEnd: nav.domContentLoadedEventEnd,
            loadEventEnd: nav.loadEventEnd,
          };
        }

        probe.imageStates = Array.from(document.images).map((img) => {
          const rect = img.getBoundingClientRect();
          return {
            src: img.currentSrc || img.src || null,
            alt: img.alt || "",
            visible:
              img.getClientRects().length > 0 &&
              rect.width > 0 &&
              rect.height > 0 &&
              getComputedStyle(img).visibility !== "hidden",
            width: rect.width,
            height: rect.height,
            loading: img.getAttribute("loading"),
            decoding: img.getAttribute("decoding"),
          };
        });
      }, { once: true });

      window.__slopPerfProbe = probe;
    })();
  `;
}

function getDismissIntroSource(startUrl) {
  const origin = new URL(startUrl).origin;

  return `
    (() => {
      try {
        if (location.origin === ${JSON.stringify(origin)}) {
          localStorage.setItem("slop:feedIntroDismissed", "true");
        }
      } catch {
        // Ignore localStorage failures during probe setup.
      }
    })();
  `;
}

async function seedDismissedIntroCookie(client, startUrl) {
  const startUrlObject = new URL(startUrl);
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;

  await client.send("Network.setCookie", {
    name: "slop_feed_intro_dismissed",
    value: "1",
    url: startUrlObject.origin,
    path: "/",
    secure: startUrlObject.protocol === "https:",
    sameSite: "Lax",
    expires,
  });
}

async function readPerfProbe(client) {
  const perfProbe = await client.send("Runtime.evaluate", {
    expression: `
      JSON.stringify((() => {
        const probe = window.__slopPerfProbe || null;
        if (!probe) {
          return null;
        }

        return {
          ...probe,
          markEntries: performance
            .getEntriesByType("mark")
            .filter((entry) => entry.name.startsWith("feed:intro:"))
            .map((entry) => ({
              name: entry.name,
              startTime: entry.startTime,
            })),
          slopDebug: window.__slopPerfDebug || null,
        };
      })())
    `,
    returnByValue: true,
  });
  return perfProbe.result?.value ? JSON.parse(perfProbe.result.value) : null;
}

async function waitForDocumentReady(client, expectedUrl, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const state = await client.send("Runtime.evaluate", {
        expression:
          "JSON.stringify({ href: location.href, readyState: document.readyState, title: document.title })",
        returnByValue: true,
      });
      const value = state.result?.value ? JSON.parse(state.result.value) : null;
      if (
        value &&
        value.readyState === "complete" &&
        typeof value.href === "string" &&
        value.href.startsWith(expectedUrl)
      ) {
        return value;
      }
    } catch {
      // Ignore transient evaluation failures during navigation.
    }
    await sleep(200);
  }
  throw new Error(`Timed out waiting for document readyState=complete after ${timeoutMs}ms`);
}

async function waitForDevTools(userDataDir) {
  const devToolsPortFile = path.join(userDataDir, "DevToolsActivePort");
  const start = Date.now();
  while (Date.now() - start < 15000) {
    if (fs.existsSync(devToolsPortFile)) {
      const [port, wsPath] = fs.readFileSync(devToolsPortFile, "utf8").trim().split("\n");
      return {
        port,
        wsUrl: wsPath ? `ws://127.0.0.1:${port}${wsPath}` : null,
      };
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for DevToolsActivePort in ${userDataDir}`);
}

async function getPageTarget(port) {
  const start = Date.now();
  while (Date.now() - start < 10000) {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    const targets = await response.json();
    const pageTarget = targets.find((target) => target.type === "page");
    if (pageTarget) {
      return pageTarget;
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for a page target on port ${port}`);
}

async function createCdpClient(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 0;

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (typeof message.id === "number") {
      const resolver = pending.get(message.id);
      if (resolver) {
        pending.delete(message.id);
        if (message.error) {
          resolver.reject(new Error(message.error.message));
        } else {
          resolver.resolve(message.result || {});
        }
      }
      return;
    }

    const handlers = listeners.get(message.method) || [];
    for (const handler of handlers) {
      handler(message.params || {});
    }
  });

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  return {
    on(method, handler) {
      const handlers = listeners.get(method) || [];
      handlers.push(handler);
      listeners.set(method, handlers);
    },
    send(method, params = {}) {
      const id = ++nextId;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
    },
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
