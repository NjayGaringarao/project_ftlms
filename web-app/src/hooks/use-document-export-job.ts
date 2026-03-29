"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createDocumentExportJob,
  fetchDocumentExportJobStatus,
  triggerDocumentExportJobTick,
  type DocumentExportJobPayload,
} from "@/lib/document-export/client";
import type { DocumentType } from "@/lib/document-export/types";

const POLL_INTERVAL_MS = 2_500;

const toErrorMessage = (value: unknown, fallback: string): string => {
  if (value instanceof Error && value.message) return value.message;
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
};

type UseDocumentExportJobInput = {
  localStorageKey: string;
  academicTermId: string;
  documentType: DocumentType;
  scope: unknown;
};

export const useDocumentExportJob = ({
  localStorageKey,
  academicTermId,
  documentType,
  scope,
}: UseDocumentExportJobInput) => {
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [job, setJob] = useState<DocumentExportJobPayload | null>(null);
  const [jobDownloadUrl, setJobDownloadUrl] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  const pollingInFlightRef = useRef(false);
  const autoDownloadedRef = useRef(false);

  const readStoredJobId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(localStorageKey);
    return value?.trim() ? value : null;
  }, [localStorageKey]);

  const storeJobId = useCallback((jobId: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(localStorageKey, jobId);
  }, [localStorageKey]);

  const clearStoredJobId = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(localStorageKey);
  }, [localStorageKey]);

  const hydrateJobState = useCallback(
    async (jobId: string) => {
      const statusResponse = await fetchDocumentExportJobStatus(jobId);
      setJob(statusResponse.job);
      setJobDownloadUrl(statusResponse.downloadUrl);

      if (statusResponse.expired) {
        setProgressError("This export job has expired. Start a new export.");
        clearStoredJobId();
        return statusResponse;
      }

      if (statusResponse.job.status === "FAILED") {
        setProgressError(
          statusResponse.job.errorMessage ?? "Export job failed during processing.",
        );
      } else {
        setProgressError(null);
      }

      return statusResponse;
    },
    [clearStoredJobId],
  );

  const startAsyncExport = useCallback(async () => {
    setIsProgressDialogOpen(true);
    setProgressError(null);
    setJobDownloadUrl(null);
    autoDownloadedRef.current = false;

    try {
      const existingJobId = readStoredJobId();
      if (existingJobId) {
        const existing = await hydrateJobState(existingJobId);
        if (!existing?.expired) {
          return;
        }
      }

      setIsStartingJob(true);
      const created = await createDocumentExportJob({
        academicTermId,
        documentType,
        scope,
      });
      setJob(created.job);
      storeJobId(created.job.id);
    } catch (error) {
      setProgressError(
        toErrorMessage(error, "Failed to start asynchronous export."),
      );
    } finally {
      setIsStartingJob(false);
    }
  }, [
    academicTermId,
    documentType,
    hydrateJobState,
    readStoredJobId,
    scope,
    storeJobId,
  ]);

  useEffect(() => {
    if (!job?.id || !isProgressDialogOpen) return;
    if (job.status === "COMPLETED" || job.status === "FAILED") return;

    let cancelled = false;
    const runPollingCycle = async () => {
      if (cancelled || pollingInFlightRef.current || !job?.id) return;
      pollingInFlightRef.current = true;

      try {
        const beforeTick = await hydrateJobState(job.id);
        if (!beforeTick || cancelled) return;

        if (
          beforeTick.job.status === "QUEUED" ||
          beforeTick.job.status === "PROCESSING"
        ) {
          await triggerDocumentExportJobTick(beforeTick.job.id);
          if (cancelled) return;
          await hydrateJobState(beforeTick.job.id);
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
  }, [hydrateJobState, isProgressDialogOpen, job?.id, job?.status]);

  useEffect(() => {
    if (!isProgressDialogOpen) return;
    if (job?.status !== "COMPLETED") return;
    if (!jobDownloadUrl) return;
    if (autoDownloadedRef.current) return;

    autoDownloadedRef.current = true;
    window.open(jobDownloadUrl, "_blank", "noopener,noreferrer");
  }, [isProgressDialogOpen, job?.status, jobDownloadUrl]);

  const progressLabel = job
    ? `${Math.min(job.processedCount, job.totalCount)} / ${job.totalCount} documents processed`
    : null;

  return {
    isProgressDialogOpen,
    setIsProgressDialogOpen,
    isStartingJob,
    job,
    jobDownloadUrl,
    progressError,
    progressLabel,
    startAsyncExport,
  };
};
