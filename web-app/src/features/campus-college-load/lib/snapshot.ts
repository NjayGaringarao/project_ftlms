"use server";

import { getUserDataList } from "@/features/profile/lib/user-data/queries";
import type {
  CampusCollegeLoadSnapshot,
  CampusCollegeLoadSnapshotFaculty,
} from "@/features/shared/types/models";
import { calculateLaboratoryContactHours } from "@/features/course-loading/lib/calculations";
import { createClient } from "@/utils/supabase/server";

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const timeToMinutes = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

const getDurationHours = (start: unknown, end: unknown): number => {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes === null || endMinutes === null) return 0;
  const duration = endMinutes - startMinutes;
  return duration > 0 ? duration / 60 : 0;
};

const getDesignationSummary = (
  designations: Array<{ job_title?: string | null }> | undefined,
) => {
  const titles = Array.from(
    new Set(
      (designations ?? [])
        .map((designation) => designation.job_title?.trim())
        .filter((title): title is string => Boolean(title)),
    ),
  );

  return titles.length > 0 ? titles.join(" AND ") : "N/A";
};

type SessionMetric = {
  lecture_hours: number;
  laboratory_hours: number;
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
  const [
    { data: scopedUtilizations },
    { data: campus },
    { data: college },
    { data: academicTerm },
  ] = await Promise.all([
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
      supabase
        .from("academic_term")
        .select("code, name, academic_year:academic_year_id(code)")
        .eq("id", academicTermId)
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
  const scopedClassIdList = Array.from(scopedClassIds);

  const { data: sessionRows } =
    scopedClassIdList.length > 0
      ? await supabase
          .from("session_class")
          .select(
            `
            class_id,
            session:session_id(type, start_time, end_time)
            `,
          )
          .in("class_id", scopedClassIdList)
      : { data: [] };

  const sessionMetrics = new Map<string, SessionMetric>();
  (sessionRows ?? []).forEach((row) => {
    const session = Array.isArray(row.session) ? row.session[0] : row.session;
    const classId = row.class_id as string | null;
    if (!classId || !session) return;

    const current = sessionMetrics.get(classId) ?? {
      lecture_hours: 0,
      laboratory_hours: 0,
    };
    const duration = getDurationHours(session.start_time, session.end_time);
    if (session.type === "Laboratory") {
      current.laboratory_hours += duration;
    } else {
      current.lecture_hours += duration;
    }
    sessionMetrics.set(classId, current);
  });

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
      const classes = row.classes.map((classRow) => {
        const scheduled = sessionMetrics.get(classRow.id);
        const fallbackLectureHours = toNumber(classRow.lecture_unit);
        const fallbackLaboratoryHours = calculateLaboratoryContactHours(
          toNumber(classRow.laboratory_unit),
        );
        const lectureHours =
          scheduled && scheduled.lecture_hours > 0
            ? scheduled.lecture_hours
            : fallbackLectureHours;
        const laboratoryHours =
          scheduled && scheduled.laboratory_hours > 0
            ? scheduled.laboratory_hours
            : fallbackLaboratoryHours;

        return {
          id: classRow.id,
          class_code: classRow.class_code,
          course_code: classRow.course_code,
          course_title: classRow.course_title,
          year_section: classRow.year_section,
          lecture_unit: toNumber(classRow.lecture_unit),
          laboratory_unit: toNumber(classRow.laboratory_unit),
          lecture_hours: lectureHours,
          laboratory_hours: laboratoryHours,
          load: toNumber(classRow.load),
        };
      });
      const lectureHours = classes.reduce(
        (sum, classRow) => sum + toNumber(classRow.lecture_hours),
        0,
      );
      const laboratoryHours = classes.reduce(
        (sum, classRow) => sum + toNumber(classRow.laboratory_hours),
        0,
      );
      const preparationCount = new Set(classes.map((classRow) => classRow.id)).size;
      const equivalentTeachingLoad = toNumber(row.designationLoad);
      const actualTeachingLoad = classes.reduce(
        (sum, classRow) => sum + toNumber(classRow.load),
        0,
      );
      const equivalentUnits = 0;

      return {
        faculty_id: row.id,
        faculty_name: facultyName,
        employment_status: row.employmentStatus,
        academic_rank: row.rank?.title ?? null,
        college_code: row.college?.code ?? null,
        campus_code: row.campus?.code ?? null,
        designation_summary: getDesignationSummary(row.designations),
        lecture_hours: lectureHours,
        laboratory_hours: laboratoryHours,
        preparation_count: preparationCount,
        equivalent_units: equivalentUnits,
        equivalent_teaching_load: equivalentTeachingLoad,
        actual_teaching_load: actualTeachingLoad,
        total_working_load:
          equivalentTeachingLoad + actualTeachingLoad + equivalentUnits,
        classes,
      };
    })
    .sort((left, right) => left.faculty_name.localeCompare(right.faculty_name));

  const firstFaculty = faculty[0] ?? null;
  const totals = faculty.reduce(
    (sum, row) => ({
      equivalent_teaching_load:
        sum.equivalent_teaching_load + row.equivalent_teaching_load,
      lecture_hours: sum.lecture_hours + toNumber(row.lecture_hours),
      laboratory_hours: sum.laboratory_hours + toNumber(row.laboratory_hours),
      preparation_count: sum.preparation_count + toNumber(row.preparation_count),
      equivalent_units: sum.equivalent_units + toNumber(row.equivalent_units),
      actual_teaching_load: sum.actual_teaching_load + row.actual_teaching_load,
      total_working_load: sum.total_working_load + row.total_working_load,
    }),
    {
      equivalent_teaching_load: 0,
      lecture_hours: 0,
      laboratory_hours: 0,
      preparation_count: 0,
      equivalent_units: 0,
      actual_teaching_load: 0,
      total_working_load: 0,
    },
  );
  const academicYear = Array.isArray(academicTerm?.academic_year)
    ? academicTerm?.academic_year[0]
    : academicTerm?.academic_year;

  return {
    campus_id: campusId,
    campus_code: campus?.code ?? firstFaculty?.campus_code ?? null,
    campus_name: campus?.name ?? null,
    college_id: collegeId,
    college_code: college?.code ?? firstFaculty?.college_code ?? null,
    college_name: college?.name ?? null,
    academic_term_id: academicTermId,
    academic_term_code: academicTerm?.code ?? null,
    academic_term_name: academicTerm?.name ?? null,
    academic_year_code: academicYear?.code ?? null,
    generated_at: new Date().toISOString(),
    faculty,
    totals: {
      faculty_count: faculty.length,
      ...totals,
    },
  };
};
