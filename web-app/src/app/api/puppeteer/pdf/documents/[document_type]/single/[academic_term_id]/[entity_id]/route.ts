import "@/features/document-export/lib/document-export/register-providers";
import { type NextRequest } from "next/server";
import { requireAuthenticatedForApi } from "@/features/document-export/lib/document-export/auth";
import { toDocumentExportError } from "@/features/document-export/lib/document-export/errors";
import { renderPdfFromPrintRoute } from "@/features/document-export/lib/document-export/pdf";
import { getDocumentExportProvider } from "@/features/document-export/lib/document-export/provider";

type DocumentSinglePdfRouteContext = {
  params: Promise<{
    document_type: string;
    academic_term_id: string;
    entity_id: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  context: DocumentSinglePdfRouteContext,
): Promise<Response> {
  try {
    await requireAuthenticatedForApi();
    const { document_type, academic_term_id, entity_id } = await context.params;
    const provider = getDocumentExportProvider(document_type);
    const document = await provider.loadSingleDocument({
      academicTermId: academic_term_id,
      entityId: entity_id,
    });

    const printRouteUrl = new URL(
      `/print/documents/${document_type}/single/${academic_term_id}/${entity_id}`,
      request.nextUrl.origin,
    );

    const pdfBytes = await renderPdfFromPrintRoute({
      request,
      printRouteUrl,
    });
    const fileName = await provider.buildSingleFileName(document);

    return new Response(new Uint8Array(pdfBytes), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/pdf",
      },
      status: 200,
    });
  } catch (error) {
    const parsedError = toDocumentExportError(error, 500, "PDF export failed.");
    return Response.json(
      { error: parsedError.message },
      { status: parsedError.status },
    );
  }
}
