import type {
  CampusLoad,
  CampusLoadEvaluation,
  EvaluationStatus,
} from "@/models";
import CampusLoadStepAction from "@/components/ftl-evaluation/shared/campus-load-step-action";

const evaluationStyle: Record<EvaluationStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700 border-slate-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
};

type CampusLoadLadderGridProps = {
  campusLoad: CampusLoad;
  diEvaluation: CampusLoadEvaluation | null;
  vpaaEvaluation: CampusLoadEvaluation | null;
  showDiCard: boolean;
  showVpaaCard: boolean;
  canEvaluateAsDi: boolean;
  canEvaluateAsVpaa: boolean;
};

const CampusLoadLadderGrid = ({
  campusLoad,
  diEvaluation,
  vpaaEvaluation,
  showDiCard,
  showVpaaCard,
  canEvaluateAsDi,
  canEvaluateAsVpaa,
}: CampusLoadLadderGridProps) => {
  if (!showDiCard && !showVpaaCard) return null;

  return (
    <div
      className={`grid gap-2 text-sm ${showDiCard && showVpaaCard ? "grid-cols-2" : "grid-cols-1"}`}
    >
      {showDiCard ? (
        <div className="rounded-md border p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-medium">Director for Instruction</p>
            <span
              className={`rounded border px-1.5 py-0.5 text-xs ${evaluationStyle[diEvaluation?.status ?? "PENDING"]}`}
            >
              {diEvaluation?.status ?? "PENDING"}
            </span>
          </div>
          <p className="text-sm text-foreground/70">
            {diEvaluation?.comment ?? "No comment yet."}
          </p>
          {canEvaluateAsDi ? (
            <CampusLoadStepAction
              campusLoadId={campusLoad.id}
              step="DIRECTOR_FOR_INSTRUCTION"
              rejectTitle="Reject Campus Proposal (DI)"
              rejectDescription="Provide an optional reason for rejecting this campus proposal."
            />
          ) : null}
        </div>
      ) : null}

      {showVpaaCard ? (
        <div className="rounded-md border p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-medium">VP for Academic Affairs</p>
            <span
              className={`rounded border px-1.5 py-0.5 text-xs ${evaluationStyle[vpaaEvaluation?.status ?? "PENDING"]}`}
            >
              {vpaaEvaluation?.status ?? "PENDING"}
            </span>
          </div>
          <p className="text-sm text-foreground/70">
            {vpaaEvaluation?.comment ?? "No comment yet."}
          </p>
          {canEvaluateAsVpaa ? (
            <CampusLoadStepAction
              campusLoadId={campusLoad.id}
              step="VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS"
              rejectTitle="Reject Campus Proposal (VPAA)"
              rejectDescription="Provide an optional reason for rejecting this campus proposal."
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default CampusLoadLadderGrid;
