import type {
  BlockClassMergedWith,
  BlockClassRow,
  CourseLoadingBlockListItem,
  FacultyClassBlock,
  FacultyClassRow,
  FacultyListItem,
} from "./types";
import {
  calculateAtl,
  calculateLaboratoryContactHours,
  calculateUnit,
  toNumber,
} from "./calculations";
import { formatFacultyBlockLabels } from "./formatters";
import { asArray, first } from "./normalizers";

type DegreeRow = { title?: string | null; year_graduated?: number | null };

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

const getLatestDegreeTitle = (degreeValue: unknown): string | null => {
  const degrees = asArray(degreeValue) as DegreeRow[];
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

export const mapFacultyListItem = (row: {
  id: string;
  identity: unknown;
  degree: unknown;
  designation: unknown;
  campus?: unknown;
  college?: unknown;
  user_class: unknown;
}): FacultyListItem => {
  const identity = first(row.identity) as { name?: string } | null;
  const latestDegreeTitle = getLatestDegreeTitle(row.degree);
  const campus = first(row.campus) as { id?: string; name?: string | null } | null;
  const college = first(row.college) as {
    id?: string;
    name?: string | null;
  } | null;

  const classRows = asArray(row.user_class) as Array<{
    class?: unknown;
  }>;

  const seenClassIds = new Set<string>();
  const atl = classRows.reduce((sum: number, userClassRow) => {
    const cls = first((userClassRow as { class?: unknown }).class) as {
      id?: string;
      course_utilization?: unknown;
    } | null;

    if (!cls?.id || seenClassIds.has(cls.id)) return sum;
    seenClassIds.add(cls.id);

    const utilizations = asArray(cls.course_utilization) as Array<{
      course?: unknown;
    }>;
    const firstUtil = utilizations[0];
    const units = getCourseUnits((firstUtil as { course?: unknown })?.course);

    return sum + calculateAtl(units.lectureUnit, units.laboratoryUnit);
  }, 0);

  const etl = asArray(row.designation).reduce(
    (sum: number, designationRow) =>
      sum + toNumber((designationRow as { load?: number | null }).load),
    0,
  );

  return {
    id: row.id,
    name: identity?.name?.trim() || "Unnamed Faculty",
    latest_degree_title: latestDegreeTitle,
    total_working_load: atl + etl,
    campus_id: campus?.id ?? null,
    campus_name: campus?.name ?? null,
    college_id: college?.id ?? null,
    college_name: college?.name ?? null,
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
    code?: string;
    campus_id?: string;
    campus?: unknown;
  } | null;
  const campus = first(programOffering?.campus) as {
    code?: string;
    name?: string;
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
