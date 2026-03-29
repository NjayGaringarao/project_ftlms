import { type NextRequest } from "next/server";
import {
  getFacultyLoadExportDocument,
  isFacultyLoadExportError,
} from "@/lib/faculty-load-export/document";
import { createPuppeteerBrowser } from "@/lib/puppeteer/browser";

type FacultyLoadPdfRouteContext = {
  params: Promise<{ academic_term_id: string; faculty_id: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAGE_TIMEOUT_MS = 30_000;

const sanitizeFilePart = (value: string): string => {
  const normalized = value.trim().replace(/\s+/g, "_");
  const sanitized = normalized.replace(/[^a-zA-Z0-9_-]/g, "");
  return sanitized.length > 0 ? sanitized : "document";
};

const buildFileName = (facultyName: string, termCode: string): string => {
  return `FTL_${sanitizeFilePart(facultyName)}_${sanitizeFilePart(termCode)}.pdf`;
};

export async function GET(
  request: NextRequest,
  context: FacultyLoadPdfRouteContext,
): Promise<Response> {
  let browser: Awaited<ReturnType<typeof createPuppeteerBrowser>> | null = null;

  try {
    const { academic_term_id, faculty_id } = await context.params;
    const document = await getFacultyLoadExportDocument({
      academicTermId: academic_term_id,
      facultyId: faculty_id,
    });

    const printRouteUrl = new URL(
      `/print/faculty-load/${academic_term_id}/${faculty_id}`,
      request.nextUrl.origin,
    );

    browser = await createPuppeteerBrowser();
    const page = await browser.newPage();

    const requesterCookie = request.headers.get("cookie");
    if (requesterCookie) {
      await page.setExtraHTTPHeaders({ cookie: requesterCookie });
    }

    await page.goto(printRouteUrl.toString(), {
      timeout: PAGE_TIMEOUT_MS,
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
    const fileBytes = Buffer.from(pdfBytes);

    return new Response(fileBytes, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${buildFileName(document.facultyName, document.termCode)}"`,
        "Content-Type": "application/pdf",
      },
      status: 200,
    });
  } catch (error) {
    if (isFacultyLoadExportError(error)) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "PDF export failed.";
    return Response.json({ error: message }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
