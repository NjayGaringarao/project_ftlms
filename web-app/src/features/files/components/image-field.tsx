"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/style";

type ImageFieldProps = {
  label?: string;
  hint?: string;
  currentImageUrl?: string | null;
  onUpload: (file: File) => Promise<{ error?: string }>;
  onRemove?: () => Promise<{ error?: string }>;
  accept?: string;
  maxSizeBytes?: number;
  disabled?: boolean;
};

export function ImageField({
  label,
  hint,
  currentImageUrl,
  onUpload,
  onRemove,
  accept = "image/*",
  maxSizeBytes,
  disabled = false,
}: ImageFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const stagedUrlRef = useRef<string | null>(null);
  const [staged, setStaged] = useState<{ file: File; previewUrl: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke any leftover object URL on unmount
  useEffect(() => () => {
    if (stagedUrlRef.current) URL.revokeObjectURL(stagedUrlRef.current);
  }, []);

  const clearStaged = () => {
    if (stagedUrlRef.current) {
      URL.revokeObjectURL(stagedUrlRef.current);
      stagedUrlRef.current = null;
    }
    setStaged(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (maxSizeBytes && file.size > maxSizeBytes) {
      setError(`File exceeds ${Math.floor(maxSizeBytes / (1024 * 1024))}MB limit.`);
      return;
    }

    setError(null);

    if (stagedUrlRef.current) URL.revokeObjectURL(stagedUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    stagedUrlRef.current = previewUrl;
    setStaged({ file, previewUrl });
  };

  const handleSave = async () => {
    if (!staged) return;
    setIsSaving(true);
    setError(null);
    const result = await onUpload(staged.file);
    setIsSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    clearStaged();
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setIsRemoving(true);
    setError(null);
    const result = await onRemove();
    setIsRemoving(false);
    if (result?.error) setError(result.error);
  };

  const isBusy = isSaving || isRemoving || disabled;
  const isStaged = staged !== null;
  const displayUrl = isStaged ? staged.previewUrl : currentImageUrl;

  return (
    <div className="space-y-1.5">
      {label ? (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border",
            isStaged
              ? "border-primary/50 bg-muted ring-2 ring-primary/20"
              : "bg-muted",
          )}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Preview"
              className="h-full w-full object-contain"
            />
          ) : (
            <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {isStaged ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isBusy}
                onClick={handleSave}
              >
                <Check />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={clearStaged}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={accept}
                className="sr-only"
                disabled={isBusy}
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => inputRef.current?.click()}
              >
                <Upload />
                {currentImageUrl ? "Change" : "Upload"}
              </Button>

              {currentImageUrl && onRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isBusy}
                  onClick={handleRemove}
                  aria-label="Remove image"
                >
                  {isRemoving ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <X />
                  )}
                </Button>
              ) : null}
            </div>
          )}

          {hint ? (
            <p className="text-[11px] text-muted-foreground">
              {isStaged ? "Review your selection, then save." : hint}
            </p>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
