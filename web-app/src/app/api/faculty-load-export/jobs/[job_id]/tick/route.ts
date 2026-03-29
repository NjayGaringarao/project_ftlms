import { PDFDocument } from "pdf-lib";
import { type NextRequest } from "next/server";
import { getTermById } from "@/lib/admin/terms";
import {
  ASYNC_CHUNK_SIZE,
  FACULTY_LOAD_EXPORT_STORAGE_BUCKET,
} from "@/lib/faculty-load-export/constants";
import {
  buildChunkStoragePath,
  buildFinalJobPdfFileName,
  buildFinalStoragePath,
  mapFacultyLoadExportJob,
  resolveStorageBucket,
  toRawFacultyLoadExportJobRow,
} from "@/lib/faculty-load-export/jobs";
import { createPuppeteerBrowser } from "@/lib/puppeteer/browser";
import { createClient } from "@/utils/supabase/server";

type FacultyLoadExportJobTickRouteContext = {
  params: Promise<{ job_id: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAGE_TIMEOUT_MS = 30_000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value: string): boolean => UUID_PATTERN.test(value);

const parseErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return "Tick processing failed.";
};

const renderChunkPdf = async ({
  request,
  academicTermId,
  facultyIds,
}: {
  request: NextRequest;
  academicTermId: string;
  facultyIds: string[];
}): Promise<Buffer> => {
  let browser: Awaited<ReturnType<typeof createPuppeteerBrowser>> | null = null;
  try {
    const printRouteUrl = new URL(
      `/print/faculty-load/bulk/${academicTermId}`,
      request.nextUrl.origin,
    );
    printRouteUrl.searchParams.set("facultyIds", facultyIds.join(","));

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

    return Buffer.from(pdfBytes);
  } finally {
    await browser?.close();
  }
};

const mergePdfBuffers = async (buffers: Uint8Array[]): Promise<Uint8Array> => {
  const merged = await PDFDocument.create();

  for (const buffer of buffers) {
    const chunk = await PDFDocument.load(buffer);
    const pages = await merged.copyPages(chunk, chunk.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  return merged.save();
};

export async function POST(
  request: NextRequest,
  context: FacultyLoadExportJobTickRouteContext,
): Promise<Response> {
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

  try {
    const { data: claimData, error: claimError } = await supabase.rpc(
      "claim_faculty_load_export_job",
      {
        p_job_id: job_id,
        p_requester_user_id: user.id,
        p_lock_seconds: 180,
      },
    );

    if (claimError) {
      console.error("facultyLoadExport.jobs.tick.claim ::", claimError);
      return Response.json(
        { error: "Failed to claim export job for processing." },
        { status: 500 },
      );
    }

    const claimedRaw = toRawFacultyLoadExportJobRow(claimData);
    if (!claimedRaw) {
      const { data: existingData, error: existingError } = await supabase
        .from("faculty_load_export_job")
        .select("*")
        .eq("id", job_id)
        .eq("requester_user_id", user.id)
        .maybeSingle();

      if (existingError) {
        console.error("facultyLoadExport.jobs.tick.fetch ::", existingError);
        return Response.json(
          { error: "Failed to fetch export job." },
          { status: 500 },
        );
      }

      if (!existingData) {
        return Response.json({ error: "Export job not found." }, { status: 404 });
      }

      const existingRaw = toRawFacultyLoadExportJobRow(existingData);
      if (!existingRaw) {
        return Response.json(
          { error: "Failed to parse export job." },
          { status: 500 },
        );
      }

      return Response.json(
        { job: mapFacultyLoadExportJob(existingRaw) },
        { status: 202 },
      );
    }

    const claimedJob = mapFacultyLoadExportJob(claimedRaw);
    if (claimedJob.processedCount >= claimedJob.totalCount) {
      const { data: stalledData, error: stalledError } = await supabase
        .from("faculty_load_export_job")
        .update({
          status: "FAILED",
          error_message:
            "Export job has no remaining chunks to process. Create a new export job.",
          lock_token: null,
          lock_expires_at: null,
        })
        .eq("id", job_id)
        .eq("requester_user_id", user.id)
        .select("*")
        .single();

      if (stalledError) {
        console.error("facultyLoadExport.jobs.tick.stalled ::", stalledError);
        return Response.json(
          { error: "Failed to update stalled export job." },
          { status: 500 },
        );
      }

      const stalledRaw = toRawFacultyLoadExportJobRow(stalledData);
      if (!stalledRaw) {
        return Response.json(
          { error: "Failed to parse export job." },
          { status: 500 },
        );
      }

      return Response.json({ job: mapFacultyLoadExportJob(stalledRaw) }, { status: 409 });
    }

    const resolvedFacultyIds = claimedJob.resolvedFacultyIds;
    const totalCount =
      claimedJob.totalCount > 0 ? claimedJob.totalCount : resolvedFacultyIds.length;
    const chunkStart = Math.max(0, claimedJob.processedCount);
    const chunkEnd = Math.min(chunkStart + ASYNC_CHUNK_SIZE, totalCount);
    const chunkFacultyIds = resolvedFacultyIds.slice(chunkStart, chunkEnd);

    if (chunkFacultyIds.length === 0) {
      const { data: failedData, error: failedError } = await supabase
        .from("faculty_load_export_job")
        .update({
          status: "FAILED",
          error_message: "No remaining faculty rows to process for this job.",
          lock_token: null,
          lock_expires_at: null,
        })
        .eq("id", job_id)
        .eq("requester_user_id", user.id)
        .select("*")
        .single();

      if (failedError) {
        console.error("facultyLoadExport.jobs.tick.noChunk ::", failedError);
        return Response.json(
          { error: "Failed to update export job state." },
          { status: 500 },
        );
      }

      const failedRaw = toRawFacultyLoadExportJobRow(failedData);
      if (!failedRaw) {
        return Response.json(
          { error: "Failed to parse export job." },
          { status: 500 },
        );
      }

      return Response.json({ job: mapFacultyLoadExportJob(failedRaw) });
    }

    const storageBucket = resolveStorageBucket(claimedJob.outputBucket);
    const chunkIndex = Math.floor(chunkStart / ASYNC_CHUNK_SIZE) + 1;
    const chunkPdfBuffer = await renderChunkPdf({
      request,
      academicTermId: claimedJob.academicTermId,
      facultyIds: chunkFacultyIds,
    });

    const chunkPath = buildChunkStoragePath(claimedJob.id, chunkIndex);
    const { error: uploadChunkError } = await supabase.storage
      .from(storageBucket || FACULTY_LOAD_EXPORT_STORAGE_BUCKET)
      .upload(chunkPath, chunkPdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadChunkError) {
      throw new Error(uploadChunkError.message);
    }

    const isFinalChunk = chunkEnd >= totalCount;
    if (!isFinalChunk) {
      const { data: progressData, error: progressError } = await supabase
        .from("faculty_load_export_job")
        .update({
          status: "PROCESSING",
          processed_count: chunkEnd,
          error_message: null,
          lock_token: null,
          lock_expires_at: null,
        })
        .eq("id", job_id)
        .eq("requester_user_id", user.id)
        .select("*")
        .single();

      if (progressError) {
        console.error("facultyLoadExport.jobs.tick.progress ::", progressError);
        throw new Error("Failed to update export progress.");
      }

      const progressRaw = toRawFacultyLoadExportJobRow(progressData);
      if (!progressRaw) {
        throw new Error("Failed to parse export job.");
      }

      return Response.json({ job: mapFacultyLoadExportJob(progressRaw) });
    }

    const totalChunks = Math.ceil(totalCount / ASYNC_CHUNK_SIZE);
    const chunkBuffers: Uint8Array[] = [];
    for (let currentChunk = 1; currentChunk <= totalChunks; currentChunk += 1) {
      const currentChunkPath = buildChunkStoragePath(claimedJob.id, currentChunk);
      const { data: chunkBlob, error: chunkDownloadError } = await supabase.storage
        .from(storageBucket || FACULTY_LOAD_EXPORT_STORAGE_BUCKET)
        .download(currentChunkPath);

      if (chunkDownloadError || !chunkBlob) {
        throw new Error(
          chunkDownloadError?.message ??
            `Missing chunk file: ${currentChunkPath}`,
        );
      }

      const chunkBytes = new Uint8Array(await chunkBlob.arrayBuffer());
      chunkBuffers.push(chunkBytes);
    }

    const mergedPdfBytes = await mergePdfBuffers(chunkBuffers);
    const finalPath = buildFinalStoragePath(claimedJob.id);
    const term = await getTermById(claimedJob.academicTermId);
    const finalFileName = buildFinalJobPdfFileName(
      term?.code ?? "TERM",
      totalCount,
    );

    const { error: finalUploadError } = await supabase.storage
      .from(storageBucket || FACULTY_LOAD_EXPORT_STORAGE_BUCKET)
      .upload(finalPath, Buffer.from(mergedPdfBytes), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (finalUploadError) {
      throw new Error(finalUploadError.message);
    }

    const { data: completedData, error: completedError } = await supabase
      .from("faculty_load_export_job")
      .update({
        status: "COMPLETED",
        processed_count: totalCount,
        output_bucket: storageBucket || FACULTY_LOAD_EXPORT_STORAGE_BUCKET,
        output_path: finalPath,
        output_file_name: finalFileName,
        output_mime_type: "application/pdf",
        error_message: null,
        completed_at: new Date().toISOString(),
        lock_token: null,
        lock_expires_at: null,
      })
      .eq("id", job_id)
      .eq("requester_user_id", user.id)
      .select("*")
      .single();

    if (completedError) {
      console.error("facultyLoadExport.jobs.tick.complete ::", completedError);
      throw new Error("Failed to mark export job as completed.");
    }

    const completedRaw = toRawFacultyLoadExportJobRow(completedData);
    if (!completedRaw) {
      throw new Error("Failed to parse export job.");
    }

    return Response.json({ job: mapFacultyLoadExportJob(completedRaw) });
  } catch (error) {
    const errorMessage = parseErrorMessage(error);
    const { data: failedData, error: failedError } = await supabase
      .from("faculty_load_export_job")
      .update({
        status: "FAILED",
        error_message: errorMessage,
        lock_token: null,
        lock_expires_at: null,
      })
      .eq("id", job_id)
      .eq("requester_user_id", user.id)
      .select("*")
      .single();

    if (failedError) {
      console.error("facultyLoadExport.jobs.tick.fail ::", failedError);
      return Response.json({ error: errorMessage }, { status: 500 });
    }

    const failedRaw = toRawFacultyLoadExportJobRow(failedData);
    if (!failedRaw) {
      return Response.json({ error: errorMessage }, { status: 500 });
    }

    return Response.json(
      {
        error: errorMessage,
        job: mapFacultyLoadExportJob(failedRaw),
      },
      { status: 500 },
    );
  }
}
