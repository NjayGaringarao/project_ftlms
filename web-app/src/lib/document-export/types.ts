export type DocumentType = "faculty_load";

export type DocumentExportJobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export const DOCUMENT_TYPES: DocumentType[] = ["faculty_load"];

export const isDocumentType = (value: string): value is DocumentType => {
  return DOCUMENT_TYPES.includes(value as DocumentType);
};
