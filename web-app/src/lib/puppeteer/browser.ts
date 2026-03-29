import { existsSync } from "node:fs";
import path from "node:path";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

const CHROMIUM_PACK_FILE = "chromium-pack.tar";

let cachedExecutablePath: Promise<string> | null = null;

function getLocalBrowserExecutablePath(): string | null {
  const fromEnv =
    process.env.PUPPETEER_EXECUTABLE_PATH ?? process.env.CHROME_EXECUTABLE_PATH;
  if (fromEnv?.trim()) {
    return fromEnv.trim();
  }

  const candidatesByPlatform: Record<NodeJS.Platform, string[]> = {
    aix: [],
    android: [],
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ],
    freebsd: [],
    haiku: [],
    linux: [
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/snap/bin/chromium",
      "/opt/google/chrome/chrome",
    ],
    openbsd: [],
    sunos: [],
    win32: [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    ],
    cygwin: [],
    netbsd: [],
  };

  const candidates = candidatesByPlatform[process.platform] ?? [];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function getVercelPackUrl(): string | null {
  const rawVercelUrl = process.env.VERCEL_URL?.trim();
  if (!rawVercelUrl) return null;

  const baseUrl =
    rawVercelUrl.startsWith("http://") || rawVercelUrl.startsWith("https://")
      ? rawVercelUrl
      : `https://${rawVercelUrl}`;

  return `${baseUrl.replace(/\/+$/, "")}/${CHROMIUM_PACK_FILE}`;
}

function getChromiumPackSource(): string {
  const localPublicPackPath = path.join(
    process.cwd(),
    "public",
    CHROMIUM_PACK_FILE,
  );
  if (existsSync(localPublicPackPath)) {
    return localPublicPackPath;
  }

  const localNodeModulesPackDir = path.join(
    process.cwd(),
    "node_modules",
    "@sparticuz",
    "chromium",
    "bin",
  );
  if (existsSync(localNodeModulesPackDir)) {
    return localNodeModulesPackDir;
  }

  const remotePackUrl = getVercelPackUrl();
  if (remotePackUrl) return remotePackUrl;

  // Use a relative path so Windows does not parse "C:/..." as a URL.
  return "node_modules/@sparticuz/chromium/bin";
}

async function getChromiumExecutablePath(): Promise<string> {
  if (!cachedExecutablePath) {
    cachedExecutablePath = chromium.executablePath(getChromiumPackSource());
  }

  return cachedExecutablePath;
}

export async function createPuppeteerBrowser() {
  const isVercelRuntime = process.env.VERCEL === "1";

  if (!isVercelRuntime) {
    const executablePath = getLocalBrowserExecutablePath();
    if (!executablePath) {
      throw new Error(
        "No local Chrome/Edge executable found. Set PUPPETEER_EXECUTABLE_PATH to your browser binary.",
      );
    }

    return puppeteer.launch({
      executablePath,
      headless: true,
    });
  }

  chromium.setGraphicsMode = false;

  return puppeteer.launch({
    args: puppeteer.defaultArgs({
      args: chromium.args,
      headless: "shell",
    }),
    executablePath: await getChromiumExecutablePath(),
    headless: "shell",
  });
}
