import type { CampusLoad, ProposalLifecycleStatus } from "@/features/shared/types/models";
import { formatDateTime } from "@/utils/time";
import type { CampusLoadStatusControl } from "@/features/ftl-evaluation/components/shared/campus-load-status.types";

const lifecycleLabel: Record<ProposalLifecycleStatus, string> = {
  ACTIVE: "Active",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  INVALIDATED: "Invalidated",
};

const lifecycleStyle: Record<ProposalLifecycleStatus, string> = {
  ACTIVE: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  INVALIDATED: "bg-slate-100 text-slate-800 border-slate-200",
};

type CampusLoadStatusSummaryProps = {
  campusLoad: CampusLoad | null;
  control?: CampusLoadStatusControl;
  canCreateCampusLoad: boolean;
};

const CampusLoadStatusSummary = ({
  campusLoad,
  control,
  canCreateCampusLoad,
}: CampusLoadStatusSummaryProps) => {
  if (!campusLoad) {
    return (
      <div className="flex flex-col justify-center gap-2 rounded-md border border-dashed px-3 py-4 text-sm">
        <p className="text-foreground/70">No campus load found for this campus and term yet.</p>
        {!control?.hasCampusDirectorDesignation && control ? (
          <p className="text-xs text-foreground/60">
            Campus Director designation is required for this campus to create a
            campus load.
          </p>
        ) : null}
        {control?.hasCampusDirectorDesignation && !canCreateCampusLoad ? (
          <p className="text-xs text-foreground/60">
            Requires at least one approved individual proposal and zero active
            pending proposals.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between gap-2 rounded-md border p-3 text-sm">
      <div className="flex flex-row items-center justify-between">
        <p className="flex items-center gap-2">
          <span className="font-medium text-foreground">Campus Load:</span>
          <span
            className={`rounded border px-1.5 py-0.5 text-sm ${lifecycleStyle[campusLoad.lifecycle_status]}`}
          >
            {lifecycleLabel[campusLoad.lifecycle_status]}
          </span>
        </p>
      </div>
      {campusLoad.lifecycle_status === "INVALIDATED" ? (
        <p className="text-xs text-foreground/60">
          {campusLoad.invalidated_reason?.trim().replaceAll("_", " ") ||
            "No reason provided."}
        </p>
      ) : (
        <p className="text-xs text-foreground/60">
          Created at {formatDateTime(campusLoad.created_at ?? undefined)}.
        </p>
      )}

      {control ? (
        <div className="space-y-2 pt-1">
          {!control.hasCampusDirectorDesignation ? (
            <p className="text-xs text-foreground/60">
              Campus Director designation is required for this campus to create a
              campus load.
            </p>
          ) : null}
          {control.hasCampusDirectorDesignation && !canCreateCampusLoad ? (
            <p className="text-xs text-foreground/60">
              Requires at least one approved individual proposal and zero active
              pending proposals.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default CampusLoadStatusSummary;
