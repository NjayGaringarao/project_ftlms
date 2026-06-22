"use client";

import { ChangeEvent, useId, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/utils/style";
import {
  FileItem,
  formatFileSizeLabel,
} from "@/features/files/components/file-item";
import {
  DEFAULT_FILE_POLICY,
  normalizeAllowedExtensions,
} from "@/features/files/lib/file-policy";

export type ExistingFileFieldItem = {
  id: string;
  fileName: string;
  fileSize: number;
  objectPath?: string;
  uploadedAt?: string | null;
  mimeType?: string | null;
  previewUrl?: string | null;
};

type FileFieldProps = {
  label?: string;
  uncommittedFiles: ExistingFileFieldItem[];
  committedFiles: ExistingFileFieldItem[];
  onAddFiles: (files: File[]) => void;
  onRemoveUncommitted: (id: string) => void;
  onRemoveCommitted: (id: string) => void;
  allowedFileTypes?: string[];
  maxSizeBytes?: number;
  multiple?: boolean;
  disabled?: boolean;
  uploadingFileIds?: string[];
  containerClassName?: string;
  listClassName?: string;
};

export function FileField({
  label = "Files",
  uncommittedFiles,
  committedFiles,
  onAddFiles,
  onRemoveUncommitted,
  onRemoveCommitted,
  allowedFileTypes = [...DEFAULT_FILE_POLICY.allowedExtensions],
  maxSizeBytes = DEFAULT_FILE_POLICY.maxSizeBytes,
  multiple = true,
  disabled = false,
  uploadingFileIds = [],
  containerClassName,
  listClassName,
}: FileFieldProps) {
  const inputId = useId();
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const normalizedAllowedFileTypes = useMemo(
    () => normalizeAllowedExtensions(allowedFileTypes),
    [allowedFileTypes],
  );

  const acceptExtensions = useMemo(
    () => normalizedAllowedFileTypes.map((value) => `.${value}`),
    [normalizedAllowedFileTypes],
  );

  const resolvedAccept = useMemo(
    () => acceptExtensions.join(","),
    [acceptExtensions],
  );

  const allowedLabel = useMemo(
    () =>
      normalizedAllowedFileTypes.length === 0
        ? "ANY"
        : normalizedAllowedFileTypes.map((ext) => ext.toUpperCase()).join(", "),
    [normalizedAllowedFileTypes],
  );
  const addFileTooltip = `Allowed: ${allowedLabel} | Max ${Math.max(1, Math.floor(maxSizeBytes / (1024 * 1024)))}MB each`;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selected.length === 0) return;

    const invalidNames: string[] = [];

    const validFiles = selected.filter((file) => {
      const extension = `.${(file.name.split(".").pop() ?? "").toLowerCase()}`;
      const extensionAllowed =
        acceptExtensions.length === 0 || acceptExtensions.includes(extension);
      const sizeAllowed = file.size <= maxSizeBytes;
      if (!extensionAllowed || !sizeAllowed) {
        invalidNames.push(file.name);
      }
      return extensionAllowed && sizeAllowed;
    });

    if (invalidNames.length > 0) {
      const maxMb = Math.max(1, Math.floor(maxSizeBytes / (1024 * 1024)));
      setValidationMessage(
        `Some files were skipped (invalid type or over ${maxMb}MB): ${invalidNames.join(", ")}`,
      );
    } else {
      setValidationMessage(null);
    }

    if (validFiles.length > 0) {
      onAddFiles(validFiles);
    }
  };

  return (
    <div className={cn("space-y-1", containerClassName)}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>

      <input
        id={inputId}
        type="file"
        className="sr-only"
        accept={resolvedAccept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleFileChange}
      />

      {validationMessage ? (
        <p className="text-xs text-destructive">{validationMessage}</p>
      ) : null}

      <div className={cn("grid grid-cols-2 gap-2", listClassName)}>
        {committedFiles.map((file) => (
          <FileItem
            key={file.id}
            fileName={file.fileName}
            fileSizeLabel={formatFileSizeLabel(file.fileSize)}
            status="Committed"
            disabled={disabled}
            onRemove={() => onRemoveCommitted(file.id)}
            previewUrl={file.previewUrl ?? null}
            mimeType={file.mimeType ?? null}
          />
        ))}

        {uncommittedFiles.map((file) => (
          <FileItem
            key={file.id}
            fileName={file.fileName}
            fileSizeLabel={formatFileSizeLabel(file.fileSize)}
            status="Uncommitted"
            disabled={disabled}
            isUploading={uploadingFileIds.includes(file.id)}
            onRemove={() => onRemoveUncommitted(file.id)}
            previewUrl={file.previewUrl ?? null}
            mimeType={file.mimeType ?? null}
          />
        ))}

        <label
          htmlFor={inputId}
          title={addFileTooltip}
          aria-label={`Add file. ${addFileTooltip}`}
          className={[
            "flex min-h-14 cursor-pointer flex-row items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-center transition-colors",
            disabled
              ? "cursor-not-allowed border-muted bg-muted/40 text-muted-foreground/60"
              : "border-muted-foreground/30 hover:border-foreground/40 hover:bg-muted/30",
          ].join(" ")}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-current/30">
            <Plus className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium">Add file</p>
        </label>
      </div>
    </div>
  );
}
