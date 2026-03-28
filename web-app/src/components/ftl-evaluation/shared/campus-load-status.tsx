import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampusLoad, CampusLoadEvaluation } from "@/models";
import { deriveCampusLoadLadderState } from "@/lib/load-proposal/ladder";
import type {
  CampusLoadEvaluationControl,
  CampusLoadStatusControl,
} from "@/components/ftl-evaluation/shared/campus-load-status.types";
import CampusLoadStatusSummary from "@/components/ftl-evaluation/shared/campus-load-status-summary";
import CampusLoadLadderGrid from "@/components/ftl-evaluation/shared/campus-load-ladder-grid";

type CampusLoadStatusProps = {
  campusLoad: CampusLoad | null;
  evaluations: CampusLoadEvaluation[];
  control?: CampusLoadStatusControl;
  evaluationControl?: CampusLoadEvaluationControl;
};

const CampusLoadStatus = ({
  campusLoad,
  evaluations,
  control,
  evaluationControl,
}: CampusLoadStatusProps) => {
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
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Campus Load Proposal Status</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        <CampusLoadStatusSummary campusLoad={campusLoad} control={control} />
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
