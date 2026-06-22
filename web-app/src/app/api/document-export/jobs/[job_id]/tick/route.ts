import "@/features/document-export/lib/document-export/register-providers";
import { type NextRequest } from "next/server";
import {
  ASYNC_CHUNK_SIZE,
  DOCUMENT_EXPORT_STORAGE_BUCKET,
} from "@/features/document-export/lib/document-export/constants";
import { requireAuthenticatedForApi } from "@/features/document-export/lib/document-export/auth";
import {
  buildChunkStoragePath,
  buildFinalStoragePath,
  mapDocumentExportJob,
  resolveStorageBucket,
  toRawDocumentExportJobRow,
} from "@/features/document-export/lib/document-export/jobs";
import { mergePdfBuffers, renderPdfFromPrintRoute } from "@/features/document-export/lib/document-export/pdf";
import { getDocumentExportProvider } from "@/features/document-export/lib/document-export/provider";
import { createClient } from "@/utils/supabase/server";

type DocumentExportJobTickRouteContext = {
  params: Promise<{ job_id: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value: string): boolean => UUID_PATTERN.test(value);

const parseErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return "Tick processing failed.";
};

export async function POST(
  request: NextRequest,
  context: DocumentExportJobTickRouteContext,
): Promise<Response> {
  const { job_id } = await context.params;
  if (!isValidUuid(job_id)) {
    return Response.json({ error: "Invalid job ID." }, { status: 400 });
  }

  const requesterUserId = await requireAuthenticatedForApi();
  const supabase = await createClient();

  try {
    const { data: claimData, error: claimError } = await supabase.rpc(
      "claim_document_export_job",
      {
        p_job_id: job_id,
        p_requester_user_id: requesterUserId,
        p_lock_seconds: 180,
      },
    );

    if (claimError) {
      console.error("documentExport.jobs.tick.claim ::", claimError);
      return Response.json(
        { error: "Failed to claim export job for processing." },
        { status: 500 },
      );
    }

    const claimedRaw = toRawDocumentExportJobRow(claimData);
    if (!claimedRaw) {
      const { data: existingData, error: existingError } = await supabase
        .from("document_export_job")
        .select("*")
        .eq("id", job_id)
        .eq("requester_user_id", requesterUserId)
        .maybeSingle();

      if (existingError) {
        console.error("documentExport.jobs.tick.fetch ::", existingError);
        return Response.json(
          { error: "Failed to fetch export job." },
          { status: 500 },
        );
      }

      if (!existingData) {
        return Response.json({ error: "Export job not found." }, { status: 404 });
      }

      const existingRaw = toRawDocumentExportJobRow(existingData);
      if (!existingRaw) {
        return Response.json({ error: "Failed to parse export job." }, { status: 500 });
      }

      return Response.json({ job: mapDocumentExportJob(existingRaw) }, { status: 202 });
    }

    const claimedJob = mapDocumentExportJob(claimedRaw);
    if (claimedJob.processedCount >= claimedJob.totalCount) {
      const { data: stalledData, error: stalledError } = await supabase
        .from("document_export_job")
        .update({
          status: "FAILED",
          error_message:
            "Export job has no remaining chunks to process. Create a new export job.",
          lock_token: null,
          lock_expires_at: null,
        })
        .eq("id", job_id)
        .eq("requester_user_id", requesterUserId)
        .select("*")
        .single();

      if (stalledError) {
        console.error("documentExport.jobs.tick.stalled ::", stalledError);
        return Response.json(
          { error: "Failed to update stalled export job." },
          { status: 500 },
        );
      }

      const stalledRaw = toRawDocumentExportJobRow(stalledData);
      if (!stalledRaw) {
        return Response.json({ error: "Failed to parse export job." }, { status: 500 });
      }

      return Response.json({ job: mapDocumentExportJob(stalledRaw) }, { status: 409 });
    }

    const resolvedEntityIds = claimedJob.resolvedEntityIds;
    const totalCount =
      claimedJob.totalCount > 0 ? claimedJob.totalCount : resolvedEntityIds.length;
    const chunkStart = Math.max(0, claimedJob.processedCount);
    const chunkEnd = Math.min(chunkStart + ASYNC_CHUNK_SIZE, totalCount);
    const chunkEntityIds = resolvedEntityIds.slice(chunkStart, chunkEnd);

    if (chunkEntityIds.length === 0) {
      const { data: failedData, error: failedError } = await supabase
        .from("document_export_job")
        .update({
          status: "FAILED",
          error_message: "No remaining rows to process for this job.",
          lock_token: null,
          lock_expires_at: null,
        })
        .eq("id", job_id)
        .eq("requester_user_id", requesterUserId)
        .select("*")
        .single();

      if (failedError) {
        console.error("documentExport.jobs.tick.noChunk ::", failedError);
        return Response.json(
          { error: "Failed to update export job state." },
          { status: 500 },
        );
      }

      const failedRaw = toRawDocumentExportJobRow(failedData);
      if (!failedRaw) {
        return Response.json({ error: "Failed to parse export job." }, { status: 500 });
      }

      return Response.json({ job: mapDocumentExportJob(failedRaw) });
    }

    const provider = getDocumentExportProvider(claimedJob.documentType);
    const storageBucket = resolveStorageBucket(claimedJob.outputBucket);
    const chunkIndex = Math.floor(chunkStart / ASYNC_CHUNK_SIZE) + 1;

    const printRouteUrl = new URL(
      `/print/documents/${claimedJob.documentType}/scope/${claimedJob.academicTermId}`,
      request.nextUrl.origin,
    );

    const parsedScope = provider.parseScopeFromBody(claimedJob.scopePayload);
    const scopeSearchParams = provider.toScopeSearchParams(parsedScope);
    scopeSearchParams.forEach((value, key) => {
      printRouteUrl.searchParams.append(key, value);
    });
    printRouteUrl.searchParams.set("entityIds", chunkEntityIds.join(","));

    const chunkPdfBuffer = await renderPdfFromPrintRoute({
      request,
      printRouteUrl,
    });

    const chunkPath = buildChunkStoragePath(claimedJob.id, chunkIndex);
    const { error: uploadChunkError } = await supabase.storage
      .from(storageBucket || DOCUMENT_EXPORT_STORAGE_BUCKET)
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
        .from("document_export_job")
        .update({
          status: "PROCESSING",
          processed_count: chunkEnd,
          error_message: null,
          lock_token: null,
          lock_expires_at: null,
        })
        .eq("id", job_id)
        .eq("requester_user_id", requesterUserId)
        .select("*")
        .single();

      if (progressError) {
        console.error("documentExport.jobs.tick.progress ::", progressError);
        throw new Error("Failed to update export progress.");
      }

      const progressRaw = toRawDocumentExportJobRow(progressData);
      if (!progressRaw) {
        throw new Error("Failed to parse export job.");
      }

      return Response.json({ job: mapDocumentExportJob(progressRaw) });
    }

    const totalChunks = Math.ceil(totalCount / ASYNC_CHUNK_SIZE);
    const chunkBuffers: Uint8Array[] = [];
    for (let currentChunk = 1; currentChunk <= totalChunks; currentChunk += 1) {
      const currentChunkPath = buildChunkStoragePath(claimedJob.id, currentChunk);
      const { data: chunkBlob, error: chunkDownloadError } = await supabase.storage
        .from(storageBucket || DOCUMENT_EXPORT_STORAGE_BUCKET)
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

    const finalFileName = await provider.buildScopeFileName({
      academicTermId: claimedJob.academicTermId,
      entityCount: totalCount,
      scope: parsedScope,
    });

    const { error: finalUploadError } = await supabase.storage
      .from(storageBucket || DOCUMENT_EXPORT_STORAGE_BUCKET)
      .upload(finalPath, Buffer.from(mergedPdfBytes), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (finalUploadError) {
      throw new Error(finalUploadError.message);
    }

    const { data: completedData, error: completedError } = await supabase
      .from("document_export_job")
      .update({
        status: "COMPLETED",
        processed_count: totalCount,
        output_bucket: storageBucket || DOCUMENT_EXPORT_STORAGE_BUCKET,
        output_path: finalPath,
        output_file_name: finalFileName,
        output_mime_type: "application/pdf",
        error_message: null,
        completed_at: new Date().toISOString(),
        lock_token: null,
        lock_expires_at: null,
      })
        .eq("id", job_id)
        .eq("requester_user_id", requesterUserId)
        .select("*")
        .single();

    if (completedError) {
      console.error("documentExport.jobs.tick.complete ::", completedError);
      throw new Error("Failed to mark export job as completed.");
    }

    const completedRaw = toRawDocumentExportJobRow(completedData);
    if (!completedRaw) {
      throw new Error("Failed to parse export job.");
    }

    return Response.json({ job: mapDocumentExportJob(completedRaw) });
  } catch (error) {
    const errorMessage = parseErrorMessage(error);
    const { data: failedData, error: failedError } = await supabase
      .from("document_export_job")
      .update({
        status: "FAILED",
        error_message: errorMessage,
        lock_token: null,
        lock_expires_at: null,
      })
      .eq("id", job_id)
      .eq("requester_user_id", requesterUserId)
      .select("*")
      .single();

    if (failedError) {
      console.error("documentExport.jobs.tick.fail ::", failedError);
      return Response.json({ error: errorMessage }, { status: 500 });
    }

    const failedRaw = toRawDocumentExportJobRow(failedData);
    if (!failedRaw) {
      return Response.json({ error: errorMessage }, { status: 500 });
    }

    return Response.json(
      {
        error: errorMessage,
        job: mapDocumentExportJob(failedRaw),
      },
      { status: 500 },
    );
  }
}
