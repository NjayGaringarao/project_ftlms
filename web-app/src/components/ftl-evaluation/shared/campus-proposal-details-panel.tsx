import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCampusProposalAction } from "@/lib/proposal/actions";
import type {
  CampusProposal,
  CampusProposalEvaluation,
  EvaluationStatus,
  ProposalLifecycleStatus,
} from "@/models";
import type { CampusProposalMemberWithFaculty } from "@/lib/proposal/read-models";
import { formatDateTime } from "@/utils/time";

type CampusProposalDetailsControl = {
  academicTermId: string;
  campusId: string;
  hasCampusDirectorDesignation: boolean;
  approvedIndividuals: number;
  activeIndividuals: number;
};

type CampusProposalDetailsPanelProps = {
  campusProposal: CampusProposal | null;
  members: CampusProposalMemberWithFaculty[];
  evaluations: CampusProposalEvaluation[];
  control?: CampusProposalDetailsControl;
};

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

const evaluationStyle: Record<EvaluationStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700 border-slate-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
};

const toFixed = (value: number | string | null) => {
  const parsed = Number(value ?? NaN);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "-";
};

const CampusProposalDetailsPanel = ({
  campusProposal,
  members,
  evaluations,
  control,
}: CampusProposalDetailsPanelProps) => {
  const dfiEvaluation =
    evaluations.find(
      (evaluation) => evaluation.step === "DIRECTOR_FOR_INSTRUCTION",
    ) ?? null;
  const vpaaEvaluation =
    evaluations.find(
      (evaluation) => evaluation.step === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS",
    ) ?? null;

  const canCreateCampusProposal =
    !!control &&
    control.hasCampusDirectorDesignation &&
    control.approvedIndividuals > 0 &&
    control.activeIndividuals === 0;

  const createButtonLabel =
    campusProposal && campusProposal.lifecycle_status === "INVALIDATED"
      ? "Recreate Campus Load Proposal"
      : "Create Campus Load Proposal";

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">
          Campus Load Proposal Details
        </CardTitle>
      </CardHeader>

      <CardContent className="min-h-0 space-y-4">
        <div className="grid grid-cols-3 gap-2 text-sm reverse">
          {!campusProposal ? (
            <div className="flex flex-row gap-4 justify-between items-center rounded-md border border-dashed px-3 py-4 text-sm">
              <p className="text-foreground/70">
                No campus proposal found for this campus and term yet.
              </p>
              {control ? (
                <div className="space-y-2">
                  {control.hasCampusDirectorDesignation && (
                    <form action={createCampusProposalAction}>
                      <input
                        type="hidden"
                        name="academicTermId"
                        value={control.academicTermId}
                      />
                      <input
                        type="hidden"
                        name="campusId"
                        value={control.campusId}
                      />
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
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-row gap-4 justify-between rounded-md border p-3 text-sm">
              <div>
                <p className="flex items-center gap-2">
                  <span>Campus Proposal:</span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-sm ${lifecycleStyle[campusProposal.lifecycle_status]}`}
                  >
                    {lifecycleLabel[campusProposal.lifecycle_status]}
                  </span>
                </p>
                {campusProposal.lifecycle_status === "INVALIDATED" ? (
                  <p className="text-xs text-foreground/60">
                    {campusProposal.invalidated_reason
                      ?.trim()
                      .replaceAll("_", " ") || "No reason provided."}
                  </p>
                ) : (
                  <p className="text-xs text-foreground/60">
                    Created at{" "}
                    {formatDateTime(campusProposal.created_at ?? undefined)}.
                  </p>
                )}
              </div>
              {control ? (
                <div className="space-y-2 pt-1">
                  <form action={createCampusProposalAction}>
                    <input
                      type="hidden"
                      name="academicTermId"
                      value={control.academicTermId}
                    />
                    <input
                      type="hidden"
                      name="campusId"
                      value={control.campusId}
                    />
                    {canCreateCampusProposal &&
                      campusProposal &&
                      campusProposal.lifecycle_status !== "ACTIVE" && (
                        <Button size="sm" disabled={!canCreateCampusProposal}>
                          {createButtonLabel}
                        </Button>
                      )}
                  </form>
                  {!control.hasCampusDirectorDesignation && (
                    <p className="text-xs text-foreground/60">
                      Campus Director designation is required for this campus to
                      create a campus proposal.
                    </p>
                  )}
                  {control.hasCampusDirectorDesignation &&
                    !canCreateCampusProposal && (
                      <p className="text-xs text-foreground/60">
                        Requires at least one approved individual proposal and
                        zero active pending proposals.
                      </p>
                    )}
                </div>
              ) : null}
            </div>
          )}
          {campusProposal &&
          campusProposal.lifecycle_status !== "INVALIDATED" ? (
            <>
              <div className="rounded-md border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">Director for Instruction</p>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-xs ${evaluationStyle[dfiEvaluation?.status ?? "PENDING"]}`}
                  >
                    {dfiEvaluation?.status ?? "PENDING"}
                  </span>
                </div>
                <p className="text-foreground/70">
                  {dfiEvaluation?.comment ?? "No comment yet."}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">VP for Academic Affairs</p>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-xs ${evaluationStyle[vpaaEvaluation?.status ?? "PENDING"]}`}
                  >
                    {vpaaEvaluation?.status ?? "PENDING"}
                  </span>
                </div>
                <p className="text-foreground/70">
                  {vpaaEvaluation?.comment ?? "No comment yet."}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampusProposalDetailsPanel;
