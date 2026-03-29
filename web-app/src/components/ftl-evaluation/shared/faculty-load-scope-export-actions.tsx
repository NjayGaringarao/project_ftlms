"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Popover } from "radix-ui";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import {
  SYNC_PDF_MAX_COUNT,
} from "@/lib/faculty-load-export/constants";
import type { FacultyLoadExportScope } from "@/lib/faculty-load-export/scope";
import { toFacultyLoadExportScopeSearchParams } from "@/lib/faculty-load-export/scope";

type FacultyLoadExportJobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

type FacultyLoadExportJobPayload = {
  id: string;
  status: FacultyLoadExportJobStatus;
  totalCount: number;
  processedCount: number;
  errorMessage: string | null;
  expiresAt: string | null;
};

type JobStatusResponse = {
  job: FacultyLoadExportJobPayload;
  downloadUrl: string | null;
  expired: boolean;
};

type CreateJobResponse = {
  job: FacultyLoadExportJobPayload;
};

type FacultyLoadScopeExportActionsProps = {
  academicTermId: string;
  scope: FacultyLoadExportScope;
  exportableCount: number;
  disabledReason?: string;
  triggerLabel?: string;
  triggerClassName?: string;
};

const POLL_INTERVAL_MS = 2_500;

const toErrorMessage = (value: unknown, fallback: string): string => {
  if (value instanceof Error && value.message) return value.message;
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
};

const parseJobStatusResponse = (payload: unknown): JobStatusResponse | null => {
  if (!payload || typeof payload !== "object") return null;
  const row = payload as Partial<JobStatusResponse>;
  if (!row.job || typeof row.job !== "object") return null;
  const job = row.job as Partial<FacultyLoadExportJobPayload>;
  if (!job.id || !job.status) return null;

  return {
    job: {
      id: job.id,
      status: job.status,
      totalCount: Number(job.totalCount ?? 0),
      processedCount: Number(job.processedCount ?? 0),
      errorMessage:
        typeof job.errorMessage === "string" ? job.errorMessage : null,
      expiresAt: typeof job.expiresAt === "string" ? job.expiresAt : null,
    },
    downloadUrl: typeof row.downloadUrl === "string" ? row.downloadUrl : null,
    expired: row.expired === true,
  };
};

const parseCreateJobResponse = (payload: unknown): CreateJobResponse | null => {
  if (!payload || typeof payload !== "object") return null;
  const row = payload as Partial<CreateJobResponse>;
  if (!row.job || typeof row.job !== "object") return null;
  const job = row.job as Partial<FacultyLoadExportJobPayload>;
  if (!job.id || !job.status) return null;

  return {
    job: {
      id: job.id,
      status: job.status,
      totalCount: Number(job.totalCount ?? 0),
      processedCount: Number(job.processedCount ?? 0),
      errorMessage:
        typeof job.errorMessage === "string" ? job.errorMessage : null,
      expiresAt: typeof job.expiresAt === "string" ? job.expiresAt : null,
    },
  };
};

const FacultyLoadScopeExportActions = ({
  academicTermId,
  scope,
  exportableCount,
  disabledReason,
  triggerLabel = "Export filtered",
  triggerClassName,
}: FacultyLoadScopeExportActionsProps) => {
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [job, setJob] = useState<FacultyLoadExportJobPayload | null>(null);
  const [jobDownloadUrl, setJobDownloadUrl] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  const pollingInFlightRef = useRef(false);
  const autoDownloadedRef = useRef(false);

  const scopeSearchParams = useMemo(
    () => toFacultyLoadExportScopeSearchParams(scope),
    [scope],
  );
  const scopeSearchString = scopeSearchParams.toString();
  const localStorageJobKey = useMemo(
    () => `ftl-export-job:${academicTermId}:${scopeSearchString}`,
    [academicTermId, scopeSearchString],
  );

  const canExport = exportableCount > 0 && !disabledReason;
  const disabledMessage =
    disabledReason ??
    (exportableCount <= 0
      ? "No exportable faculty found for the current scope."
      : "");

  const printPath = `/print/faculty-load/scope/${academicTermId}?${scopeSearchString}&autoPrint=1`;
  const syncPdfPath = `/api/puppeteer/pdf/faculty-load/scope/${academicTermId}?${scopeSearchString}`;

  const openNewTab = (path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  };

  const readStoredJobId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(localStorageJobKey);
    return value?.trim() ? value : null;
  }, [localStorageJobKey]);

  const storeJobId = useCallback((jobId: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(localStorageJobKey, jobId);
  }, [localStorageJobKey]);

  const clearStoredJobId = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(localStorageJobKey);
  }, [localStorageJobKey]);

  const fetchJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
    const response = await fetch(`/api/faculty-load-export/jobs/${jobId}`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error?: unknown }).error ?? "")
          : "";
      throw new Error(message || "Failed to fetch export job status.");
    }

    const parsed = parseJobStatusResponse(payload);
    if (!parsed) {
      throw new Error("Invalid export job status response.");
    }

    return parsed;
  };

  const triggerTick = async (jobId: string): Promise<void> => {
    const response = await fetch(`/api/faculty-load-export/jobs/${jobId}/tick`, {
      method: "POST",
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error?: unknown }).error ?? "")
          : "";
      throw new Error(message || "Failed to process export job.");
    }
  };

  const hydrateJobState = useCallback((statusResponse: JobStatusResponse) => {
    setJob(statusResponse.job);
    setJobDownloadUrl(statusResponse.downloadUrl);

    if (statusResponse.expired) {
      setProgressError("This export job has expired. Start a new export.");
      clearStoredJobId();
      return;
    }

    if (statusResponse.job.status === "FAILED") {
      setProgressError(
        statusResponse.job.errorMessage || "Export job failed during processing.",
      );
    } else {
      setProgressError(null);
    }
  }, [clearStoredJobId]);

  const createJob = async (): Promise<FacultyLoadExportJobPayload> => {
    const response = await fetch("/api/faculty-load-export/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        academicTermId,
        scope,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error?: unknown }).error ?? "")
          : "";
      throw new Error(message || "Failed to create export job.");
    }

    const parsed = parseCreateJobResponse(payload);
    if (!parsed) {
      throw new Error("Invalid export job response.");
    }

    return parsed.job;
  };

  const handlePrint = () => {
    if (!canExport) return;
    openNewTab(printPath);
  };

  const handleDownload = async () => {
    if (!canExport) return;

    if (exportableCount <= SYNC_PDF_MAX_COUNT) {
      openNewTab(syncPdfPath);
      return;
    }

    setIsProgressDialogOpen(true);
    setProgressError(null);
    setJobDownloadUrl(null);
    autoDownloadedRef.current = false;

    try {
      const existingJobId = readStoredJobId();
      if (existingJobId) {
        const statusResponse = await fetchJobStatus(existingJobId);
        if (!statusResponse.expired) {
          hydrateJobState(statusResponse);
          return;
        }

        clearStoredJobId();
      }

      setIsStartingJob(true);
      const createdJob = await createJob();
      setJob(createdJob);
      storeJobId(createdJob.id);
    } catch (error) {
      setProgressError(
        toErrorMessage(error, "Failed to start asynchronous export."),
      );
    } finally {
      setIsStartingJob(false);
    }
  };

  useEffect(() => {
    if (!job?.id) return;
    if (!isProgressDialogOpen) return;
    if (job.status === "COMPLETED" || job.status === "FAILED") return;

    let cancelled = false;
    const runPollingCycle = async () => {
      if (cancelled || pollingInFlightRef.current || !job?.id) return;
      pollingInFlightRef.current = true;
      try {
        const statusBeforeTick = await fetchJobStatus(job.id);
        if (cancelled) return;
        hydrateJobState(statusBeforeTick);

        if (
          statusBeforeTick.job.status === "QUEUED" ||
          statusBeforeTick.job.status === "PROCESSING"
        ) {
          await triggerTick(statusBeforeTick.job.id);
          if (cancelled) return;

          const statusAfterTick = await fetchJobStatus(statusBeforeTick.job.id);
          if (cancelled) return;
          hydrateJobState(statusAfterTick);
        }
      } catch (error) {
        setProgressError(
          toErrorMessage(error, "Failed to process asynchronous export."),
        );
      } finally {
        pollingInFlightRef.current = false;
      }
    };

    runPollingCycle();
    const intervalId = window.setInterval(runPollingCycle, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [hydrateJobState, job?.id, job?.status, isProgressDialogOpen]);

  useEffect(() => {
    if (!isProgressDialogOpen) return;
    if (job?.status !== "COMPLETED") return;
    if (!jobDownloadUrl) return;
    if (autoDownloadedRef.current) return;

    autoDownloadedRef.current = true;
    openNewTab(jobDownloadUrl);
  }, [job?.status, jobDownloadUrl, isProgressDialogOpen]);

  const progressLabel = job
    ? `${Math.min(job.processedCount, job.totalCount)} / ${job.totalCount} documents processed`
    : null;

  return (
    <>
      <Popover.Root>
        <Popover.Trigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={triggerClassName ?? "h-7 px-2 text-xs"}
            disabled={!canExport}
            title={
              canExport
                ? "Export faculty teaching load documents"
                : disabledMessage
            }
          >
            <Download className="h-4 w-4" /> {triggerLabel}
          </Button>
        </Popover.Trigger>
        <Popover.Anchor />
        <Popover.Portal>
          <Popover.Content sideOffset={6}>
            <div className="flex flex-col overflow-hidden rounded-md border bg-background shadow-md">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:bg-foreground/5"
                disabled={!canExport}
                onClick={handleDownload}
                title={
                  canExport
                    ? exportableCount <= SYNC_PDF_MAX_COUNT
                      ? "Download merged PDF"
                      : "Download merged PDF (asynchronous processing)"
                    : disabledMessage
                }
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:bg-foreground/5"
                disabled={!canExport}
                onClick={handlePrint}
                title={
                  canExport
                    ? "Open print view"
                    : disabledMessage
                }
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <AppDialog
        open={isProgressDialogOpen}
        onOpenChange={setIsProgressDialogOpen}
        title="Preparing Bulk PDF Export"
        description="Large exports run in background chunks. Keep this dialog open to monitor progress."
        contentClassName="w-full max-w-lg"
      >
        <div className="space-y-3 text-sm text-foreground/80">
          {isStartingJob && <p>Starting export job...</p>}
          {!isStartingJob && job && (
            <>
              <p>
                Status: <strong>{job.status}</strong>
              </p>
              <p>{progressLabel}</p>
            </>
          )}
          {!isStartingJob && !job && !progressError && (
            <p>Waiting to start export processing...</p>
          )}
          {progressError && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
              {progressError}
            </p>
          )}
          {job?.status === "COMPLETED" && jobDownloadUrl && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-emerald-700">Export completed successfully.</p>
              <Button
                type="button"
                size="sm"
                className="mt-2"
                onClick={() => openNewTab(jobDownloadUrl)}
              >
                Download now
              </Button>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProgressDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </AppDialog>
    </>
  );
};

export default FacultyLoadScopeExportActions;
