import type { ReactNode } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/utils/time";

export const RevisionHeader = ({
  revisionNumber,
  submittedAt,
  statusLine,
  revisionSlot,
  actionSlot,
  onHistoryClick,
}: {
  revisionNumber: number;
  submittedAt: string | null | undefined;
  statusLine: string;
  revisionSlot?: ReactNode;
  actionSlot?: ReactNode;
  onHistoryClick: () => void;
}) => (
  <div className="flex flex-col gap-3 rounded-md border p-3 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div className="flex flex-col gap-1">
        <p className="text-base text-foreground ">
          Revision {revisionNumber} submitted{" "}
          {formatDateTime(submittedAt ?? undefined)}
        </p>

        <p className="text-sm text-foreground/60">{statusLine}</p>
      </div>
    </div>
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {revisionSlot}
      <Button type="button" size="sm" variant="outline" onClick={onHistoryClick}>
        <History className="h-4 w-4" />
        History
      </Button>
      {actionSlot}
    </div>
  </div>
);
