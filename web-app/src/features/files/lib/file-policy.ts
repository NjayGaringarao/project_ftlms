export type FilePolicy = {
  allowedExtensions: readonly string[];
  allowedMimeTypes: readonly string[];
  maxSizeBytes: number;
};

export const FILE_POLICIES = {
  // Empty allowedExtensions/allowedMimeTypes means "any file type" — only
  // size is capped, matching Supabase's existing 50MiB bucket limit.
  RETURN_ATTACHMENT: {
    allowedExtensions: [] as const,
    allowedMimeTypes: [] as const,
    maxSizeBytes: 50 * 1024 * 1024,
  },
} satisfies Record<string, FilePolicy>;

export const DEFAULT_FILE_POLICY: FilePolicy = FILE_POLICIES.RETURN_ATTACHMENT;
export const RETURN_ATTACHMENT_FILE_POLICY: FilePolicy = FILE_POLICIES.RETURN_ATTACHMENT;

export function normalizeAllowedExtensions(values: readonly string[]) {
  return values
    .map((value) => value.trim().toLowerCase().replace(/^\./, ""))
    .filter(Boolean);
}

export function getFileExtension(fileName: string) {
  return fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`
    : "";
}

export function isFileAllowedByPolicy(file: File, policy: FilePolicy) {
  const normalized = new Set(
    normalizeAllowedExtensions(policy.allowedExtensions).map((ext) => `.${ext}`),
  );
  const extensionAllowed = normalized.size === 0 || normalized.has(getFileExtension(file.name));
  return extensionAllowed && file.size <= policy.maxSizeBytes;
}

export function formatAllowedExtensionsForMessage(policy: FilePolicy) {
  return policy.allowedExtensions.length === 0
    ? "ANY"
    : policy.allowedExtensions.map((value) => value.toUpperCase()).join(", ");
}
