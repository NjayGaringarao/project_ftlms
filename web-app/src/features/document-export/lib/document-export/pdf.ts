import { type NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";
import { createPuppeteerBrowser } from "@/features/document-export/lib/puppeteer/browser";

export const DOCUMENT_EXPORT_PAGE_TIMEOUT_MS = 30_000;

export const getDocumentExportOrigin = (): string => {
  const configuredOrigin = process.env.PDF_INTERNAL_ORIGIN?.trim();
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/, "");
  }

  const port = process.env.PORT?.trim() || "3000";
  return `http://127.0.0.1:${port}`;
};

export const renderPdfFromPrintRoute = async ({
  request,
  printRouteUrl,
}: {
  request: NextRequest;
  printRouteUrl: URL;
}): Promise<Buffer> => {
  let browser: Awaited<ReturnType<typeof createPuppeteerBrowser>> | null = null;

  try {
    browser = await createPuppeteerBrowser();
    const page = await browser.newPage();
    const requesterCookie = request.headers.get("cookie");
    if (requesterCookie) {
      await page.setExtraHTTPHeaders({ cookie: requesterCookie });
    }

    await page.goto(printRouteUrl.toString(), {
      timeout: DOCUMENT_EXPORT_PAGE_TIMEOUT_MS,
      waitUntil: "networkidle2",
    });
    await page.emulateMediaType("print");

    const pdfBytes = await page.pdf({
      format: "A4",
      landscape: true,
      margin: {
        top: "8mm",
        right: "8mm",
        bottom: "8mm",
        left: "8mm",
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBytes);
  } finally {
    await browser?.close();
  }
};

export const mergePdfBuffers = async (
  buffers: Uint8Array[],
): Promise<Uint8Array> => {
  const merged = await PDFDocument.create();
  for (const buffer of buffers) {
    const chunk = await PDFDocument.load(buffer);
    const pages = await merged.copyPages(chunk, chunk.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged.save();
};
