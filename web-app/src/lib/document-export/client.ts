import type {
  DocumentExportJobStatus,
  DocumentType,
} from "@/lib/document-export/types";

export type DocumentExportJobPayload = {
  id: string;
  status: DocumentExportJobStatus;
  totalCount: number;
  processedCount: number;
  errorMessage: string | null;
  expiresAt: string | null;
};

export type DocumentExportJobStatusResponse = {
  job: DocumentExportJobPayload;
  downloadUrl: string | null;
  expired: boolean;
};

export type CreateDocumentExportJobResponse = {
  job: DocumentExportJobPayload;
};

const parseErrorMessage = (payload: unknown): string => {
  if (payload && typeof payload === "object" && "error" in payload) {
    const row = payload as { error?: unknown };
    if (typeof row.error === "string" && row.error.trim()) {
      return row.error;
    }
  }
  return "";
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseJobPayload = (value: unknown): DocumentExportJobPayload | null => {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<DocumentExportJobPayload>;
  if (!row.id || !row.status) return null;

  return {
    id: row.id,
    status: row.status,
    totalCount: toNumber(row.totalCount),
    processedCount: toNumber(row.processedCount),
    errorMessage:
      typeof row.errorMessage === "string" ? row.errorMessage : null,
    expiresAt: typeof row.expiresAt === "string" ? row.expiresAt : null,
  };
};

export const fetchDocumentExportJobStatus = async (
  jobId: string,
): Promise<DocumentExportJobStatusResponse> => {
  const response = await fetch(`/api/document-export/jobs/${jobId}`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(parseErrorMessage(payload) || "Failed to fetch export job status.");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid export job status response.");
  }

  const row = payload as Partial<DocumentExportJobStatusResponse>;
  const job = parseJobPayload(row.job);
  if (!job) {
    throw new Error("Invalid export job status payload.");
  }

  return {
    job,
    downloadUrl: typeof row.downloadUrl === "string" ? row.downloadUrl : null,
    expired: row.expired === true,
  };
};

export const triggerDocumentExportJobTick = async (jobId: string): Promise<void> => {
  const response = await fetch(`/api/document-export/jobs/${jobId}/tick`, {
    method: "POST",
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(payload) || "Failed to process export job.");
  }
};

export const createDocumentExportJob = async (payload: {
  academicTermId: string;
  documentType: DocumentType;
  scope: unknown;
}): Promise<CreateDocumentExportJobResponse> => {
  const response = await fetch("/api/document-export/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responsePayload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(parseErrorMessage(responsePayload) || "Failed to create export job.");
  }

  if (!responsePayload || typeof responsePayload !== "object") {
    throw new Error("Invalid export job response.");
  }

  const row = responsePayload as Partial<CreateDocumentExportJobResponse>;
  const job = parseJobPayload(row.job);
  if (!job) {
    throw new Error("Invalid export job response payload.");
  }

  return { job };
};
