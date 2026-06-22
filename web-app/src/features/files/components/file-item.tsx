"use client";

import { useState, type ReactNode } from "react";
import {
  FileArchive,
  FileCode,
  FileX,
  FileImage,
  LoaderCircle,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  X,
} from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/style";

type FileItemStatus = "Committed" | "Uncommitted";
type FileItemLayout = "default" | "compact";
type FileItemAnnotationPlacement = "overlay" | "rail";

type FileItemProps = {
  fileName: string;
  fileSizeLabel: string;
  status: FileItemStatus;
  onRemove?: () => void;
  onClick?: () => void;
  previewUrl?: string | null;
  mimeType?: string | null;
  enablePreview?: boolean;
  disabled?: boolean;
  isUploading?: boolean;
  layout?: FileItemLayout;
  hideStatus?: boolean;
  hideRemoveAction?: boolean;
  annotations?: ReactNode;
  annotationsPlacement?: FileItemAnnotationPlacement;
  trailingActions?: ReactNode;
  annotation?: ReactNode;
  annotationClassName?: string;
  className?: string;
};

function isImageFile(fileName: string, mimeType?: string | null) {
  return (
    mimeType?.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif"].includes(
      extensionFromFileName(fileName),
    )
  );
}

function isPdfFile(fileName: string, mimeType?: string | null) {
  return (
    mimeType === "application/pdf" || extensionFromFileName(fileName) === "pdf"
  );
}

export function formatFileSizeLabel(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function extensionFromFileName(fileName: string) {
  return fileName.includes(".")
    ? (fileName.split(".").pop()?.toLowerCase() ?? "")
    : "";
}

function FileTypeIcon({ fileName }: { fileName: string }) {
  const ext = extensionFromFileName(fileName);

  if (ext === "pdf" || ext === "doc" || ext === "docx" || ext === "txt") {
    return <FileText className="h-5 w-5" />;
  }
  if (ext === "xls" || ext === "xlsx" || ext === "csv") {
    return <FileSpreadsheet className="h-5 w-5" />;
  }
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp") {
    return <FileImage className="h-5 w-5" />;
  }
  if (ext === "zip" || ext === "rar" || ext === "7z") {
    return <FileArchive className="h-5 w-5" />;
  }
  if (ext === "json" || ext === "xml" || ext === "yml" || ext === "yaml") {
    return <FileCode className="h-5 w-5" />;
  }
  return <FileText className="h-5 w-5" />;
}

export function FileItem({
  fileName,
  fileSizeLabel,
  status,
  onRemove,
  onClick,
  previewUrl = null,
  mimeType = null,
  enablePreview = true,
  disabled = false,
  isUploading = false,
  layout = "default",
  hideStatus = false,
  hideRemoveAction = false,
  annotations,
  annotationsPlacement = "overlay",
  trailingActions,
  annotation,
  annotationClassName,
  className,
}: FileItemProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const statusClassName =
    status === "Committed"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";
  const canPreview = Boolean(previewUrl) && enablePreview && !isUploading;
  const canInlineImage = Boolean(previewUrl) && isImageFile(fileName, mimeType);
  const canInlinePdf = Boolean(previewUrl) && isPdfFile(fileName, mimeType);
  const canDirectOpen = Boolean(previewUrl);
  const resolvedAnnotations = annotations ?? annotation;

  const handleItemClick = () => {
    if (disabled) return;
    if (canPreview) {
      setPreviewOpen(true);
      return;
    }
    onClick?.();
  };

  return (
    <>
      <div
        className={cn(
          layout === "compact"
            ? "relative flex min-h-12 w-64 max-w-full shrink-0 items-center overflow-hidden rounded-2xl border bg-card/80 text-foreground transition hover:border-foreground/30 hover:bg-accent/50"
            : "relative flex min-h-14 items-center overflow-hidden rounded-lg border bg-card text-foreground transition hover:border-foreground/30 hover:bg-accent/50",
          className,
        )}
      >
        {resolvedAnnotations && annotationsPlacement === "overlay" ? (
          <div className={cn("absolute right-2 top-2 z-10", annotationClassName)}>
            {resolvedAnnotations}
          </div>
        ) : null}

        <button
          type="button"
          disabled={disabled}
          onClick={handleItemClick}
          className={cn(
            "flex min-w-0 flex-1 items-center text-left",
            (canPreview || onClick) && !disabled ? "cursor-pointer" : "",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center bg-foreground/80 text-background/80",
              layout === "compact"
                ? "h-full min-h-12 min-w-12"
                : "min-h-14 min-w-14",
            )}
          >
            {isUploading ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <FileTypeIcon fileName={fileName} />
            )}
          </div>

          <div
            className={cn(
              "min-w-0 flex-1 overflow-hidden",
              layout === "compact"
                ? "flex flex-col items-start px-3 py-2"
                : "flex flex-col items-start px-4 py-2",
            )}
          >
            <p className="line-clamp-1 truncate text-left text-sm font-semibold text-foreground">
              {fileName}
            </p>
            <div className="flex flex-row items-center gap-1">
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {fileSizeLabel}
              </p>
              {!hideStatus ? (
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    statusClassName,
                  )}
                >
                  {status}
                </span>
              ) : null}
            </div>
          </div>
        </button>

        <div
          className={cn(
            "flex h-full items-center gap-1",
            layout === "compact" ? "p-1.5" : "p-2",
          )}
        >
          {resolvedAnnotations && annotationsPlacement === "rail"
            ? resolvedAnnotations
            : null}

          {trailingActions}

          {!hideRemoveAction && onRemove ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <AppDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={fileName || "File Preview"}
        contentClassName="h-full max-h-[100vh]"
        variant="full-screen"
      >
        <div className="flex h-full flex-1 flex-col space-y-3">
          {canInlinePdf ? (
            <iframe
              title={fileName}
              src={previewUrl ?? ""}
              className="flex-1 w-full rounded-md"
            />
          ) : null}

          {canInlineImage ? (
            <div className="rounded-md border p-2">
              <img
                src={previewUrl ?? ""}
                alt={fileName}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
          ) : null}

          {!canInlinePdf && !canInlineImage ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-md border p-4">
              <div className="flex w-max-10 flex-row items-center gap-2 text-foreground/80">
                {canDirectOpen ? (
                  <ImageIcon className="h-10 w-10" />
                ) : (
                  <FileX className="h-10 w-10" />
                )}
                <div className="flex flex-col">
                  <p className="text-xl font-medium">Preview is not available</p>
                  <p className="-mt-1 text-sm text-muted-foreground">
                    You can download to open the file.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            {canDirectOpen ? (
              <Button asChild type="button">
                <a href={previewUrl ?? "#"} download={fileName}>
                  Download
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </AppDialog>
    </>
  );
}
