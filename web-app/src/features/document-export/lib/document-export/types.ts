export type DocumentType = "campus_college_load" | "section_schedule";

export type DocumentExportJobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export const DOCUMENT_TYPES: DocumentType[] = ["section_schedule"];

export const isDocumentType = (value: string): value is DocumentType => {
  return DOCUMENT_TYPES.includes(value as DocumentType);
};
