import type {
  SectionClassMergedWith,
  SectionClassRow,
  CourseLoadingSectionListItem,
  FacultyClassSection,
  FacultyClassRow,
  FacultyListItem,
} from "./types";
import type { Degree } from "@/features/shared/types/models/degree";
import type { UserDataReadModel } from "@/features/profile/lib/user-data/types";
import {
  calculateAtl,
  calculateLaboratoryContactHours,
  calculateUnit,
  toNumber,
} from "./calculations";
import { formatFacultySectionLabels } from "./formatters";
import { asArray, first } from "./normalizers";

type CourseUnits = {
  id?: string;
  code?: string;
  title?: string;
  lecture_unit?: number;
  laboratory_unit?: number;
};

const getCourseUnits = (courseValue: unknown) => {
  const course = first(courseValue) as CourseUnits | null;
  const lectureUnit = toNumber(course?.lecture_unit);
  const laboratoryUnit = toNumber(course?.laboratory_unit);

  return {
    courseId: course?.id ?? "",
    courseCode: course?.code ?? "",
    courseTitle: course?.title ?? "",
    lectureUnit,
    laboratoryUnit,
  };
};

const getLatestDegreeTitle = (degrees: Degree[]): string | null => {
  if (degrees.length === 0) return null;

  const latest = [...degrees].sort(
    (a, b) => (b.year_graduated ?? 0) - (a.year_graduated ?? 0),
  )[0];

  return latest.title ?? null;
};

const mapFacultyClassSection = (utilRow: {
  id: string;
  section: unknown;
}): FacultyClassSection => {
  const section = first(utilRow.section) as {
    id?: string;
    code?: string;
    classification?: "regular" | "irregular";
    year_level?: number;
    name?: string;
    student_count?: number;
    major_offering?: unknown;
  } | null;

  const majorOffering = first(section?.major_offering) as {
    major?: unknown;
    program_offering?: unknown;
  } | null;

  const major = first(majorOffering?.major) as { code?: string } | null;
  const programOffering = first(majorOffering?.program_offering) as {
    program?: unknown;
  } | null;
  const program = first(programOffering?.program) as { code?: string } | null;

  return {
    course_utilization_id: utilRow.id,
    section_id: section?.id ?? "",
    section_code: section?.code ?? "",
    classification: section?.classification ?? "regular",
    program_code: program?.code ?? "",
    major_code: major?.code ?? "",
    year_level: toNumber(section?.year_level),
    name: section?.name ?? "",
    student_count: toNumber(section?.student_count),
  };
};

export const mapFacultyListItem = (row: UserDataReadModel): FacultyListItem => {
  const latestDegreeTitle = getLatestDegreeTitle(row.degrees ?? []);

  return {
    id: row.id,
    name: row.identity?.name?.trim() || "Unnamed Faculty",
    latest_degree_title: latestDegreeTitle,
    total_working_load: row.totalWorkingLoad,
    campus_id: row.campus?.id ?? null,
    campus_code: row.campus?.code ?? null,
    campus_name: row.campus?.name ?? null,
    college_id: row.college?.id ?? null,
    college_code: row.college?.code ?? null,
    college_name: row.college?.name ?? null,
  };
};

export const mapCourseLoadingSectionListItem = (row: {
  id: string;
  code: string;
  classification?: "regular" | "irregular";
  year_level: number;
  student_count: number;
  major_offering: unknown;
  course_utilization: unknown;
}): CourseLoadingSectionListItem => {
  const majorOffering = first(row.major_offering) as {
    program_offering?: unknown;
  } | null;
  const programOffering = first(majorOffering?.program_offering) as {
    id?: string;
    code?: string;
    campus_id?: string;
    campus?: unknown;
    program?: unknown;
  } | null;
  const campus = first(programOffering?.campus) as {
    code?: string;
    name?: string;
  } | null;
  const program = first(programOffering?.program) as {
    code?: string;
    name?: string;
    college_id?: string | null;
  } | null;

  const totalUnit = asArray(row.course_utilization).reduce(
    (sum: number, utilRow) => {
      const course = first((utilRow as { course?: unknown }).course);
      const units = getCourseUnits(course);
      return sum + calculateUnit(units.lectureUnit, units.laboratoryUnit);
    },
    0,
  );

  return {
    id: row.id,
    code: row.code,
    classification: row.classification ?? "regular",
    student_count: toNumber(row.student_count),
    program_offering_code: programOffering?.code ?? "",
    program_offering_id: programOffering?.id ?? "",
    program_code: program?.code ?? "",
    program_name: program?.name ?? "",
    college_id: program?.college_id ?? null,
    campus_id: programOffering?.campus_id ?? "",
    campus_code: campus?.code ?? "",
    campus_name: campus?.name ?? "",
    year_level: toNumber(row.year_level),
    total_unit: totalUnit,
  };
};

export const mapFacultyClassRow = (cls: {
  id: string;
  code: string;
  course_utilization: unknown;
}): FacultyClassRow => {
  const utilizations = asArray(cls.course_utilization) as {
    id: string;
    course?: unknown;
    section?: unknown;
  }[];

  const firstUtil = utilizations[0];
  const units = getCourseUnits((firstUtil as { course?: unknown })?.course);
  const sections = utilizations.map((util) =>
    mapFacultyClassSection({ id: util.id, section: util.section }),
  );

  const firstSection = first(firstUtil?.section) as {
    major_offering?: unknown;
  } | null;
  const majorOffering = first(firstSection?.major_offering) as {
    program_offering?: unknown;
  } | null;
  const programOffering = first(majorOffering?.program_offering) as {
    campus?: unknown;
  } | null;
  const campus = first(programOffering?.campus) as {
    id?: string;
    code?: string;
    name?: string;
  } | null;

  const studentCount = sections.reduce(
    (sum, section) => sum + section.student_count,
    0,
  );

  return {
    id: cls.id,
    class_code: cls.code,
    course_id: units.courseId,
    course_code: units.courseCode,
    course_title: units.courseTitle,
    lecture_unit: units.lectureUnit,
    laboratory_unit: units.laboratoryUnit,
    campus_id: campus?.id ?? "",
    campus_code: campus?.code ?? "",
    campus_name: campus?.name ?? "",
    sections,
    merged_section_label: formatFacultySectionLabels(sections),
    student_count: studentCount,
    atl: calculateAtl(units.lectureUnit, units.laboratoryUnit),
  };
};

export const mapSectionClassRow = (
  row: {
    course: unknown;
    class: unknown;
  },
  sectionId: string,
  courseUtilizationId: string,
): SectionClassRow => {
  const cls = first(row.class) as {
    id?: string;
    code?: string;
    user_class?: unknown;
    session_class?: unknown;
    course_utilization?: unknown;
  } | null;

  const units = getCourseUnits(row.course);

  const userClass = first(cls?.user_class) as { user?: unknown } | null;
  const user = first(userClass?.user) as {
    id?: string;
    identity?: unknown;
  } | null;
  const identity = first(user?.identity) as { name?: string } | null;

  const mergedWith: SectionClassMergedWith[] = asArray(cls?.course_utilization)
    .filter((utilRow) => {
      const section = first((utilRow as { section?: unknown }).section) as {
        id?: string;
        classification?: "regular" | "irregular";
      } | null;
      return section?.id && section.id !== sectionId;
    })
    .map((utilRow) => {
      const section = first((utilRow as { section?: unknown }).section) as {
        id?: string;
        code?: string;
        classification?: "regular" | "irregular";
      } | null;

      return {
        section_id: section?.id ?? "",
        section_code: section?.code ?? "",
        classification: section?.classification ?? "regular",
      };
    });

  const parseTimeToMinutes = (value: string | null | undefined) => {
    if (!value) return 0;
    const parts = value.split(":");
    if (parts.length < 2) return 0;
    const hours = Number(parts[0] ?? 0);
    const minutes = Number(parts[1] ?? 0);
    return hours * 60 + minutes;
  };

  const sessionRows = asArray(cls?.session_class) as Array<{
    session?: { type?: string; start_time?: string; end_time?: string } | null;
  }>;

  const { scheduledLectureHours, scheduledLabHours } = sessionRows.reduce(
    (acc, row) => {
      const session = row.session ?? null;
      if (!session?.type) return acc;
      const startMinutes = parseTimeToMinutes(session.start_time);
      const endMinutes = parseTimeToMinutes(session.end_time);
      const durationHours = Math.max(endMinutes - startMinutes, 0) / 60;
      if (session.type === "Lecture") {
        acc.scheduledLectureHours += durationHours;
      } else if (session.type === "Laboratory") {
        acc.scheduledLabHours += durationHours;
      }
      return acc;
    },
    { scheduledLectureHours: 0, scheduledLabHours: 0 },
  );

  const totalLectureHours = units.lectureUnit;
  const totalLabHours = calculateLaboratoryContactHours(units.laboratoryUnit);
  const unscheduledLectureHours = Math.max(
    totalLectureHours - scheduledLectureHours,
    0,
  );
  const unscheduledLabHours = Math.max(
    totalLabHours - scheduledLabHours,
    0,
  );

  return {
    course_utilization_id: courseUtilizationId,
    id: cls?.id ?? "",
    class_code: cls?.code ?? "",
    course_id: units.courseId,
    course_code: units.courseCode,
    course_title: units.courseTitle,
    lecture_unit: units.lectureUnit,
    laboratory_unit: units.laboratoryUnit,
    faculty_id: user?.id ?? null,
    faculty_name: identity?.name?.trim() || null,
    laboratory_hours: totalLabHours,
    lecture_hours: totalLectureHours,
    unit: calculateUnit(units.lectureUnit, units.laboratoryUnit),
    merged_with: mergedWith,
    has_sessions: Array.isArray(cls?.session_class)
      ? cls?.session_class.length > 0
      : Boolean(cls?.session_class),
    unscheduled_lecture_hours: unscheduledLectureHours,
    unscheduled_laboratory_hours: unscheduledLabHours,
  };
};
