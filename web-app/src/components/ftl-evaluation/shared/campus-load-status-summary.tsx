import { Button } from "@/components/ui/button";
import { createCampusProposalAction } from "@/lib/proposal/actions";
import type { CampusProposal, ProposalLifecycleStatus } from "@/models";
import { formatDateTime } from "@/utils/time";
import type { CampusLoadStatusControl } from "@/components/ftl-evaluation/shared/campus-load-status.types";

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
  campusProposal: CampusProposal | null;
  control?: CampusLoadStatusControl;
};

const CampusLoadStatusSummary = ({
  campusProposal,
  control,
}: CampusLoadStatusSummaryProps) => {
  const canCreateCampusProposal =
    !!control &&
    control.hasCampusDirectorDesignation &&
    control.approvedIndividuals > 0 &&
    control.activeIndividuals === 0;

  const createButtonLabel =
    campusProposal && campusProposal.lifecycle_status === "INVALIDATED"
      ? "Recreate Campus Load Proposal"
      : "Create Campus Load Proposal";

  if (!campusProposal) {
    return (
      <div className="flex flex-row items-center justify-between gap-4 rounded-md border border-dashed px-3 py-4 text-sm">
        <p className="text-foreground/70">
          No campus proposal found for this campus and term yet.
        </p>
        {control?.hasCampusDirectorDesignation ? (
          <form action={createCampusProposalAction}>
            <input
              type="hidden"
              name="academicTermId"
              value={control.academicTermId}
            />
            <input type="hidden" name="campusId" value={control.campusId} />
            <Button
              title={
                !canCreateCampusProposal
                  ? "Requires at least one approved individual proposal and zero active pending proposals."
                  : "Create a new campus proposal for this campus and term."
              }
              size="sm"
              disabled={!canCreateCampusProposal}
            >
              {createButtonLabel}
            </Button>
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between gap-2 rounded-md border p-3 text-sm">
      <div className="flex flex-row items-center justify-between">
        <p className="flex items-center gap-2">
          <span className="font-medium text-foreground">Campus Proposal:</span>
          <span
            className={`rounded border px-1.5 py-0.5 text-sm ${lifecycleStyle[campusProposal.lifecycle_status]}`}
          >
            {lifecycleLabel[campusProposal.lifecycle_status]}
          </span>
        </p>
      </div>
      {campusProposal.lifecycle_status === "INVALIDATED" ? (
        <p className="text-xs text-foreground/60">
          {campusProposal.invalidated_reason?.trim().replaceAll("_", " ") ||
            "No reason provided."}
        </p>
      ) : (
        <p className="text-xs text-foreground/60">
          Created at {formatDateTime(campusProposal.created_at ?? undefined)}.
        </p>
      )}

      {control ? (
        <div className="space-y-2 pt-1">
          <form action={createCampusProposalAction}>
            <input
              type="hidden"
              name="academicTermId"
              value={control.academicTermId}
            />
            <input type="hidden" name="campusId" value={control.campusId} />
            {canCreateCampusProposal &&
              campusProposal.lifecycle_status !== "ACTIVE" && (
                <Button size="sm">{createButtonLabel}</Button>
              )}
          </form>
          {!control.hasCampusDirectorDesignation ? (
            <p className="text-xs text-foreground/60">
              Campus Director designation is required for this campus to create a
              campus proposal.
            </p>
          ) : null}
          {control.hasCampusDirectorDesignation && !canCreateCampusProposal ? (
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
