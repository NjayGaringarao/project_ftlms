export const SYNC_PDF_MAX_COUNT = 50;
export const ASYNC_PDF_MAX_COUNT = 1000;
export const ASYNC_CHUNK_SIZE = 20;

// Backward-compatible alias for existing facultyIds-based bulk routes.
export const MAX_BULK_FACULTY_LOAD_EXPORT_COUNT = SYNC_PDF_MAX_COUNT;

export const FACULTY_LOAD_EXPORT_STORAGE_BUCKET = "ftl-exports";
export const FACULTY_LOAD_EXPORT_FILE_TTL_SECONDS = 60 * 60;
