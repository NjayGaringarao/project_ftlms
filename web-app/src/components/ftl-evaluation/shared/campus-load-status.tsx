import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampusProposal, CampusProposalEvaluation } from "@/models";
import { deriveCampusProposalLadderState } from "@/lib/proposal/ladder";
import type {
  CampusLoadEvaluationControl,
  CampusLoadStatusControl,
} from "@/components/ftl-evaluation/shared/campus-load-status.types";
import CampusLoadStatusSummary from "@/components/ftl-evaluation/shared/campus-load-status-summary";
import CampusLoadLadderGrid from "@/components/ftl-evaluation/shared/campus-load-ladder-grid";

type CampusLoadStatusProps = {
  campusProposal: CampusProposal | null;
  evaluations: CampusProposalEvaluation[];
  control?: CampusLoadStatusControl;
  evaluationControl?: CampusLoadEvaluationControl;
};

const CampusLoadStatus = ({
  campusProposal,
  evaluations,
  control,
  evaluationControl,
}: CampusLoadStatusProps) => {
  const {
    diEvaluation,
    vpaaEvaluation,
    hasRenderableCampusProposal,
    showDiCard,
    showVpaaCard,
    canEvaluateAsDi,
    canEvaluateAsVpaa,
  } = deriveCampusProposalLadderState({
    campusProposal,
    evaluations,
    hasDiDesignation: evaluationControl?.hasDiDesignation,
    hasVpaaDesignation: evaluationControl?.hasVpaaDesignation,
  });

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Campus Load Proposal Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CampusLoadStatusSummary campusProposal={campusProposal} control={control} />
        {hasRenderableCampusProposal && campusProposal ? (
          <CampusLoadLadderGrid
            campusProposal={campusProposal}
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
