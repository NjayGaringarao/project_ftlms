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

const mapFacultyClassBlock = (classBlockRow: {
  id: string;
  block: unknown;
}): FacultyClassBlock => {
  const block = first(classBlockRow.block) as {
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
    class_block_id: classBlockRow.id,
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
  schedule: unknown;
}): FacultyListItem => {
  const identity = first(row.identity) as { name?: string } | null;
  const latestDegreeTitle = getLatestDegreeTitle(row.degree);

  const atl = asArray(row.schedule).reduce(
    (scheduleSum: number, scheduleRow) =>
      scheduleSum +
      asArray((scheduleRow as { class?: unknown }).class).reduce(
        (classSum: number, classRow) => {
          const units = getCourseUnits(
            (classRow as { course?: unknown }).course,
          );
          return (
            classSum + calculateAtl(units.lectureUnit, units.laboratoryUnit)
          );
        },
        0,
      ),
    0,
  );

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
  };
};

export const mapCourseLoadingBlockListItem = (row: {
  id: string;
  code: string;
  year_level: number;
  student_count: number;
  major_offering: unknown;
  class_block: unknown;
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

  const totalUnit = asArray(row.class_block).reduce(
    (sum: number, classBlockRow) => {
      const cls = first((classBlockRow as { class?: unknown }).class) as {
        course?: unknown;
      } | null;
      const units = getCourseUnits(cls?.course);
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
  course: unknown;
  class_block: unknown;
}): FacultyClassRow => {
  const units = getCourseUnits(cls.course);
  const classBlocks = asArray(cls.class_block) as {
    id: string;
    block: unknown;
  }[];
  const blocks = classBlocks.map(mapFacultyClassBlock);

  const firstClassBlock = classBlocks[0];
  const firstBlock = first(firstClassBlock?.block) as {
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
    class: unknown;
  },
  blockId: string,
): BlockClassRow => {
  const cls = first(row.class) as {
    id?: string;
    code?: string;
    course?: unknown;
    schedule?: unknown;
    class_block?: unknown;
  } | null;

  const units = getCourseUnits(cls?.course);
  const schedule = first(cls?.schedule) as { user?: unknown } | null;
  const user = first(schedule?.user) as {
    id?: string;
    identity?: unknown;
  } | null;
  const identity = first(user?.identity) as { name?: string } | null;

  const mergedWith: BlockClassMergedWith[] = asArray(cls?.class_block)
    .filter((classBlockRow) => {
      const block = first((classBlockRow as { block?: unknown }).block) as {
        id?: string;
      } | null;
      return block?.id !== blockId;
    })
    .map((classBlockRow) => {
      const block = first((classBlockRow as { block?: unknown }).block) as {
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
    faculty_id: user?.id ?? "",
    faculty_name: identity?.name?.trim() || "Unnamed Faculty",
    laboratory_hours: calculateLaboratoryContactHours(units.laboratoryUnit),
    lecture_hours: units.lectureUnit,
    unit: calculateUnit(units.lectureUnit, units.laboratoryUnit),
    merged_with: mergedWith,
  };
};
