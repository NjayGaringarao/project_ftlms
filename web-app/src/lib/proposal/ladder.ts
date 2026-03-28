import type { CampusProposal, CampusProposalEvaluation } from "@/models";

type DeriveCampusLadderStateArgs = {
  campusProposal: CampusProposal | null;
  evaluations: CampusProposalEvaluation[];
  hasDiDesignation?: boolean;
  hasVpaaDesignation?: boolean;
};

export type CampusProposalLadderState = {
  diEvaluation: CampusProposalEvaluation | null;
  vpaaEvaluation: CampusProposalEvaluation | null;
  hasRenderableCampusProposal: boolean;
  showDiCard: boolean;
  showVpaaCard: boolean;
  canEvaluateAsDi: boolean;
  canEvaluateAsVpaa: boolean;
};

export const deriveCampusProposalLadderState = ({
  campusProposal,
  evaluations,
  hasDiDesignation = false,
  hasVpaaDesignation = false,
}: DeriveCampusLadderStateArgs): CampusProposalLadderState => {
  const diEvaluation =
    evaluations.find(
      (evaluation) => evaluation.step === "DIRECTOR_FOR_INSTRUCTION",
    ) ?? null;
  const vpaaEvaluation =
    evaluations.find(
      (evaluation) => evaluation.step === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS",
    ) ?? null;

  const hasRenderableCampusProposal =
    !!campusProposal && campusProposal.lifecycle_status !== "INVALIDATED";
  const showDiCard = hasRenderableCampusProposal;
  const showVpaaCard =
    hasRenderableCampusProposal &&
    (diEvaluation?.status === "APPROVED" || !!vpaaEvaluation);

  const canEvaluateAsDi =
    !!campusProposal &&
    campusProposal.lifecycle_status === "ACTIVE" &&
    !diEvaluation &&
    hasDiDesignation;

  const canEvaluateAsVpaa =
    !!campusProposal &&
    campusProposal.lifecycle_status === "ACTIVE" &&
    diEvaluation?.status === "APPROVED" &&
    !vpaaEvaluation &&
    hasVpaaDesignation;

  return {
    diEvaluation,
    vpaaEvaluation,
    hasRenderableCampusProposal,
    showDiCard,
    showVpaaCard,
    canEvaluateAsDi,
    canEvaluateAsVpaa,
  };
};
