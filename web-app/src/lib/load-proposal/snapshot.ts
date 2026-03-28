import type { UserDataReadModel } from "@/lib/user-data/types";
import type { Degree } from "@/models";
import { calculateLaboratoryContactHours } from "@/lib/course-loading/calculations";

export type FacultyLoadSnapshot = {
  employment_status: string | null;
  academic_rank: string | null;
  bachelors_degree: string | null;
  masters_degree: string | null;
  doctorate_degree: string | null;
  designations: string | null;
  equivalent_teaching_load: number;
  total_lecture_hours: number;
  total_lab_hours: number;
  preparation_count: number;
  actual_teaching_load: number;
  advisory_class: string | null;
};

const pickDegreeTitle = (
  degrees: Degree[],
  level: string,
): string | null => {
  const matches = degrees.filter((degree) => degree.academic_level === level);
  if (matches.length === 0) return null;

  const sorted = [...matches].sort((a, b) => {
    const yearDiff = (b.year_graduated ?? 0) - (a.year_graduated ?? 0);
    if (yearDiff !== 0) return yearDiff;
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });

  return sorted[0]?.title ?? null;
};

export const buildFacultyLoadSnapshot = (
  userData: UserDataReadModel,
): FacultyLoadSnapshot => {
  const lectureSum = userData.classes.reduce(
    (sum, cls) => sum + Number(cls.lecture_unit ?? 0),
    0,
  );
  const labSum = userData.classes.reduce(
    (sum, cls) =>
      sum + calculateLaboratoryContactHours(Number(cls.laboratory_unit ?? 0)),
    0,
  );

  const preparationCount = new Set(
    userData.classes.map((cls) => cls.course_code).filter(Boolean),
  ).size;

  const designations = userData.designations
    .map((designation) => designation.job_title)
    .filter(Boolean)
    .join(", ");

  return {
    employment_status: userData.employmentStatus,
    academic_rank: userData.rank?.title ?? null,
    bachelors_degree: pickDegreeTitle(userData.degrees, "Bachelor's Degree"),
    masters_degree: pickDegreeTitle(userData.degrees, "Master's Degree"),
    doctorate_degree: pickDegreeTitle(userData.degrees, "Doctorate Degree"),
    designations: designations.length > 0 ? designations : null,
    equivalent_teaching_load: userData.designationLoad,
    total_lecture_hours: lectureSum,
    total_lab_hours: labSum,
    preparation_count: preparationCount,
    actual_teaching_load: userData.actualTeachingLoad,
    advisory_class: null,
  };
};
