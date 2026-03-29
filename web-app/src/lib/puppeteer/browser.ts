import path from "node:path";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

const CHROMIUM_PACK_FILE = "chromium-pack.tar";

let cachedExecutablePath: Promise<string> | null = null;

function getChromiumPackSource(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/${CHROMIUM_PACK_FILE}`;
  }

  return path.join(process.cwd(), "node_modules", "@sparticuz", "chromium", "bin");
}

async function getChromiumExecutablePath(): Promise<string> {
  if (!cachedExecutablePath) {
    cachedExecutablePath = chromium.executablePath(getChromiumPackSource());
  }

  return cachedExecutablePath;
}

export async function createPuppeteerBrowser() {
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
