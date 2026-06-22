import type { CampusCollegeLoadSnapshotClass } from "@/features/shared/types/models";

export const OVERLOAD_UNIT_THRESHOLD = 21;

export type SectionUnitsSummary = {
  totalUnits: number;
  isOverloaded: boolean;
};

export const computeSectionUnits = (
  classes: CampusCollegeLoadSnapshotClass[],
): SectionUnitsSummary => {
  const totalUnits = classes.reduce(
    (sum, classRow) => sum + (classRow.lecture_unit || 0) + (classRow.laboratory_unit || 0),
    0,
  );
  return { totalUnits, isOverloaded: totalUnits > OVERLOAD_UNIT_THRESHOLD };
};
