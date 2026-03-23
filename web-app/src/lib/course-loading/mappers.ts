import type {
  BlockClassMergedWith,
  BlockClassRow,
  CourseLoadingBlockListItem,
  FacultyClassBlock,
  FacultyClassRow,
  FacultyListItem,
} from "./types";
import type { Degree } from "@/models/degree";
import type { UserDataReadModel } from "@/lib/user-data/types";
import {
  calculateAtl,
  calculateLaboratoryContactHours,
  calculateUnit,
  toNumber,
} from "./calculations";
import { formatFacultyBlockLabels } from "./formatters";
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

const mapFacultyClassBlock = (utilRow: {
  id: string;
  block: unknown;
}): FacultyClassBlock => {
  const block = first(utilRow.block) as {
    id?: string;
    code?: string;
    year_level?: number;
    section?: string;
    student_count?: number;
    major_offering?: unknown;
  } | null;

  const majorOffering = first(block?.major_offering) as {
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
    block_id: block?.id ?? "",
    block_code: block?.code ?? "",
    program_code: program?.code ?? "",
    major_code: major?.code ?? "",
    year_level: toNumber(block?.year_level),
    section: block?.section ?? "",
    student_count: toNumber(block?.student_count),
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

export const mapCourseLoadingBlockListItem = (row: {
  id: string;
  code: string;
  year_level: number;
  student_count: number;
  major_offering: unknown;
  course_utilization: unknown;
}): CourseLoadingBlockListItem => {
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
    block?: unknown;
  }[];

  const firstUtil = utilizations[0];
  const units = getCourseUnits((firstUtil as { course?: unknown })?.course);
  const blocks = utilizations.map((util) =>
    mapFacultyClassBlock({ id: util.id, block: util.block }),
  );

  const firstBlock = first(firstUtil?.block) as {
    major_offering?: unknown;
  } | null;
  const majorOffering = first(firstBlock?.major_offering) as {
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

  const studentCount = blocks.reduce(
    (sum, block) => sum + block.student_count,
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
    blocks,
    merged_block_label: formatFacultyBlockLabels(blocks),
    student_count: studentCount,
    atl: calculateAtl(units.lectureUnit, units.laboratoryUnit),
  };
};

export const mapBlockClassRow = (
  row: {
    course: unknown;
    class: unknown;
  },
  blockId: string,
): BlockClassRow => {
  const cls = first(row.class) as {
    id?: string;
    code?: string;
    user_class?: unknown;
    course_utilization?: unknown;
  } | null;

  const units = getCourseUnits(row.course);

  const userClass = first(cls?.user_class) as { user?: unknown } | null;
  const user = first(userClass?.user) as {
    id?: string;
    identity?: unknown;
  } | null;
  const identity = first(user?.identity) as { name?: string } | null;

  const mergedWith: BlockClassMergedWith[] = asArray(cls?.course_utilization)
    .filter((utilRow) => {
      const block = first((utilRow as { block?: unknown }).block) as {
        id?: string;
      } | null;
      return block?.id && block.id !== blockId;
    })
    .map((utilRow) => {
      const block = first((utilRow as { block?: unknown }).block) as {
        id?: string;
        code?: string;
      } | null;

      return {
        block_id: block?.id ?? "",
        block_code: block?.code ?? "",
      };
    });

  return {
    id: cls?.id ?? "",
    class_code: cls?.code ?? "",
    course_id: units.courseId,
    course_code: units.courseCode,
    course_title: units.courseTitle,
    lecture_unit: units.lectureUnit,
    laboratory_unit: units.laboratoryUnit,
    faculty_id: user?.id ?? null,
    faculty_name: identity?.name?.trim() || null,
    laboratory_hours: calculateLaboratoryContactHours(units.laboratoryUnit),
    lecture_hours: units.lectureUnit,
    unit: calculateUnit(units.lectureUnit, units.laboratoryUnit),
    merged_with: mergedWith,
  };
};
