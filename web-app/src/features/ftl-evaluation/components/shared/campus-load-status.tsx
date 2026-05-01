import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCampusLoadAction } from "@/features/ftl-evaluation/lib/load-proposal/actions";
import type { CampusLoad, CampusLoadEvaluation } from "@/features/shared/types/models";
import { deriveCampusLoadLadderState } from "@/features/ftl-evaluation/lib/load-proposal/ladder";
import type {
  CampusLoadEvaluationControl,
  CampusLoadStatusControl,
} from "@/features/ftl-evaluation/components/shared/campus-load-status.types";
import CampusLoadStatusSummary from "@/features/ftl-evaluation/components/shared/campus-load-status-summary";
import CampusLoadLadderGrid from "@/features/ftl-evaluation/components/shared/campus-load-ladder-grid";

type CampusLoadStatusProps = {
  campusLoad: CampusLoad | null;
  evaluations: CampusLoadEvaluation[];
  control?: CampusLoadStatusControl;
  evaluationControl?: CampusLoadEvaluationControl;
};

const invalidatedBadgeClass =
  "rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900";

const CampusLoadStatus = ({
  campusLoad,
  evaluations,
  control,
  evaluationControl,
}: CampusLoadStatusProps) => {
  const hasCampusDirectorDesignation = !!control?.hasCampusDirectorDesignation;
  const canCreateCampusLoad =
    !!control &&
    hasCampusDirectorDesignation &&
    control.approvedIndividuals > 0 &&
    control.activeIndividuals === 0;
  const showCreateCampusLoadAction =
    !!control &&
    hasCampusDirectorDesignation &&
    (!campusLoad || campusLoad.lifecycle_status !== "ACTIVE");
  const createButtonLabel =
    campusLoad && campusLoad.lifecycle_status === "INVALIDATED"
      ? "Recreate Campus Load"
      : "Create Campus Load";
  const createButtonTitle = canCreateCampusLoad
    ? "Create a new campus load for this campus and term."
    : "Requires at least one approved individual proposal and zero active pending proposals.";

  const {
    diEvaluation,
    vpaaEvaluation,
    hasRenderableCampusLoad,
    showDiCard,
    showVpaaCard,
    canEvaluateAsDi,
    canEvaluateAsVpaa,
  } = deriveCampusLoadLadderState({
    campusLoad,
    evaluations,
    hasDiDesignation: evaluationControl?.hasDiDesignation,
    hasVpaaDesignation: evaluationControl?.hasVpaaDesignation,
  });

  return (
    <Card className="h-fit gap-0">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 text-sm">
        <div className="flex flex-row items-center gap-2">
          <CardTitle className="text-base">Campus Load Status</CardTitle>
          {campusLoad?.lifecycle_status === "INVALIDATED" ? (
            <span className={invalidatedBadgeClass}>INVALIDATED</span>
          ) : null}
        </div>
        {showCreateCampusLoadAction && control ? (
          <form action={createCampusLoadAction}>
            <input
              type="hidden"
              name="academicTermId"
              value={control.academicTermId}
            />
            <input type="hidden" name="campusId" value={control.campusId} />
            <Button
              size="sm"
              disabled={!canCreateCampusLoad}
              title={createButtonTitle}
            >
              {createButtonLabel}
            </Button>
          </form>
        ) : null}
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        <CampusLoadStatusSummary
          campusLoad={campusLoad}
          control={control}
          canCreateCampusLoad={canCreateCampusLoad}
        />
        {hasRenderableCampusLoad && campusLoad ? (
          <CampusLoadLadderGrid
            campusLoad={campusLoad}
            diEvaluation={diEvaluation}
            vpaaEvaluation={vpaaEvaluation}
            showDiCard={showDiCard}
            showVpaaCard={showVpaaCard}
            canEvaluateAsDi={canEvaluateAsDi}
            canEvaluateAsVpaa={canEvaluateAsVpaa}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};

export default CampusLoadStatus;
