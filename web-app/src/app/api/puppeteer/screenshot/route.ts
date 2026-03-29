import { type NextRequest } from "next/server";
import { createPuppeteerBrowser } from "@/lib/puppeteer/browser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_SCREENSHOT_URL = "https://vercel.com";
const NAVIGATION_TIMEOUT_MS = 30_000;

function parseTargetUrl(request: NextRequest): string {
  const requestedUrl = request.nextUrl.searchParams.get("url") ?? DEFAULT_SCREENSHOT_URL;
  const parsed = new URL(requestedUrl);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  return parsed.toString();
}

export async function GET(request: NextRequest): Promise<Response> {
  let browser: Awaited<ReturnType<typeof createPuppeteerBrowser>> | null = null;

  try {
    const targetUrl = parseTargetUrl(request);
    browser = await createPuppeteerBrowser();

    const page = await browser.newPage();
    await page.goto(targetUrl, {
      timeout: NAVIGATION_TIMEOUT_MS,
      waitUntil: "networkidle2",
    });

    const screenshot = await page.screenshot({
      fullPage: request.nextUrl.searchParams.get("fullPage") === "1",
      type: "png",
    });
    const imageBytes = Buffer.from(screenshot);

    return new Response(imageBytes, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "image/png",
      },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Screenshot generation failed.";
    return Response.json({ error: message }, { status: 400 });
  } finally {
    await browser?.close();
  }
}
