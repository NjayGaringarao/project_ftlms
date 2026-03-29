import { type NextRequest } from "next/server";
import { getTermById } from "@/lib/admin/terms";
import { createPuppeteerBrowser } from "@/lib/puppeteer/browser";
import {
  isFacultyLoadExportError,
} from "@/lib/faculty-load-export/document";
import { parseFacultyLoadExportScopeFromSearchParams } from "@/lib/faculty-load-export/scope";
import {
  assertSyncPdfScopeLimit,
  resolveFacultyIdsByExportScope,
} from "@/lib/faculty-load-export/scope-resolver";

type FacultyLoadScopePdfRouteContext = {
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
  return `FTL_SCOPE_${sanitizeFilePart(termCode)}_${count}.pdf`;
};

export async function GET(
  request: NextRequest,
  context: FacultyLoadScopePdfRouteContext,
): Promise<Response> {
  let browser: Awaited<ReturnType<typeof createPuppeteerBrowser>> | null = null;

  try {
    const { academic_term_id } = await context.params;
    const scope = parseFacultyLoadExportScopeFromSearchParams(
      request.nextUrl.searchParams,
    );
    const facultyIds = await resolveFacultyIdsByExportScope({
      academicTermId: academic_term_id,
      scope,
    });
    assertSyncPdfScopeLimit(facultyIds.length);

    const printRouteUrl = new URL(
      `/print/faculty-load/scope/${academic_term_id}`,
      request.nextUrl.origin,
    );
    request.nextUrl.searchParams.forEach((value, key) => {
      printRouteUrl.searchParams.append(key, value);
    });
    printRouteUrl.searchParams.delete("autoPrint");

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
    const term = await getTermById(academic_term_id);
    const fileName = buildFileName(term?.code ?? "TERM", facultyIds.length);

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

    if (
      error instanceof Error &&
      error.name === "FacultyLoadExportScopeParseError"
    ) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Scope PDF export failed.";
    return Response.json({ error: message }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
