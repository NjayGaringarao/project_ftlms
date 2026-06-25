export type DocumentType = "campus_college_load" | "class_schedule" | "section_schedule";

export type DocumentExportJobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export const DOCUMENT_TYPES: DocumentType[] = [
  "campus_college_load",
  "class_schedule",
  "section_schedule",
];

export const isDocumentType = (value: string): value is DocumentType => {
  return DOCUMENT_TYPES.includes(value as DocumentType);
};
