"use server";

import { getUserDataList } from "@/features/profile/lib/user-data/queries";
import { formatFullName, formatName } from "@/utils/format-name";
import type {
  CampusCollegeLoadSnapshot,
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotClassTotals,
  CampusCollegeLoadSnapshotFaculty,
  CampusCollegeLoadSnapshotSection,
  CampusCollegeLoadSnapshotSession,
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

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const getSessionMetrics = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  classIds: string[],
): Promise<Map<string, SessionMetric>> => {
  const metrics = new Map<string, SessionMetric>();
  if (classIds.length === 0) return metrics;

  const { data: sessionRows } = await supabase
    .from("session_class")
    .select(
      `
      class_id,
      session:session_id (type, start_time, end_time)
      `,
    )
    .in("class_id", classIds);

  (sessionRows ?? []).forEach((row) => {
    const session = Array.isArray(row.session) ? row.session[0] : row.session;
    const classId = row.class_id as string | null;
    if (!classId || !session) return;

    const current = metrics.get(classId) ?? {
      lecture_hours: 0,
      laboratory_hours: 0,
    };
    const duration = getDurationHours(session.start_time, session.end_time);
    if (session.type === "Laboratory") {
      current.laboratory_hours += duration;
    } else {
      current.lecture_hours += duration;
    }
    metrics.set(classId, current);
  });

  return metrics;
};

const getSessionDetails = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  classIds: string[],
): Promise<Map<string, CampusCollegeLoadSnapshotSession[]>> => {
  const sessionsByClass = new Map<string, CampusCollegeLoadSnapshotSession[]>();
  if (classIds.length === 0) return sessionsByClass;

  const { data: sessionRows } = await supabase
    .from("session_class")
    .select(
      `
      class_id,
      session:session_id (day, start_time, end_time, type, room:room_id (code, name))
      `,
    )
    .in("class_id", classIds);

  (sessionRows ?? []).forEach((row) => {
    const session = first(row.session);
    const classId = row.class_id as string | null;
    if (!classId || !session) return;

    const room = first(session.room);
    const list = sessionsByClass.get(classId) ?? [];
    list.push({
      day: session.day ?? "",
      start_time: session.start_time ?? "",
      end_time: session.end_time ?? "",
      type: session.type ?? "",
      room_code: room?.code ?? null,
      room_name: room?.name ?? null,
    });
    sessionsByClass.set(classId, list);
  });

  return sessionsByClass;
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
    { data: campus },
    { data: college },
    { data: academicTerm },
    rows,
    { data: campusDirectorDesignations },
    { data: higherUpsDesignations },
  ] = await Promise.all([
    supabase.from("campus").select("code, name").eq("id", campusId).maybeSingle(),
    supabase.from("college").select("code, name").eq("id", collegeId).maybeSingle(),
    supabase
      .from("academic_term")
      .select("code, name, academic_year:academic_year_id(code)")
      .eq("id", academicTermId)
      .maybeSingle(),
    getUserDataList({
      academicTermId,
      includeClasses: true,
      includeDegrees: true,
      includeDesignations: true,
      includeLoads: true,
    }),
    // Campus Director is campus-scoped — always stored with campus_id
    supabase
      .from("designation")
      .select("job_title, user_id")
      .eq("campus_id", campusId)
      .eq("job_title", "Campus Director"),
    // DI and VPAA are university-wide "higher ups" — stored without campus_id
    supabase
      .from("designation")
      .select("job_title, user_id")
      .in("job_title", ["Director for Instruction", "Vice President for Academic Affairs"]),
  ]);

  // Collect all signatory user_ids and fetch their identity in one query.
  const signatoryRows = [...(campusDirectorDesignations ?? []), ...(higherUpsDesignations ?? [])];
  const signatoryUserIds = [
    ...new Set(signatoryRows.map((r) => r.user_id).filter(Boolean) as string[]),
  ];

  const { data: signatoryIdentities } = signatoryUserIds.length > 0
    ? await supabase
        .from("identity")
        .select("user_id, first_name, middle_name, last_name, suffix, professional_extension")
        .in("user_id", signatoryUserIds)
    : { data: [] };

  const identityByUserId = new Map(
    (signatoryIdentities ?? []).map((row) => [row.user_id, row]),
  );

  const resolveSignatoryName = (jobTitle: string): string | null => {
    const designation = signatoryRows.find((r) => r.job_title === jobTitle);
    if (!designation?.user_id) return null;
    const identity = identityByUserId.get(designation.user_id);
    if (!identity) return null;
    // Prefer structured name fields; fall back to legacy `name` text field
    const formatted = formatName(identity, {
      firstWord: "FIRST",
      middleName: "INITIAL",
      isProfexIncluded: true,
    });
    return formatted;
  };

  const preparedBy = resolveSignatoryName("Campus Director");
  const recommendingApproval = resolveSignatoryName("Director for Instruction");
  const approvedBy = resolveSignatoryName("Vice President for Academic Affairs");

  // --- faculty_load: scoped by the faculty's own home campus/college; keeps
  // every class they teach this term, even classes owned by other colleges.
  const homeFacultyRows = rows.filter(
    (row) => row.campus_id === campusId && row.college_id === collegeId,
  );
  const homeFacultyClassIds = Array.from(
    new Set(homeFacultyRows.flatMap((row) => row.classes.map((cls) => cls.id))),
  );
  const [facultySessionMetrics, facultySessionDetails] = await Promise.all([
    getSessionMetrics(supabase, homeFacultyClassIds),
    getSessionDetails(supabase, homeFacultyClassIds),
  ]);

  const faculty = homeFacultyRows
    .map((row): CampusCollegeLoadSnapshotFaculty => {
      const facultyName = formatFullName(row.identity) || "Unnamed Faculty";
      const classes = row.classes.map((classRow) => {
        const scheduled = facultySessionMetrics.get(classRow.id);
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
          section_code: classRow.section_code,
          student_count: toNumber(classRow.student_count),
          lecture_unit: toNumber(classRow.lecture_unit),
          laboratory_unit: toNumber(classRow.laboratory_unit),
          lecture_hours: lectureHours,
          laboratory_hours: laboratoryHours,
          load: toNumber(classRow.load),
          sessions: facultySessionDetails.get(classRow.id) ?? [],
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

  const facultyTotals = faculty.reduce(
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

  // --- class_schedule: scoped by the class/section's owning campus/college,
  // regardless of which college the assigned instructor belongs to.
  const [{ data: scopedRows }, { data: allSectionRows }] = await Promise.all([
    supabase
      .from("course_utilization")
      .select(
        `
        class_id,
        course:course_id (code, title, lecture_unit, laboratory_unit),
        section:section_id (
          id,
          code,
          year_level,
          classification,
          academic_term_id,
          major_offering:major_offering_id (
            program_offering:program_offering_id (
              campus_id,
              program:program_id (college_id)
            )
          )
        ),
        class:class_id (
          code,
          user_class (
            user:user_id (
              id,
              campus:campus_id (code),
              college:college_id (code),
              identity:identity (name)
            )
          )
        )
        `,
      )
      .eq("section.academic_term_id", academicTermId),
    // Every section in scope, independent of whether it has any classes
    // assigned, so sections with zero subjects still appear in the snapshot.
    supabase
      .from("section")
      .select(
        `
        id,
        code,
        year_level,
        classification,
        major_offering:major_offering_id (
          program_offering:program_offering_id (
            campus_id,
            program:program_id (college_id)
          )
        )
        `,
      )
      .eq("academic_term_id", academicTermId),
  ]);

  const sections: CampusCollegeLoadSnapshotSection[] = (allSectionRows ?? [])
    .filter((row) => {
      const majorOffering = first(row.major_offering);
      const programOffering = first(majorOffering?.program_offering);
      const program = first(programOffering?.program);
      return (
        programOffering?.campus_id === campusId && program?.college_id === collegeId
      );
    })
    .map((row) => ({
      section_id: row.id,
      section_code: row.code,
      year_level: row.year_level ?? null,
      classification: row.classification ?? null,
    }))
    .sort((left, right) => left.section_code.localeCompare(right.section_code));

  const classScheduleRows = new Map<string, CampusCollegeLoadSnapshotClass>();
  (scopedRows ?? []).forEach((row) => {
    const classId = row.class_id as string | null;
    if (!classId || classScheduleRows.has(classId)) return;

    const section = first(row.section);
    const majorOffering = first(section?.major_offering);
    const programOffering = first(majorOffering?.program_offering);
    const program = first(programOffering?.program);
    if (
      programOffering?.campus_id !== campusId ||
      program?.college_id !== collegeId
    ) {
      return;
    }

    const course = first(row.course);
    const classInfo = first(row.class);
    const userClassRow = first(classInfo?.user_class);
    const instructor = first(userClassRow?.user);
    const instructorCampus = first(instructor?.campus);
    const instructorCollege = first(instructor?.college);
    const instructorIdentity = first(instructor?.identity);

    classScheduleRows.set(classId, {
      class_id: classId,
      class_code: classInfo?.code ?? "",
      course_code: course?.code ?? "Unknown",
      course_title: course?.title ?? "Untitled Course",
      section_id: section?.id ?? null,
      section_code: section?.code ?? null,
      year_level: section?.year_level ?? null,
      classification: section?.classification ?? null,
      lecture_unit: toNumber(course?.lecture_unit),
      laboratory_unit: toNumber(course?.laboratory_unit),
      lecture_hours: 0,
      laboratory_hours: 0,
      instructor_id: instructor?.id ?? null,
      instructor_name: instructorIdentity?.name?.trim() || null,
      instructor_college_code: instructorCollege?.code ?? null,
      instructor_campus_code: instructorCampus?.code ?? null,
      sessions: [],
    });
  });

  const classScheduleClassIds = Array.from(classScheduleRows.keys());
  const [classScheduleSessionMetrics, classScheduleSessionDetails] =
    await Promise.all([
      getSessionMetrics(supabase, classScheduleClassIds),
      getSessionDetails(supabase, classScheduleClassIds),
    ]);

  const classes = Array.from(classScheduleRows.values())
    .map((classRow) => {
      const scheduled = classScheduleSessionMetrics.get(classRow.class_id);
      const fallbackLectureHours = classRow.lecture_unit;
      const fallbackLaboratoryHours = calculateLaboratoryContactHours(
        classRow.laboratory_unit,
      );
      return {
        ...classRow,
        lecture_hours:
          scheduled && scheduled.lecture_hours > 0
            ? scheduled.lecture_hours
            : fallbackLectureHours,
        laboratory_hours:
          scheduled && scheduled.laboratory_hours > 0
            ? scheduled.laboratory_hours
            : fallbackLaboratoryHours,
        sessions: classScheduleSessionDetails.get(classRow.class_id) ?? [],
      };
    })
    .sort((left, right) => left.class_code.localeCompare(right.class_code));

  const classTotals: CampusCollegeLoadSnapshotClassTotals = classes.reduce(
    (sum, classRow) => ({
      class_count: sum.class_count + 1,
      assigned_count: sum.assigned_count + (classRow.instructor_id ? 1 : 0),
      unassigned_count: sum.unassigned_count + (classRow.instructor_id ? 0 : 1),
      lecture_hours: sum.lecture_hours + classRow.lecture_hours,
      laboratory_hours: sum.laboratory_hours + classRow.laboratory_hours,
    }),
    {
      class_count: 0,
      assigned_count: 0,
      unassigned_count: 0,
      lecture_hours: 0,
      laboratory_hours: 0,
    },
  );

  const academicYear = Array.isArray(academicTerm?.academic_year)
    ? academicTerm?.academic_year[0]
    : academicTerm?.academic_year;

  return {
    metadata: {
      campus_id: campusId,
      campus_code: campus?.code ?? null,
      campus_name: campus?.name ?? null,
      college_id: collegeId,
      college_code: college?.code ?? null,
      college_name: college?.name ?? null,
      academic_term_id: academicTermId,
      academic_term_code: academicTerm?.code ?? null,
      academic_term_name: academicTerm?.name ?? null,
      academic_year_code: academicYear?.code ?? null,
      generated_at: new Date().toISOString(),
      prepared_by: preparedBy,
      recommending_approval: recommendingApproval,
      approved_by: approvedBy,
    },
    faculty_load: {
      faculty,
      totals: {
        faculty_count: faculty.length,
        ...facultyTotals,
      },
    },
    class_schedule: {
      classes,
      sections,
      totals: classTotals,
    },
  };
};
