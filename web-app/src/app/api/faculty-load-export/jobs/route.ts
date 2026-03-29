import { type NextRequest } from "next/server";
import {
  ASYNC_PDF_MAX_COUNT,
  SYNC_PDF_MAX_COUNT,
} from "@/lib/faculty-load-export/constants";
import {
  isFacultyLoadExportError,
} from "@/lib/faculty-load-export/document";
import {
  addDays,
  mapFacultyLoadExportJob,
  toRawFacultyLoadExportJobRow,
} from "@/lib/faculty-load-export/jobs";
import { parseFacultyLoadExportScopeFromBody } from "@/lib/faculty-load-export/scope";
import { resolveFacultyIdsByExportScope } from "@/lib/faculty-load-export/scope-resolver";
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
      return Response.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const row = payload as Record<string, unknown>;
    const academicTermId = parseAcademicTermId(row.academicTermId);
    if (!academicTermId) {
      return Response.json(
        { error: "academicTermId must be a valid UUID." },
        { status: 400 },
      );
    }

    const scope = parseFacultyLoadExportScopeFromBody(
      (row.scope as unknown) ?? row,
    );

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const facultyIds = await resolveFacultyIdsByExportScope({
      academicTermId,
      scope,
    });

    if (facultyIds.length > ASYNC_PDF_MAX_COUNT) {
      return Response.json(
        {
          error: `Export supports up to ${ASYNC_PDF_MAX_COUNT} faculty documents per job.`,
        },
        { status: 400 },
      );
    }

    const expiresAt = addDays(new Date(), 7).toISOString();
    const { data, error } = await supabase
      .from("faculty_load_export_job")
      .insert({
        requester_user_id: user.id,
        academic_term_id: academicTermId,
        scope_kind: scope.kind,
        scope_payload: scope,
        resolved_faculty_ids: facultyIds,
        total_count: facultyIds.length,
        processed_count: 0,
        status: "QUEUED",
        output_mime_type: "application/pdf",
        expires_at: expiresAt,
      })
      .select("*")
      .single();

    if (error) {
      console.error("facultyLoadExport.jobs.create ::", error);
      return Response.json({ error: "Failed to create export job." }, { status: 500 });
    }

    const rawJob = toRawFacultyLoadExportJobRow(data);
    if (!rawJob) {
      return Response.json(
        { error: "Failed to parse export job." },
        { status: 500 },
      );
    }

    const job = mapFacultyLoadExportJob(rawJob);
    return Response.json(
      {
        job,
        mode: job.totalCount <= SYNC_PDF_MAX_COUNT ? "sync" : "async",
      },
      { status: 201 },
    );
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
      error instanceof Error ? error.message : "Failed to create export job.";
    return Response.json({ error: message }, { status: 500 });
  }
}
