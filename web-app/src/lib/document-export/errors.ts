export class DocumentExportError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "DocumentExportError";
  }
}

export const isDocumentExportError = (
  value: unknown,
): value is DocumentExportError => value instanceof DocumentExportError;

export const toDocumentExportError = (
  value: unknown,
  fallbackStatus = 500,
  fallbackMessage = "Export failed.",
): DocumentExportError => {
  if (isDocumentExportError(value)) return value;

  if (
    value &&
    typeof value === "object" &&
    "status" in value &&
    typeof (value as { status?: unknown }).status === "number" &&
    "message" in value &&
    typeof (value as { message?: unknown }).message === "string"
  ) {
    const row = value as { status: number; message: string };
    return new DocumentExportError(row.status, row.message);
  }

  if (value instanceof Error) {
    if (value.name.endsWith("ScopeParseError")) {
      return new DocumentExportError(400, value.message || "Invalid export scope.");
    }
    return new DocumentExportError(fallbackStatus, value.message || fallbackMessage);
  }

  return new DocumentExportError(fallbackStatus, fallbackMessage);
};
