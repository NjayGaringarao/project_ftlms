"use client";

import { useRef, useState } from "react";
import { File, FileSpreadsheet, FileText, Image as ImageIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const getFileTypeInfo = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "pdf") return { label: "PDF", icon: FileText };
  if (extension === "doc" || extension === "docx") {
    return { label: "Document", icon: FileText };
  }
  if (["xls", "xlsx", "csv"].includes(extension)) {
    return { label: "Spreadsheet", icon: FileSpreadsheet };
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)) {
    return { label: "Image", icon: ImageIcon };
  }
  return { label: "File", icon: File };
};

export const FileAttachmentComposer = ({
  fileInputName,
  commentName,
  commentPlaceholder = "Add a comment",
  required = false,
}: {
  fileInputName: string;
  commentName: string;
  commentPlaceholder?: string;
  required?: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const clearFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedFile(null);
  };

  const fileInfo = selectedFile ? getFileTypeInfo(selectedFile.name) : null;
  const FileIcon = fileInfo?.icon;

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        name={fileInputName}
        className="hidden"
        onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
      />
      {selectedFile && FileIcon ? (
        <div className="flex items-center gap-2 rounded-md border bg-foreground/5 p-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-foreground/60">{fileInfo.label}</p>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="rounded-md p-1 text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <div className="flex items-center gap-1 rounded-full border bg-background px-2 py-1.5">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="shrink-0 rounded-full"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach a file"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <input
          type="text"
          name={commentName}
          required={required}
          placeholder={commentPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/50"
        />
      </div>
    </div>
  );
};
