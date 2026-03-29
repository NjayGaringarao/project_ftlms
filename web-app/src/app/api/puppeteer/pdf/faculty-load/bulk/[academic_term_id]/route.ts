import { type NextRequest } from "next/server";
import { getFacultyLoadBulkExportPayload } from "@/lib/faculty-load-export/bulk";
import {
  isFacultyLoadExportError,
} from "@/lib/faculty-load-export/document";
import { createPuppeteerBrowser } from "@/lib/puppeteer/browser";

type FacultyLoadBulkPdfRouteContext = {
  params: Promise<{ academic_term_id: string }>;
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

const buildFileName = (termCode: string, count: number): string => {
  return `FTL_BULK_${sanitizeFilePart(termCode)}_${count}.pdf`;
};

export async function GET(
  request: NextRequest,
  context: FacultyLoadBulkPdfRouteContext,
): Promise<Response> {
  let browser: Awaited<ReturnType<typeof createPuppeteerBrowser>> | null = null;

  try {
    const { academic_term_id } = await context.params;
    const facultyIdsQuery = request.nextUrl.searchParams.getAll("facultyIds");
    const payload = await getFacultyLoadBulkExportPayload({
      academicTermId: academic_term_id,
      facultyIdsParam: facultyIdsQuery,
    });

    const printRouteUrl = new URL(
      `/print/faculty-load/bulk/${academic_term_id}`,
      request.nextUrl.origin,
    );
    printRouteUrl.searchParams.set("facultyIds", payload.facultyIds.join(","));

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
    const firstDocument = payload.documents[0];
    const fileName = buildFileName(
      firstDocument?.termCode ?? "TERM",
      payload.documents.length,
    );

    return new Response(fileBytes, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/pdf",
      },
      status: 200,
    });
  } catch (error) {
    if (isFacultyLoadExportError(error)) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Bulk PDF export failed.";
    return Response.json({ error: message }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
