import {
  DOCUMENT_EXPORT_STORAGE_BUCKET,
} from "@/lib/document-export/constants";
import type { DocumentExportJobStatus, DocumentType } from "@/lib/document-export/types";

export type DocumentExportJob = {
  id: string;
  requesterUserId: string;
  academicTermId: string;
  documentType: DocumentType;
  scopeKind: string;
  scopePayload: Record<string, unknown>;
  resolvedEntityIds: string[];
  totalCount: number;
  processedCount: number;
  status: DocumentExportJobStatus;
  outputBucket: string | null;
  outputPath: string | null;
  outputFileName: string | null;
  outputMimeType: string | null;
  errorMessage: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

type RawDocumentExportJobRow = {
  id: string;
  requester_user_id: string;
  academic_term_id: string;
  document_type: string;
  scope_kind: string;
  scope_payload: unknown;
  resolved_entity_ids: unknown;
  total_count: number | string;
  processed_count: number | string;
  status: DocumentExportJobStatus;
  output_bucket: string | null;
  output_path: string | null;
  output_file_name: string | null;
  output_mime_type: string | null;
  error_message: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
};

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

const toRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

export const mapDocumentExportJob = (
  row: RawDocumentExportJobRow,
): DocumentExportJob => {
  return {
    id: row.id,
    requesterUserId: row.requester_user_id,
    academicTermId: row.academic_term_id,
    documentType: row.document_type as DocumentType,
    scopeKind: row.scope_kind,
    scopePayload: toRecord(row.scope_payload),
    resolvedEntityIds: toStringArray(row.resolved_entity_ids),
    totalCount: Math.max(0, Math.round(toNumber(row.total_count))),
    processedCount: Math.max(0, Math.round(toNumber(row.processed_count))),
    status: row.status,
    outputBucket: row.output_bucket,
    outputPath: row.output_path,
    outputFileName: row.output_file_name,
    outputMimeType: row.output_mime_type,
    errorMessage: row.error_message,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
};

export const toRawDocumentExportJobRow = (
  value: unknown,
): RawDocumentExportJobRow | null => {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<RawDocumentExportJobRow>;
  if (!row.id || !row.requester_user_id || !row.academic_term_id) return null;
  if (!row.scope_kind || !row.status || !row.created_at || !row.updated_at) {
    return null;
  }

  return {
    id: row.id,
    requester_user_id: row.requester_user_id,
    academic_term_id: row.academic_term_id,
    document_type: row.document_type ?? "faculty_load",
    scope_kind: row.scope_kind,
    scope_payload: row.scope_payload ?? {},
    resolved_entity_ids: row.resolved_entity_ids ?? [],
    total_count: row.total_count ?? 0,
    processed_count: row.processed_count ?? 0,
    status: row.status,
    output_bucket: row.output_bucket ?? null,
    output_path: row.output_path ?? null,
    output_file_name: row.output_file_name ?? null,
    output_mime_type: row.output_mime_type ?? null,
    error_message: row.error_message ?? null,
    expires_at: row.expires_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    started_at: row.started_at ?? null,
    completed_at: row.completed_at ?? null,
  };
};

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const sanitizeFilePart = (value: string): string => {
  const normalized = value.trim().replace(/\s+/g, "_");
  const sanitized = normalized.replace(/[^a-zA-Z0-9_-]/g, "");
  return sanitized.length > 0 ? sanitized : "document";
};

export const buildJobStoragePathPrefix = (jobId: string): string => {
  return `document-export/${jobId}`;
};

export const buildChunkStoragePath = (
  jobId: string,
  chunkIndex: number,
): string => {
  return `${buildJobStoragePathPrefix(jobId)}/chunks/chunk-${String(chunkIndex).padStart(4, "0")}.pdf`;
};

export const buildFinalStoragePath = (jobId: string): string => {
  return `${buildJobStoragePathPrefix(jobId)}/final/document.pdf`;
};

export const isJobExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMs)) return false;
  return Date.now() >= expiresAtMs;
};

export const resolveStorageBucket = (bucketName: string | null): string => {
  return bucketName?.trim() || DOCUMENT_EXPORT_STORAGE_BUCKET;
};
