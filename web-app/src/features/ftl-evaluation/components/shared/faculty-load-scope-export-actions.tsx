"use client";

import { useMemo } from "react";
import { Download, Printer } from "lucide-react";
import { Popover } from "radix-ui";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import {
  SYNC_PDF_MAX_COUNT,
} from "@/features/document-export/lib/document-export/constants";
import type { FacultyLoadExportScope } from "@/features/document-export/lib/faculty-load-export/scope";
import { toFacultyLoadExportScopeSearchParams } from "@/features/document-export/lib/faculty-load-export/scope";
import { useDocumentExportJob } from "@/features/document-export/hooks/use-document-export-job";

type FacultyLoadScopeExportActionsProps = {
  academicTermId: string;
  scope: FacultyLoadExportScope;
  exportableCount: number;
  disabledReason?: string;
  triggerLabel?: string;
  triggerClassName?: string;
};

const FacultyLoadScopeExportActions = ({
  academicTermId,
  scope,
  exportableCount,
  disabledReason,
  triggerLabel = "Export filtered",
  triggerClassName,
}: FacultyLoadScopeExportActionsProps) => {
  const scopeSearchParams = useMemo(
    () => toFacultyLoadExportScopeSearchParams(scope),
    [scope],
  );
  const scopeSearchString = scopeSearchParams.toString();
  const localStorageJobKey = useMemo(
    () => `document-export-job:faculty_load:${academicTermId}:${scopeSearchString}`,
    [academicTermId, scopeSearchString],
  );

  const canExport = exportableCount > 0 && !disabledReason;
  const disabledMessage =
    disabledReason ??
    (exportableCount <= 0
      ? "No exportable faculty found for the current scope."
      : "");

  const printPath = `/print/documents/faculty_load/scope/${academicTermId}?${scopeSearchString}&autoPrint=1`;
  const syncPdfPath = `/api/puppeteer/pdf/documents/faculty_load/scope/${academicTermId}?${scopeSearchString}`;

  const openNewTab = (path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  };

  const {
    isProgressDialogOpen,
    setIsProgressDialogOpen,
    isStartingJob,
    job,
    jobDownloadUrl,
    progressError,
    progressLabel,
    startAsyncExport,
  } = useDocumentExportJob({
    localStorageKey: localStorageJobKey,
    academicTermId,
    documentType: "faculty_load",
    scope,
  });

  const handlePrint = () => {
    if (!canExport) return;
    openNewTab(printPath);
  };

  const handleDownload = async () => {
    if (!canExport) return;

    if (exportableCount <= SYNC_PDF_MAX_COUNT) {
      openNewTab(syncPdfPath);
      return;
    }

    await startAsyncExport();
  };

  return (
    <>
      <Popover.Root>
        <Popover.Trigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={triggerClassName ?? "h-7 px-2 text-xs"}
            disabled={!canExport}
            title={
              canExport
                ? "Export faculty teaching load documents"
                : disabledMessage
            }
          >
            <Download className="h-4 w-4" /> {triggerLabel}
          </Button>
        </Popover.Trigger>
        <Popover.Anchor />
        <Popover.Portal>
          <Popover.Content sideOffset={6}>
            <div className="flex flex-col overflow-hidden rounded-md border bg-background shadow-md">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:bg-foreground/5"
                disabled={!canExport}
                onClick={handleDownload}
                title={
                  canExport
                    ? exportableCount <= SYNC_PDF_MAX_COUNT
                      ? "Download merged PDF"
                      : "Download merged PDF (asynchronous processing)"
                    : disabledMessage
                }
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:bg-foreground/5"
                disabled={!canExport}
                onClick={handlePrint}
                title={
                  canExport
                    ? "Open print view"
                    : disabledMessage
                }
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <AppDialog
        open={isProgressDialogOpen}
        onOpenChange={setIsProgressDialogOpen}
        title="Preparing Bulk PDF Export"
        description="Large exports run in background chunks. Keep this dialog open to monitor progress."
        contentClassName="w-full max-w-lg"
      >
        <div className="space-y-3 text-sm text-foreground/80">
          {isStartingJob && <p>Starting export job...</p>}
          {!isStartingJob && job && (
            <>
              <p>
                Status: <strong>{job.status}</strong>
              </p>
              <p>{progressLabel}</p>
            </>
          )}
          {!isStartingJob && !job && !progressError && (
            <p>Waiting to start export processing...</p>
          )}
          {progressError && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
              {progressError}
            </p>
          )}
          {job?.status === "COMPLETED" && jobDownloadUrl && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-emerald-700">Export completed successfully.</p>
              <Button
                type="button"
                size="sm"
                className="mt-2"
                onClick={() => openNewTab(jobDownloadUrl)}
              >
                Download now
              </Button>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProgressDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </AppDialog>
    </>
  );
};

export default FacultyLoadScopeExportActions;
