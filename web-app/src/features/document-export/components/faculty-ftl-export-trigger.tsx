"use client";

import { Download, FileText, Loader2, Printer } from "lucide-react";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";

export const FacultyFtlExportTrigger = ({
  userId,
  academicTermId,
  isAvailable,
  isLoading,
}: {
  userId: string;
  academicTermId: string | null | undefined;
  isAvailable: boolean;
  isLoading: boolean;
}) => {
  const disabled = isLoading || !isAvailable;

  const pdfUrl =
    isAvailable && academicTermId
      ? `/api/puppeteer/pdf/documents/faculty_teaching_load/single/${academicTermId}/${userId}`
      : null;
  const printUrl =
    isAvailable && academicTermId
      ? `/print/documents/faculty_teaching_load/single/${academicTermId}/${userId}?autoPrint=1`
      : null;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          title={
            isLoading
              ? "Loading..."
              : !isAvailable
                ? "No teaching load document available for this term"
                : "Export teaching load"
          }
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={6} align="end">
          <div className="flex flex-col bg-background rounded-md overflow-hidden shadow-md border">
            <button
              type="button"
              onClick={() => pdfUrl && window.open(pdfUrl, "_blank")}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-foreground/10 border-b"
            >
              <FileText className="h-4 w-4" />
              Export as PDF
            </button>
            <button
              type="button"
              onClick={() => printUrl && window.open(printUrl, "_blank")}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-foreground/10"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
