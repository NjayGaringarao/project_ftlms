export type CampusLoadStatusControl = {
  academicTermId: string;
  campusId: string;
  hasCampusDirectorDesignation: boolean;
  approvedIndividuals: number;
  activeIndividuals: number;
};

export type CampusLoadEvaluationControl = {
  hasDiDesignation: boolean;
  hasVpaaDesignation: boolean;
};
