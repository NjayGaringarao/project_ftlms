import type { FacultyClassSection } from "./types";

export const formatFacultySectionLabel = (section: FacultyClassSection): string =>
  `${section.program_code} ${section.major_code} ${section.year_level}-${section.name}`;

export const formatFacultySectionLabels = (
  sections: FacultyClassSection[],
): string =>
  formatMergedSectionLabels(sections, formatFacultySectionLabel);

export const formatMergedSectionLabels = <T extends { classification?: string }>(
  sections: T[],
  getLabel: (section: T) => string,
): string => {
  if (sections.length === 0) return "Not assigned";

  const regularLabels = sections
    .filter((section) => section.classification !== "irregular")
    .map(getLabel);
  const irregularCount = sections.filter(
    (section) => section.classification === "irregular",
  ).length;

  if (irregularCount === 0) return regularLabels.join(", ");
  const irregularLabel = `${irregularCount} Irregular`;
  if (regularLabels.length === 0) return irregularLabel;
  return `${regularLabels.join(", ")}, and ${irregularLabel}`;
};
