import { type NextRequest } from "next/server";
import {
  DOCUMENT_EXPORT_FILE_TTL_SECONDS,
  DOCUMENT_EXPORT_STORAGE_BUCKET,
} from "@/lib/document-export/constants";
import { requireAuthenticatedForApi } from "@/lib/document-export/auth";
import {
  isJobExpired,
  mapDocumentExportJob,
  resolveStorageBucket,
  toRawDocumentExportJobRow,
} from "@/lib/document-export/jobs";
import { createClient } from "@/utils/supabase/server";

type DocumentExportJobRouteContext = {
  params: Promise<{ job_id: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value: string): boolean => UUID_PATTERN.test(value);

export async function GET(
  _request: NextRequest,
  context: DocumentExportJobRouteContext,
): Promise<Response> {
  try {
    const { job_id } = await context.params;
    if (!isValidUuid(job_id)) {
      return Response.json({ error: "Invalid job ID." }, { status: 400 });
    }

    const requesterUserId = await requireAuthenticatedForApi();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("document_export_job")
      .select("*")
      .eq("id", job_id)
      .eq("requester_user_id", requesterUserId)
      .maybeSingle();

    if (error) {
      console.error("documentExport.jobs.get ::", error);
      return Response.json({ error: "Failed to fetch export job." }, { status: 500 });
    }

    if (!data) {
      return Response.json({ error: "Export job not found." }, { status: 404 });
    }

    const rawJob = toRawDocumentExportJobRow(data);
    if (!rawJob) {
      return Response.json({ error: "Failed to parse export job." }, { status: 500 });
    }

    const job = mapDocumentExportJob(rawJob);
    const expired = isJobExpired(job.expiresAt);

    let downloadUrl: string | null = null;
    if (
      job.status === "COMPLETED" &&
      !expired &&
      job.outputPath &&
      resolveStorageBucket(job.outputBucket).length > 0
    ) {
      const bucket = resolveStorageBucket(job.outputBucket);
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket || DOCUMENT_EXPORT_STORAGE_BUCKET)
        .createSignedUrl(job.outputPath, DOCUMENT_EXPORT_FILE_TTL_SECONDS, {
          download: job.outputFileName ?? true,
        });

      if (signedError) {
        console.error("documentExport.jobs.getSignedUrl ::", signedError);
      } else {
        downloadUrl = signedData?.signedUrl ?? null;
      }
    }

    return Response.json(
      {
        job,
        downloadUrl,
        expired,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch export job.";
    return Response.json({ error: message }, { status: 500 });
  }
}
