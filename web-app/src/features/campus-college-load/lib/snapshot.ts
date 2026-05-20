"use server";

import { getUserDataList } from "@/features/profile/lib/user-data/queries";
import type {
  CampusCollegeLoadSnapshot,
  CampusCollegeLoadSnapshotFaculty,
} from "@/features/shared/types/models";
import { createClient } from "@/utils/supabase/server";

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const buildCampusCollegeLoadSnapshot = async ({
  academicTermId,
  campusId,
  collegeId,
}: {
  academicTermId: string;
  campusId: string;
  collegeId: string;
}): Promise<CampusCollegeLoadSnapshot> => {
  const supabase = await createClient();
  const [{ data: scopedUtilizations }, { data: campus }, { data: college }] =
    await Promise.all([
      supabase
        .from("course_utilization")
        .select(
          `
          class_id,
          section:section_id(
            major_offering:major_offering_id(
              program_offering:program_offering_id(
                campus_id,
                campus:campus_id(code, name),
                program:program_id(
                  college_id,
                  college:college_id(code, name)
                )
              )
            )
          )
          `,
        )
        .eq("section.academic_term_id", academicTermId),
      supabase
        .from("campus")
        .select("code, name")
        .eq("id", campusId)
        .maybeSingle(),
      supabase
        .from("college")
        .select("code, name")
        .eq("id", collegeId)
        .maybeSingle(),
    ]);

  const scopedClassIds = new Set(
    (scopedUtilizations ?? [])
      .filter((row) => {
        const section = Array.isArray(row.section) ? row.section[0] : row.section;
        const majorOffering = Array.isArray(section?.major_offering)
          ? section?.major_offering[0]
          : section?.major_offering;
        const programOffering = Array.isArray(majorOffering?.program_offering)
          ? majorOffering?.program_offering[0]
          : majorOffering?.program_offering;
        const program = Array.isArray(programOffering?.program)
          ? programOffering?.program[0]
          : programOffering?.program;

        return (
          row.class_id &&
          programOffering?.campus_id === campusId &&
          program?.college_id === collegeId
        );
      })
      .map((row) => row.class_id as string),
  );

  const rows = await getUserDataList({
    academicTermId,
    includeClasses: true,
    includeDegrees: true,
    includeDesignations: true,
    includeLoads: true,
  });

  const faculty = rows
    .map((row) => ({
      ...row,
      classes: row.classes.filter((classRow) => scopedClassIds.has(classRow.id)),
    }))
    .filter((row) => row.classes.length > 0)
    .map((row): CampusCollegeLoadSnapshotFaculty => {
      const facultyName = row.identity?.name?.trim() || "Unnamed Faculty";

      return {
        faculty_id: row.id,
        faculty_name: facultyName,
        employment_status: row.employmentStatus,
        academic_rank: row.rank?.title ?? null,
        college_code: row.college?.code ?? null,
        campus_code: row.campus?.code ?? null,
        equivalent_teaching_load: toNumber(row.designationLoad),
        actual_teaching_load: toNumber(row.actualTeachingLoad),
        total_working_load: toNumber(row.totalWorkingLoad),
        classes: row.classes.map((classRow) => ({
          id: classRow.id,
          class_code: classRow.class_code,
          course_code: classRow.course_code,
          course_title: classRow.course_title,
          year_section: classRow.year_section,
          lecture_unit: toNumber(classRow.lecture_unit),
          laboratory_unit: toNumber(classRow.laboratory_unit),
          load: toNumber(classRow.load),
        })),
      };
    })
    .sort((left, right) => left.faculty_name.localeCompare(right.faculty_name));

  const firstFaculty = faculty[0] ?? null;
  const totals = faculty.reduce(
    (sum, row) => ({
      equivalent_teaching_load:
        sum.equivalent_teaching_load + row.equivalent_teaching_load,
      actual_teaching_load: sum.actual_teaching_load + row.actual_teaching_load,
      total_working_load: sum.total_working_load + row.total_working_load,
    }),
    {
      equivalent_teaching_load: 0,
      actual_teaching_load: 0,
      total_working_load: 0,
    },
  );

  return {
    campus_id: campusId,
    campus_code: campus?.code ?? firstFaculty?.campus_code ?? null,
    campus_name: campus?.name ?? null,
    college_id: collegeId,
    college_code: college?.code ?? firstFaculty?.college_code ?? null,
    college_name: college?.name ?? null,
    academic_term_id: academicTermId,
    generated_at: new Date().toISOString(),
    faculty,
    totals: {
      faculty_count: faculty.length,
      ...totals,
    },
  };
};
