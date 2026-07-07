"use server";

import { getClassRollupForSections } from "./chair-queries";
import { FacultyClassRow, sumFacultyLoads } from "./load-math";
import {
  getEmploymentMix,
  getFtlStatusItemsByScope,
  getSectionRollup,
} from "./shared-queries";
import { DashboardContext, DeanInsights, LabelValue } from "./types";

const mergeLabelValues = (groups: LabelValue[][]): LabelValue[] => {
  const merged = new Map<string, number>();
  groups.flat().forEach((entry) => {
    merged.set(entry.label, (merged.get(entry.label) ?? 0) + entry.value);
  });
  return Array.from(merged.entries()).map(([label, value]) => ({
    label,
    value,
  }));
};

export const getDeanInsights = async (
  context: DashboardContext,
): Promise<DeanInsights> => {
  const termId = context.term!.id;
  const collegeIds = context.scope.collegeIds;

  const [ftlGroups, sectionGroups, employmentGroups] = await Promise.all([
    Promise.all(
      collegeIds.map((collegeId) =>
        getFtlStatusItemsByScope(termId, { collegeId }),
      ),
    ),
    Promise.all(
      collegeIds.map((collegeId) => getSectionRollup(termId, { collegeId })),
    ),
    Promise.all(
      collegeIds.map((collegeId) => getEmploymentMix({ college_id: collegeId })),
    ),
  ]);

  const sections = sectionGroups.flat();
  const classes = await getClassRollupForSections(
    sections.map((section) => section.sectionId),
  );

  const campusCounts = new Map<string, number>();
  sections.forEach((section) => {
    campusCounts.set(
      section.campusLabel,
      (campusCounts.get(section.campusLabel) ?? 0) + 1,
    );
  });
  const sectionsPerCampus = Array.from(campusCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);

  const facultyRows: FacultyClassRow[] = classes
    .filter((row) => row.facultyId)
    .map((row) => ({
      facultyId: row.facultyId!,
      facultyName: row.facultyName ?? "Unnamed faculty",
      facultyShortName: row.facultyShortName ?? undefined,
      lectureUnit: row.lectureUnit,
      laboratoryUnit: row.laboratoryUnit,
    }));

  return {
    ftl: ftlGroups.flat(),
    sectionsPerCampus,
    totalSections: sections.length,
    totalStudents: sections.reduce(
      (sum, section) => sum + section.studentCount,
      0,
    ),
    employmentMix: mergeLabelValues(employmentGroups),
    topFacultyLoads: sumFacultyLoads(facultyRows).slice(0, 10),
  };
};
