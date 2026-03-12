"use server";

import { createClient } from "@/utils/supabase/server";
import type {
  FacultyListItem,
  CourseLoadingBlockListItem,
  FacultyClassRow,
  FacultyClassBlock,
  BlockClassRow,
  BlockClassMergedWith,
} from "./types";

// ─── helpers ────────────────────────────────────────────

const toNumber = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

// ─── Faculty sidebar list ───────────────────────────────

export const getFacultyListByTerm = async (
  termId: string,
): Promise<FacultyListItem[]> => {
  const supabase = await createClient();

  // List ALL users; nest schedule filtered by term so ATL is term-specific.
  // PostgREST returns users even when the nested schedule array is empty.
  const { data, error } = await supabase
    .from("user")
    .select(
      `
      id,
      identity:identity (name),
      degree:degree (title, academic_level, year_graduated),
      designation (load),
      schedule (
        id,
        class (
          id,
          course:course_id (lecture_unit, laboratory_unit)
        )
      )
    `,
    )
    .eq("schedule.academic_term_id", termId)
    .order("id", { ascending: true });

  if (error) {
    console.error("lib.course-loading.getFacultyListByTerm ::", error);
    return [];
  }

  if (!data) return [];

  return data.map((row) => {
    const identity = Array.isArray(row.identity)
      ? row.identity[0]
      : row.identity;

    // Pick the latest degree by year_graduated desc, fallback to first
    const degrees = Array.isArray(row.degree) ? row.degree : [];
    const latestDegree =
      degrees.length > 0
        ? degrees.sort(
            (
              a: { year_graduated: number | null },
              b: { year_graduated: number | null },
            ) => (b.year_graduated ?? 0) - (a.year_graduated ?? 0),
          )[0]
        : null;

    // Compute ATL from the term-specific schedule's classes (may be empty)
    const schedules = Array.isArray(row.schedule) ? row.schedule : [];
    const atl = schedules.reduce(
      (schedSum: number, sched: { class: unknown }) => {
        const classes = Array.isArray(sched.class) ? sched.class : [];
        return (
          schedSum +
          classes.reduce((clsSum: number, cls: { course: unknown }) => {
            const course = Array.isArray(cls.course)
              ? cls.course[0]
              : cls.course;
            const lecture = toNumber(
              (course as { lecture_unit?: number })?.lecture_unit,
            );
            const lab = toNumber(
              (course as { laboratory_unit?: number })?.laboratory_unit,
            );
            return clsSum + lecture + lab * 0.75;
          }, 0)
        );
      },
      0,
    );

    // ETL = sum of all designation loads (not term-scoped)
    const designations = Array.isArray(row.designation) ? row.designation : [];
    const etl = designations.reduce(
      (sum: number, d: { load: number | null }) => sum + toNumber(d.load),
      0,
    );

    return {
      id: row.id,
      name: identity?.name?.trim() || "Unnamed Faculty",
      latest_degree_title: latestDegree?.title ?? null,
      total_working_load: atl + etl,
    };
  });
};

// ── Also get all faculty (even those without a schedule) for the ClassMaker picker ──

export const getAllFacultyForPicker = async (): Promise<
  { id: string; name: string }[]
> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user")
    .select("id, identity:identity (name)")
    .order("id", { ascending: true });

  if (error) {
    console.error("lib.course-loading.getAllFacultyForPicker ::", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const identity = Array.isArray(row.identity)
      ? row.identity[0]
      : row.identity;
    return {
      id: row.id,
      name: identity?.name?.trim() || "Unnamed Faculty",
    };
  });
};

// ─── Block sidebar list ─────────────────────────────────

export const getBlockListByTerm = async (
  termId: string,
): Promise<CourseLoadingBlockListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("block")
    .select(
      `
      id,
      code,
      year_level,
      major_offering:major_offering_id (
        program_offering:program_offering_id (
          id,
          code,
          campus_id,
          campus:campus_id (id, code)
        )
      ),
      class_block (
        class:class_id (
          course:course_id (lecture_unit, laboratory_unit)
        )
      )
    `,
    )
    .eq("academic_term_id", termId)
    .order("code", { ascending: true });

  if (error) {
    console.error("lib.course-loading.getBlockListByTerm ::", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const majorOffering = Array.isArray(row.major_offering)
      ? row.major_offering[0]
      : row.major_offering;
    const programOffering = Array.isArray(majorOffering?.program_offering)
      ? majorOffering.program_offering[0]
      : majorOffering?.program_offering;
    const campus = Array.isArray(programOffering?.campus)
      ? programOffering.campus[0]
      : programOffering?.campus;

    // Aggregate total units from linked classes
    const classBlocks = Array.isArray(row.class_block) ? row.class_block : [];
    const totalUnit = classBlocks.reduce(
      (sum: number, cb: { class: unknown }) => {
        const cls = Array.isArray(cb.class) ? cb.class[0] : cb.class;
        const course = (cls as { course: unknown })?.course;
        const c = Array.isArray(course) ? course[0] : course;
        const lecture = toNumber(
          (c as { lecture_unit?: number })?.lecture_unit,
        );
        const lab = toNumber(
          (c as { laboratory_unit?: number })?.laboratory_unit,
        );
        return sum + lecture + lab;
      },
      0,
    );

    return {
      id: row.id,
      code: row.code,
      program_offering_code: programOffering?.code ?? "",
      campus_id: programOffering?.campus_id ?? "",
      campus_code: campus?.code ?? "",
      year_level: row.year_level,
      total_unit: totalUnit,
    };
  });
};

// ─── Faculty-aware class table ──────────────────────────

export const getClassesByFacultyAndTerm = async (
  userId: string,
  termId: string,
): Promise<FacultyClassRow[]> => {
  const supabase = await createClient();

  // Find the schedule for this user+term
  const { data: schedule, error: scheduleError } = await supabase
    .from("schedule")
    .select("id")
    .eq("user_id", userId)
    .eq("academic_term_id", termId)
    .maybeSingle();

  if (scheduleError) {
    console.error(
      "lib.course-loading.getClassesByFacultyAndTerm.schedule ::",
      scheduleError,
    );
    return [];
  }

  if (!schedule) return [];

  // Get all classes under this schedule
  const { data: classes, error: classError } = await supabase
    .from("class")
    .select(
      `
      id,
      code,
      course:course_id (id, code, title, lecture_unit, laboratory_unit),
      class_block (
        id,
        block:block_id (
          id,
          code,
          year_level,
          section,
          student_count,
          major_offering:major_offering_id (
            major:major_id (code),
            program_offering:program_offering_id (
              program:program_id (code),
              campus:campus_id (id, code, name)
            )
          )
        )
      )
    `,
    )
    .eq("schedule_id", schedule.id)
    .order("created_at", { ascending: true });

  if (classError) {
    console.error(
      "lib.course-loading.getClassesByFacultyAndTerm.classes ::",
      classError,
    );
    return [];
  }

  return (classes ?? []).map((cls) => {
    const course = Array.isArray(cls.course) ? cls.course[0] : cls.course;
    const courseId = (course as { id: string })?.id ?? "";
    const courseCode = (course as { code: string })?.code ?? "";
    const courseTitle = (course as { title: string })?.title ?? "";
    const lectureUnit = toNumber(
      (course as { lecture_unit?: number })?.lecture_unit,
    );
    const labUnit = toNumber(
      (course as { laboratory_unit?: number })?.laboratory_unit,
    );

    const classBlocks = Array.isArray(cls.class_block) ? cls.class_block : [];

    const blocks: FacultyClassBlock[] = classBlocks.map(
      (cb: { id: string; block: unknown }) => {
        const block = Array.isArray(cb.block) ? cb.block[0] : cb.block;
        const majorOffering = (block as { major_offering?: unknown })
          ?.major_offering;
        const majorOfferingNorm = Array.isArray(majorOffering)
          ? majorOffering[0]
          : majorOffering;
        const major = (majorOfferingNorm as { major?: unknown })?.major;
        const majorNorm = Array.isArray(major) ? major[0] : major;
        const programOffering = (
          majorOfferingNorm as { program_offering?: unknown }
        )?.program_offering;
        const programOfferingNorm = Array.isArray(programOffering)
          ? programOffering[0]
          : programOffering;
        const program = (programOfferingNorm as { program?: unknown })?.program;
        const programNorm = Array.isArray(program) ? program[0] : program;

        return {
          class_block_id: cb.id,
          block_id: (block as { id: string })?.id ?? "",
          block_code: (block as { code: string })?.code ?? "",
          program_code: (programNorm as { code?: string })?.code ?? "",
          major_code: (majorNorm as { code?: string })?.code ?? "",
          year_level: toNumber((block as { year_level?: number })?.year_level),
          section: (block as { section: string })?.section ?? "",
          student_count: toNumber(
            (block as { student_count?: number })?.student_count,
          ),
        };
      },
    );

    const studentCount = blocks.reduce((sum, b) => sum + b.student_count, 0);

    // Derive campus from the first block's program offering
    const firstBlock = classBlocks[0];
    const block0 = Array.isArray(firstBlock?.block)
      ? firstBlock.block[0]
      : firstBlock?.block;
    const mo = (block0 as { major_offering: unknown })?.major_offering;
    const moNorm = Array.isArray(mo) ? mo[0] : mo;
    const po = (moNorm as { program_offering: unknown })?.program_offering;
    const poNorm = Array.isArray(po) ? po[0] : po;
    const campus = (poNorm as { campus: unknown })?.campus;
    const campusNorm = Array.isArray(campus) ? campus[0] : campus;

    const mergedLabel =
      blocks.length > 0
        ? blocks
            .map(
              (b) =>
                `${b.program_code} ${b.major_code} ${b.year_level}-${b.section}`,
            )
            .join(", ")
        : "Not assigned";

    return {
      id: cls.id,
      class_code: cls.code,
      course_id: courseId,
      course_code: courseCode,
      course_title: courseTitle,
      lecture_unit: lectureUnit,
      laboratory_unit: labUnit,
      campus_id: (campusNorm as { id?: string })?.id ?? "",
      campus_code: (campusNorm as { code?: string })?.code ?? "",
      campus_name: (campusNorm as { name?: string })?.name ?? "",
      blocks,
      merged_block_label: mergedLabel,
      student_count: studentCount,
      atl: lectureUnit + labUnit * 0.75,
    };
  });
};

// ─── Block-aware class table ────────────────────────────

export const getClassesByBlockAndTerm = async (
  blockId: string,
  _termId: string,
): Promise<BlockClassRow[]> => {
  const supabase = await createClient();

  // Get class_blocks for this block
  const { data, error } = await supabase
    .from("class_block")
    .select(
      `
      id,
      class:class_id (
        id,
        code,
        course:course_id (id, code, title, lecture_unit, laboratory_unit),
        schedule:schedule_id (
          user:user_id (
            id,
            identity:identity (name)
          )
        ),
        class_block (
          id,
          block:block_id (id, code)
        )
      )
    `,
    )
    .eq("block_id", blockId);

  if (error) {
    console.error("lib.course-loading.getClassesByBlockAndTerm ::", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const cls = Array.isArray(row.class) ? row.class[0] : row.class;
    const course = (cls as { course: unknown })?.course;
    const courseNorm = Array.isArray(course) ? course[0] : course;
    const schedule = (cls as { schedule: unknown })?.schedule;
    const scheduleNorm = Array.isArray(schedule) ? schedule[0] : schedule;
    const user = (scheduleNorm as { user: unknown })?.user;
    const userNorm = Array.isArray(user) ? user[0] : user;
    const identity = (userNorm as { identity: unknown })?.identity;
    const identityNorm = Array.isArray(identity) ? identity[0] : identity;

    const lectureUnit = toNumber(
      (courseNorm as { lecture_unit?: number })?.lecture_unit,
    );
    const labUnit = toNumber(
      (courseNorm as { laboratory_unit?: number })?.laboratory_unit,
    );

    // Find sibling class_blocks (other blocks sharing the same class, excluding current block)
    const allClassBlocks = Array.isArray(
      (cls as { class_block: unknown })?.class_block,
    )
      ? ((cls as { class_block: unknown[] }).class_block as {
          id: string;
          block: unknown;
        }[])
      : [];

    const mergedWith: BlockClassMergedWith[] = allClassBlocks
      .filter((cb) => {
        const b = Array.isArray(cb.block) ? cb.block[0] : cb.block;
        return (b as { id: string })?.id !== blockId;
      })
      .map((cb) => {
        const b = Array.isArray(cb.block) ? cb.block[0] : cb.block;
        return {
          block_id: (b as { id: string })?.id ?? "",
          block_code: (b as { code: string })?.code ?? "",
        };
      });

    return {
      id: (cls as { id: string })?.id ?? "",
      class_code: (cls as { code: string })?.code ?? "",
      course_id: (courseNorm as { id: string })?.id ?? "",
      course_code: (courseNorm as { code: string })?.code ?? "",
      course_title: (courseNorm as { title: string })?.title ?? "",
      lecture_unit: lectureUnit,
      laboratory_unit: labUnit,
      faculty_id: (userNorm as { id: string })?.id ?? "",
      faculty_name:
        (identityNorm as { name?: string })?.name?.trim() || "Unnamed Faculty",
      laboratory_hours: labUnit * 3,
      lecture_hours: lectureUnit,
      unit: lectureUnit + labUnit,
      merged_with: mergedWith,
    };
  });
};
