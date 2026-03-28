import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCampusProposalAction } from "@/lib/proposal/actions";
import type {
  CampusProposal,
  CampusProposalEvaluation,
  EvaluationStatus,
  ProposalLifecycleStatus,
} from "@/models";
import { formatDateTime } from "@/utils/time";
import CampusProposalStepAction from "@/components/ftl-evaluation/shared/campus-proposal-step-action";

type CampusProposalDetailsControl = {
  academicTermId: string;
  campusId: string;
  hasCampusDirectorDesignation: boolean;
  approvedIndividuals: number;
  activeIndividuals: number;
};

type CampusProposalEvaluationControl = {
  hasDfiDesignation: boolean;
  hasVpaaDesignation: boolean;
};

type CampusLoadStatusProps = {
  campusProposal: CampusProposal | null;
  evaluations: CampusProposalEvaluation[];
  control?: CampusProposalDetailsControl;
  evaluationControl?: CampusProposalEvaluationControl;
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

const CampusLoadStatus = ({
  campusProposal,
  evaluations,
  control,
  evaluationControl,
}: CampusLoadStatusProps) => {
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

  const hasRenderableCampusProposal =
    !!campusProposal && campusProposal.lifecycle_status !== "INVALIDATED";
  const showDiCard = hasRenderableCampusProposal;
  const showVpaaCard =
    hasRenderableCampusProposal &&
    (dfiEvaluation?.status === "APPROVED" || !!vpaaEvaluation);

  const canEvaluateAsDfi =
    !!evaluationControl &&
    !!campusProposal &&
    campusProposal.lifecycle_status === "ACTIVE" &&
    !dfiEvaluation &&
    evaluationControl.hasDfiDesignation;

  const canEvaluateAsVpaa =
    !!evaluationControl &&
    !!campusProposal &&
    campusProposal.lifecycle_status === "ACTIVE" &&
    dfiEvaluation?.status === "APPROVED" &&
    !vpaaEvaluation &&
    evaluationControl.hasVpaaDesignation;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Campus Load Proposal Status</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-3 gap-4">
        {!campusProposal ? (
          <div className="flex flex-row items-center justify-between gap-4 rounded-md border border-dashed px-3 py-4 text-sm">
            <p className="text-foreground/70">
              No campus proposal found for this campus and term yet.
            </p>

            <div className="w-full flex flex-col items-end border">

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
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-2 rounded-md border p-3">
            <div className="flex flex-row items-center justify-between">
         
                <span className="font-medium text-foreground">Campus Proposal:</span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-xs ${lifecycleStyle[campusProposal.lifecycle_status]}`}
                >
                  {campusProposal.lifecycle_status}
                </span>
             
            </div>
            {campusProposal.lifecycle_status === "INVALIDATED" ? (
              <p className="text-xs text-foreground/60">
                {campusProposal.invalidated_reason
                  ?.trim()
                  .replaceAll("_", " ") || "No reason provided."}
              </p>
            ) : (
              <p className="text-xs text-foreground/60">
                Created at {formatDateTime(campusProposal.created_at ?? undefined)}.
              </p>
            )}

            {control ? (
              <div className="space-y-2 pt-1 w-full flex flex-col items-end">
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
                    Campus Director designation is required for this campus to create
                    a campus proposal.
                  </p>
                ) : null}
                {control.hasCampusDirectorDesignation && !canCreateCampusProposal ? (
                  <p className="text-xs text-foreground/60">
                    Requires at least one approved individual proposal and zero
                    active pending proposals.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}


        {
          showDiCard &&
            (
              <div className="rounded-md border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">Director for Instruction</p>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-xs ${evaluationStyle[dfiEvaluation?.status ?? "PENDING"]}`}
                  >
                    {dfiEvaluation?.status ?? "PENDING"}
                  </span>
                </div>
                <p className="text-foreground/70 text-sm">
                  {dfiEvaluation?.comment ?? "No comment yet."}
                </p>
                {canEvaluateAsDfi ? (
                  <CampusProposalStepAction
                    campusProposalId={campusProposal!.id}
                    step="DIRECTOR_FOR_INSTRUCTION"
                    rejectTitle="Reject Campus Proposal (DI)"
                    rejectDescription="Provide an optional reason for rejecting this campus proposal."
                  />
                ) : null}
              </div>
            )

        }

        {
          showVpaaCard && (
             <div className="rounded-md border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">VP for Academic Affairs</p>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-xs ${evaluationStyle[vpaaEvaluation?.status ?? "PENDING"]}`}
                  >
                    {vpaaEvaluation?.status ?? "PENDING"}
                  </span>
                </div>
                <p className="text-foreground/70 text-sm">
                  {vpaaEvaluation?.comment ?? "No comment yet."}
                </p>
                {canEvaluateAsVpaa ? (
                  <CampusProposalStepAction
                    campusProposalId={campusProposal!.id}
                    step="VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS"
                    rejectTitle="Reject Campus Proposal (VPAA)"
                    rejectDescription="Provide an optional reason for rejecting this campus proposal."
                  />
                ) : null}
              </div>
          )
        }

        
      </CardContent>
    </Card>
  );
};

export default CampusLoadStatus;
