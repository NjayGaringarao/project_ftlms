"use client";

import { Download, MoreHorizontal, Printer } from "lucide-react";
import { Popover } from "radix-ui";

export const SectionScheduleExportTrigger = ({
  revisionId,
  sectionId,
  academicTermId,
}: {
  revisionId: string;
  sectionId: string;
  academicTermId: string;
}) => {
  const entityId = `${revisionId}__${sectionId}`;
  const pdfUrl = `/api/puppeteer/pdf/documents/section_schedule/single/${academicTermId}/${entityId}`;
  const printUrl = `/print/documents/section_schedule/single/${academicTermId}/${entityId}?autoPrint=1`;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          title="Export schedule"
          className="inline-flex h-6 w-6 items-center justify-center rounded-sm border text-foreground/70 hover:bg-foreground/10"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={6}>
          <div className="flex flex-col bg-background rounded-md overflow-hidden shadow-md border">
            <button
              type="button"
              onClick={() => window.open(pdfUrl, "_blank")}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-foreground/10 border-b"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              type="button"
              onClick={() => window.open(printUrl, "_blank")}
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
