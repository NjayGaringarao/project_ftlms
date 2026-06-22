import "@/features/document-export/lib/document-export/register-providers";
import { type NextRequest } from "next/server";
import { SYNC_PDF_MAX_COUNT } from "@/features/document-export/lib/document-export/constants";
import { requireAuthenticatedForApi } from "@/features/document-export/lib/document-export/auth";
import { toDocumentExportError } from "@/features/document-export/lib/document-export/errors";
import { renderPdfFromPrintRoute } from "@/features/document-export/lib/document-export/pdf";
import { getDocumentExportProvider } from "@/features/document-export/lib/document-export/provider";

type DocumentScopePdfRouteContext = {
  params: Promise<{
    document_type: string;
    academic_term_id: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  context: DocumentScopePdfRouteContext,
): Promise<Response> {
  try {
    await requireAuthenticatedForApi();
    const { document_type, academic_term_id } = await context.params;
    const provider = getDocumentExportProvider(document_type);
    const scope = provider.parseScopeFromSearchParams(request.nextUrl.searchParams);
    const entityIds = await provider.resolveEntityIdsByScope({
      academicTermId: academic_term_id,
      scope,
    });

    if (entityIds.length > SYNC_PDF_MAX_COUNT) {
      return Response.json(
        {
          error: `PDF download supports up to ${SYNC_PDF_MAX_COUNT} documents for synchronous export.`,
        },
        { status: 409 },
      );
    }

    const printRouteUrl = new URL(
      `/print/documents/${document_type}/scope/${academic_term_id}`,
      request.nextUrl.origin,
    );
    request.nextUrl.searchParams.forEach((value, key) => {
      printRouteUrl.searchParams.append(key, value);
    });
    printRouteUrl.searchParams.delete("autoPrint");

    const pdfBytes = await renderPdfFromPrintRoute({
      request,
      printRouteUrl,
    });

    const fileName = await provider.buildScopeFileName({
      academicTermId: academic_term_id,
      entityCount: entityIds.length,
      scope,
    });

    return new Response(new Uint8Array(pdfBytes), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/pdf",
      },
      status: 200,
    });
  } catch (error) {
    const parsedError = toDocumentExportError(
      error,
      500,
      "Scope PDF export failed.",
    );
    return Response.json(
      { error: parsedError.message },
      { status: parsedError.status },
    );
  }
}
