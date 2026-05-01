import { type NextRequest } from "next/server";
import {
  ASYNC_PDF_MAX_COUNT,
  SYNC_PDF_MAX_COUNT,
} from "@/features/document-export/lib/document-export/constants";
import { requireAuthenticatedForApi } from "@/features/document-export/lib/document-export/auth";
import { toDocumentExportError } from "@/features/document-export/lib/document-export/errors";
import {
  addDays,
  mapDocumentExportJob,
  toRawDocumentExportJobRow,
} from "@/features/document-export/lib/document-export/jobs";
import { getDocumentExportProvider } from "@/features/document-export/lib/document-export/provider";
import { isDocumentType } from "@/features/document-export/lib/document-export/types";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseAcademicTermId = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!UUID_PATTERN.test(normalized)) return null;
  return normalized;
};

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return Response.json({ error: "Invalid request body." }, { status: 400 });
    }

    const row = payload as Record<string, unknown>;
    const academicTermId = parseAcademicTermId(row.academicTermId);
    if (!academicTermId) {
      return Response.json(
        { error: "academicTermId must be a valid UUID." },
        { status: 400 },
      );
    }

    if (typeof row.documentType !== "string" || !isDocumentType(row.documentType)) {
      return Response.json(
        { error: "documentType is required and must be supported." },
        { status: 400 },
      );
    }

    const provider = getDocumentExportProvider(row.documentType);
    const scope = provider.parseScopeFromBody((row.scope as unknown) ?? row);

    const requesterUserId = await requireAuthenticatedForApi();
    const supabase = await createClient();

    const entityIds = await provider.resolveEntityIdsByScope({
      academicTermId,
      scope,
    });

    if (entityIds.length > ASYNC_PDF_MAX_COUNT) {
      return Response.json(
        {
          error: `Export supports up to ${ASYNC_PDF_MAX_COUNT} documents per job.`,
        },
        { status: 400 },
      );
    }

    const expiresAt = addDays(new Date(), 7).toISOString();
    const scopeKind =
      scope && typeof scope === "object" && "kind" in scope
        ? String((scope as { kind?: unknown }).kind ?? "unknown")
        : "unknown";

    const { data, error } = await supabase
      .from("document_export_job")
      .insert({
        requester_user_id: requesterUserId,
        academic_term_id: academicTermId,
        document_type: row.documentType,
        scope_kind: scopeKind,
        scope_payload: scope,
        resolved_entity_ids: entityIds,
        total_count: entityIds.length,
        processed_count: 0,
        status: "QUEUED",
        output_mime_type: "application/pdf",
        expires_at: expiresAt,
      })
      .select("*")
      .single();

    if (error) {
      console.error("documentExport.jobs.create ::", error);
      return Response.json({ error: "Failed to create export job." }, { status: 500 });
    }

    const rawJob = toRawDocumentExportJobRow(data);
    if (!rawJob) {
      return Response.json({ error: "Failed to parse export job." }, { status: 500 });
    }

    const job = mapDocumentExportJob(rawJob);
    return Response.json(
      {
        job,
        mode: job.totalCount <= SYNC_PDF_MAX_COUNT ? "sync" : "async",
      },
      { status: 201 },
    );
  } catch (error) {
    const parsedError = toDocumentExportError(
      error,
      500,
      "Failed to create export job.",
    );
    return Response.json(
      { error: parsedError.message },
      { status: parsedError.status },
    );
  }
}
