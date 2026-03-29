import { type NextRequest } from "next/server";
import {
  FACULTY_LOAD_EXPORT_FILE_TTL_SECONDS,
  FACULTY_LOAD_EXPORT_STORAGE_BUCKET,
} from "@/lib/faculty-load-export/constants";
import {
  isJobExpired,
  mapFacultyLoadExportJob,
  resolveStorageBucket,
  toRawFacultyLoadExportJobRow,
} from "@/lib/faculty-load-export/jobs";
import { createClient } from "@/utils/supabase/server";

type FacultyLoadExportJobRouteContext = {
  params: Promise<{ job_id: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value: string): boolean => UUID_PATTERN.test(value);

export async function GET(
  _request: NextRequest,
  context: FacultyLoadExportJobRouteContext,
): Promise<Response> {
  try {
    const { job_id } = await context.params;
    if (!isValidUuid(job_id)) {
      return Response.json({ error: "Invalid job ID." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("faculty_load_export_job")
      .select("*")
      .eq("id", job_id)
      .eq("requester_user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("facultyLoadExport.jobs.get ::", error);
      return Response.json({ error: "Failed to fetch export job." }, { status: 500 });
    }

    if (!data) {
      return Response.json({ error: "Export job not found." }, { status: 404 });
    }

    const rawJob = toRawFacultyLoadExportJobRow(data);
    if (!rawJob) {
      return Response.json(
        { error: "Failed to parse export job." },
        { status: 500 },
      );
    }

    const job = mapFacultyLoadExportJob(rawJob);
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
        .from(bucket || FACULTY_LOAD_EXPORT_STORAGE_BUCKET)
        .createSignedUrl(job.outputPath, FACULTY_LOAD_EXPORT_FILE_TTL_SECONDS, {
          download: job.outputFileName ?? true,
        });

      if (signedError) {
        console.error("facultyLoadExport.jobs.getSignedUrl ::", signedError);
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
