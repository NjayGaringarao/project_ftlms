import type { CampusLoad, CampusLoadEvaluation } from "@/models";

type DeriveCampusLadderStateArgs = {
  campusLoad: CampusLoad | null;
  evaluations: CampusLoadEvaluation[];
  hasDiDesignation?: boolean;
  hasVpaaDesignation?: boolean;
};

export type CampusLoadLadderState = {
  diEvaluation: CampusLoadEvaluation | null;
  vpaaEvaluation: CampusLoadEvaluation | null;
  hasRenderableCampusLoad: boolean;
  showDiCard: boolean;
  showVpaaCard: boolean;
  canEvaluateAsDi: boolean;
  canEvaluateAsVpaa: boolean;
};

export const deriveCampusLoadLadderState = ({
  campusLoad,
  evaluations,
  hasDiDesignation = false,
  hasVpaaDesignation = false,
}: DeriveCampusLadderStateArgs): CampusLoadLadderState => {
  const diEvaluation =
    evaluations.find(
      (evaluation) => evaluation.step === "DIRECTOR_FOR_INSTRUCTION",
    ) ?? null;
  const vpaaEvaluation =
    evaluations.find(
      (evaluation) => evaluation.step === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS",
    ) ?? null;

  const hasRenderableCampusLoad =
    !!campusLoad && campusLoad.lifecycle_status !== "INVALIDATED";
  const showDiCard = hasRenderableCampusLoad;
  const showVpaaCard =
    hasRenderableCampusLoad &&
    (diEvaluation?.status === "APPROVED" || !!vpaaEvaluation);

  const canEvaluateAsDi =
    !!campusLoad &&
    campusLoad.lifecycle_status === "ACTIVE" &&
    !diEvaluation &&
    hasDiDesignation;

  const canEvaluateAsVpaa =
    !!campusLoad &&
    campusLoad.lifecycle_status === "ACTIVE" &&
    diEvaluation?.status === "APPROVED" &&
    !vpaaEvaluation &&
    hasVpaaDesignation;

  return {
    diEvaluation,
    vpaaEvaluation,
    hasRenderableCampusLoad,
    showDiCard,
    showVpaaCard,
    canEvaluateAsDi,
    canEvaluateAsVpaa,
  };
};
