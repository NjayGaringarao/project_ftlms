"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/utils/supabase/server";
import { mergeClasses } from "@/features/course-loading/lib/actions";

export type SchedulerMergeCandidate = {
  class_id: string;
  section_codes: string[];
  student_count: number;
};

type RawClassMergeRow = {
  id: string;
  user_class?: Array<{ user_id?: string | null }> | null;
  course_utilization?: Array<{
    course_id?: string | null;
    section?: {
      id?: string | null;
      code?: string | null;
      student_count?: number | null;
      major_offering?: {
        program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
      } | Array<{
        program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
      }> | null;
    } | Array<{
      id?: string | null;
      code?: string | null;
      student_count?: number | null;
      major_offering?: {
        program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
      } | Array<{
        program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
      }> | null;
    }>;
  }> | null;
};

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const normalizeClass = (row: RawClassMergeRow) => {
  const userClass = (row.user_class ?? [])[0];
  const utilizations = row.course_utilization ?? [];
  const courseIds = Array.from(
    new Set(utilizations.map((util) => util.course_id).filter(Boolean)),
  );
  const firstUtil = utilizations[0];
  const section = first(firstUtil?.section);
  const majorOffering = first(section?.major_offering);
  const programOffering = first(majorOffering?.program_offering);

  const sections = utilizations
    .map((util) => first(util.section))
    .filter((item): item is { id?: string | null; code?: string | null; student_count?: number | null } =>
      Boolean(item?.id),
    );

  return {
    id: row.id,
    user_id: userClass?.user_id ?? null,
    course_id: courseIds[0] ?? null,
    has_multiple_courses: courseIds.length > 1,
    campus_id: programOffering?.campus_id ?? null,
    sections,
  };
};

export const getMergeCandidatesForClass = async (
  academicTermId: string,
  classId: string,
): Promise<SchedulerMergeCandidate[]> => {
  if (!academicTermId?.trim() || !classId?.trim()) return [];

  const supabase = await createClient();
  const { data: targetRow, error: targetError } = await supabase
    .from("class")
    .select(
      `
      id,
      user_class(user_id),
      course_utilization(
        course_id,
        section:section_id(
          id,
          code,
          student_count,
          academic_term_id,
          major_offering:major_offering_id(
            program_offering:program_offering_id(campus_id)
          )
        )
      )
      `,
    )
    .eq("id", classId)
    .maybeSingle();

  if (targetError || !targetRow) {
    console.error("lib.schedule.merge.getMergeCandidatesForClass.target ::", targetError);
    return [];
  }

  const target = normalizeClass(targetRow as RawClassMergeRow);
  if (!target.user_id || !target.course_id || !target.campus_id || target.has_multiple_courses) {
    return [];
  }

  const { data: classes, error } = await supabase
    .from("class")
    .select(
      `
      id,
      user_class(user_id),
      course_utilization(
        course_id,
        section:section_id(
          id,
          code,
          student_count,
          academic_term_id,
          major_offering:major_offering_id(
            program_offering:program_offering_id(campus_id)
          )
        )
      )
      `,
    )
    .eq("course_utilization.section.academic_term_id", academicTermId);

  if (error) {
    console.error("lib.schedule.merge.getMergeCandidatesForClass.list ::", error);
    return [];
  }

  return (classes as RawClassMergeRow[])
    .map(normalizeClass)
    .filter((row) => row.id !== classId)
    .filter(
      (row) =>
        row.user_id === target.user_id &&
        row.course_id === target.course_id &&
        row.campus_id === target.campus_id &&
        !row.has_multiple_courses,
    )
    .map((row) => ({
      class_id: row.id,
      section_codes: row.sections.map((section) => section.code ?? "Unknown"),
      student_count: row.sections.reduce(
        (sum, section) => sum + (section.student_count ?? 0),
        0,
      ),
    }));
};

export const mergeSectionsForScheduler = async (
  targetClassId: string,
  sourceClassIds: string[],
  academicTermId: string,
): Promise<{ data?: boolean; error?: string }> => {
  const result = await mergeClasses(targetClassId, sourceClassIds, academicTermId);
  if (result.error) return result;
  revalidatePath("/scheduler");
  return { data: true };
};

export type CourseUtilizationMergeCandidate = {
  utilization_id: string;
  section_id: string;
  section_code: string;
  student_count: number;
  class_id: string;
  faculty_id: string | null;
  faculty_name: string | null;
};

export type CourseUtilizationUnmergeCandidate = {
  utilization_id: string;
  section_id: string;
  section_code: string;
  student_count: number;
  class_id: string;
};

type RawUtilizationMergeRow = {
  id: string;
  course_id?: string | null;
  class_id?: string | null;
  section?: {
    id?: string | null;
    code?: string | null;
    student_count?: number | null;
    academic_term_id?: string | null;
    major_offering?: {
      program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
    } | Array<{
      program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
    }> | null;
  } | Array<{
    id?: string | null;
    code?: string | null;
    student_count?: number | null;
    academic_term_id?: string | null;
    major_offering?: {
      program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
    } | Array<{
      program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
    }> | null;
  }> | null;
  class?: {
    id?: string | null;
    user_class?: Array<{
      user?: { id?: string; identity?: { name?: string | null } | Array<{ name?: string | null }> | null };
    }> | null;
  } | Array<{
    id?: string | null;
    user_class?: Array<{
      user?: { id?: string; identity?: { name?: string | null } | Array<{ name?: string | null }> | null };
    }> | null;
  }> | null;
};

const normalizeCampusId = (row: RawUtilizationMergeRow): string | null => {
  const section = first(row.section);
  const majorOffering = first(section?.major_offering);
  const programOffering = first(majorOffering?.program_offering);
  return programOffering?.campus_id ?? null;
};

export const getMergeCandidatesForCourseUtilization = async (
  academicTermId: string,
  courseUtilizationId: string,
): Promise<CourseUtilizationMergeCandidate[]> => {
  if (!academicTermId?.trim() || !courseUtilizationId?.trim()) return [];

  const supabase = await createClient();
  const { data: currentRow, error: currentError } = await supabase
    .from("course_utilization")
    .select(
      `
      id,
      course_id,
      class_id,
      section:section_id(
        id,
        code,
        student_count,
        academic_term_id,
        major_offering:major_offering_id(
          program_offering:program_offering_id(campus_id)
        )
      )
      `,
    )
    .eq("id", courseUtilizationId)
    .maybeSingle();

  if (currentError || !currentRow) {
    console.error(
      "lib.schedule.merge.getMergeCandidatesForCourseUtilization.current ::",
      currentError,
    );
    return [];
  }

  const current = currentRow as RawUtilizationMergeRow;
  const courseId = current.course_id ?? null;
  const currentClassId = current.class_id ?? null;
  const campusId = normalizeCampusId(current);

  if (!courseId || !campusId) return [];

  const { data, error } = await supabase
    .from("course_utilization")
    .select(
      `
      id,
      course_id,
      class_id,
      section:section_id(
        id,
        code,
        student_count,
        academic_term_id,
        major_offering:major_offering_id(
          program_offering:program_offering_id(campus_id)
        )
      ),
      class:class_id(
        id,
        user_class(
          user:user_id(id, identity:identity(name))
        )
      )
      `,
    )
    .eq("course_id", courseId)
    .eq("section.academic_term_id", academicTermId);

  if (error) {
    console.error(
      "lib.schedule.merge.getMergeCandidatesForCourseUtilization.list ::",
      error,
    );
    return [];
  }

  return (data as RawUtilizationMergeRow[])
    .filter((row) => row.id !== courseUtilizationId)
    .filter((row) => !currentClassId || row.class_id !== currentClassId)
    .filter((row) => normalizeCampusId(row) === campusId)
    .filter((row) => Boolean(row.class_id))
    .map((row) => {
      const section = first(row.section);
      const cls = first(row.class);
      const userClass = (cls?.user_class ?? [])[0];
      const faculty = first(userClass?.user);

      return {
        utilization_id: row.id,
        section_id: section?.id ?? "",
        section_code: section?.code ?? "Unknown",
        student_count: Number(section?.student_count ?? 0),
        class_id: row.class_id ?? "",
        faculty_id: faculty?.id ?? null,
        faculty_name: first(faculty?.identity)?.name ?? null,
      };
    });
};

const cleanupEmptyClasses = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  classIds: string[],
): Promise<{ error?: string }> => {
  if (classIds.length === 0) return {};

  const { data: remaining, error: remainingErr } = await supabase
    .from("course_utilization")
    .select("class_id")
    .in("class_id", classIds);

  if (remainingErr) {
    console.error("lib.schedule.merge.cleanup.remaining ::", remainingErr);
    return { error: remainingErr.message };
  }

  const remainingIds = new Set(
    (remaining ?? []).map((row) => row.class_id as string),
  );
  const emptyClassIds = classIds.filter((id) => !remainingIds.has(id));
  if (emptyClassIds.length === 0) return {};

  const { data: sessionRows, error: sessionErr } = await supabase
    .from("session_class")
    .select("session_id")
    .in("class_id", emptyClassIds);

  if (sessionErr) {
    console.error("lib.schedule.merge.cleanup.sessions ::", sessionErr);
    return { error: sessionErr.message };
  }

  const sessionIds = Array.from(
    new Set((sessionRows ?? []).map((row) => row.session_id as string)),
  );

  if (sessionIds.length > 0) {
    const { error: sessionClassErr } = await supabase
      .from("session_class")
      .delete()
      .in("class_id", emptyClassIds);

    if (sessionClassErr) {
      console.error("lib.schedule.merge.cleanup.sessionClass ::", sessionClassErr);
      return { error: sessionClassErr.message };
    }

    const { error: sessionDeleteErr } = await supabase
      .from("session")
      .delete()
      .in("id", sessionIds);

    if (sessionDeleteErr) {
      console.error("lib.schedule.merge.cleanup.sessionDelete ::", sessionDeleteErr);
      return { error: sessionDeleteErr.message };
    }
  }

  const { error: userClassErr } = await supabase
    .from("user_class")
    .delete()
    .in("class_id", emptyClassIds);

  if (userClassErr) {
    console.error("lib.schedule.merge.cleanup.userClass ::", userClassErr);
    return { error: userClassErr.message };
  }

  const { error: classErr } = await supabase
    .from("class")
    .delete()
    .in("id", emptyClassIds);

  if (classErr) {
    console.error("lib.schedule.merge.cleanup.class ::", classErr);
    return { error: classErr.message };
  }

  return {};
};

const unlinkFacultyIfNoSessions = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  classIds: string[],
): Promise<{ error?: string }> => {
  if (classIds.length === 0) return {};

  const { data, error } = await supabase
    .from("session_class")
    .select("class_id")
    .in("class_id", classIds);

  if (error) {
    console.error("lib.schedule.merge.unlinkFacultyIfNoSessions ::", error);
    return { error: error.message };
  }

  const classIdsWithSessions = new Set(
    (data ?? []).map((row) => row.class_id as string),
  );
  const classIdsWithoutSessions = classIds.filter(
    (id) => !classIdsWithSessions.has(id),
  );

  if (classIdsWithoutSessions.length === 0) return {};

  const { error: deleteErr } = await supabase
    .from("user_class")
    .delete()
    .in("class_id", classIdsWithoutSessions);

  if (deleteErr) {
    console.error(
      "lib.schedule.merge.unlinkFacultyIfNoSessions.delete ::",
      deleteErr,
    );
    return { error: deleteErr.message };
  }

  return {};
};

export const mergeCourseUtilizations = async (
  input: {
    targetClassId: string;
    sourceUtilizationIds: string[];
    academicTermId: string;
  },
): Promise<{ data?: boolean; error?: string }> => {
  if (!input.targetClassId?.trim()) return { error: "Target class is required" };
  if (!input.sourceUtilizationIds || input.sourceUtilizationIds.length === 0) {
    return { error: "At least one source utilization is required" };
  }
  const supabase = await createClient();

  const { data: sourceRows, error: sourceErr } = await supabase
    .from("course_utilization")
    .select("id, class_id")
    .in("id", input.sourceUtilizationIds);

  if (sourceErr) {
    console.error("lib.schedule.merge.mergeCourseUtilizations.source ::", sourceErr);
    return { error: sourceErr.message };
  }

  const sourceClassIds = Array.from(
    new Set(
      (sourceRows ?? [])
        .map((row) => row.class_id as string | null)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const { error: moveErr } = await supabase
    .from("course_utilization")
    .update({ class_id: input.targetClassId })
    .in("id", input.sourceUtilizationIds);

  if (moveErr) {
    console.error("lib.schedule.merge.mergeCourseUtilizations.move ::", moveErr);
    return { error: moveErr.message };
  }

  const cleanup = await cleanupEmptyClasses(supabase, sourceClassIds);
  if (cleanup.error) return { error: cleanup.error };

  const unlinkResult = await unlinkFacultyIfNoSessions(supabase, [
    input.targetClassId,
    ...sourceClassIds,
  ]);
  if (unlinkResult.error) return { error: unlinkResult.error };

  revalidatePath("/scheduler");
  return { data: true };
};

export const unmergeCourseUtilization = async (
  input: { courseUtilizationId: string; academicTermId: string },
): Promise<{ data?: boolean; error?: string }> => {
  if (!input.courseUtilizationId?.trim()) {
    return { error: "Course utilization is required" };
  }
  const supabase = await createClient();

  const { data: utilRow, error: utilErr } = await supabase
    .from("course_utilization")
    .select(
      `
      id,
      class_id
      `,
    )
    .eq("id", input.courseUtilizationId)
    .maybeSingle();

  if (utilErr || !utilRow) {
    console.error("lib.schedule.merge.unmergeCourseUtilization.util ::", utilErr);
    return { error: utilErr?.message ?? "Utilization not found" };
  }

  const currentClassId = (utilRow as { class_id?: string | null }).class_id ?? null;
  if (!currentClassId) return { error: "Current class is missing" };

  const { data: newClass, error: newClassErr } = await supabase
    .from("class")
    .insert({ code: `TMP-${randomUUID()}` })
    .select("id")
    .single();

  if (newClassErr || !newClass) {
    console.error("lib.schedule.merge.unmergeCourseUtilization.createClass ::", newClassErr);
    return { error: newClassErr?.message ?? "Failed to create class" };
  }

  const { error: moveErr } = await supabase
    .from("course_utilization")
    .update({ class_id: newClass.id })
    .eq("id", input.courseUtilizationId);

  if (moveErr) {
    console.error("lib.schedule.merge.unmergeCourseUtilization.move ::", moveErr);
    return { error: moveErr.message };
  }

  const cleanup = await cleanupEmptyClasses(supabase, [currentClassId]);
  if (cleanup.error) return { error: cleanup.error };

  const unlinkResult = await unlinkFacultyIfNoSessions(supabase, [
    currentClassId,
    newClass.id,
  ]);
  if (unlinkResult.error) return { error: unlinkResult.error };

  revalidatePath("/scheduler");
  return { data: true };
};

export const getUnmergeCandidatesForCourseUtilization = async (
  academicTermId: string,
  courseUtilizationId: string,
): Promise<CourseUtilizationUnmergeCandidate[]> => {
  if (!academicTermId?.trim() || !courseUtilizationId?.trim()) return [];

  const supabase = await createClient();
  const { data: currentRow, error: currentErr } = await supabase
    .from("course_utilization")
    .select(
      `
      id,
      course_id,
      class_id,
      section:section_id(
        id,
        code,
        student_count,
        academic_term_id
      )
      `,
    )
    .eq("id", courseUtilizationId)
    .maybeSingle();

  if (currentErr || !currentRow) {
    console.error(
      "lib.schedule.merge.getUnmergeCandidatesForCourseUtilization.current ::",
      currentErr,
    );
    return [];
  }

  const current = currentRow as RawUtilizationMergeRow;
  const classId = current.class_id ?? null;
  const courseId = current.course_id ?? null;

  if (!classId || !courseId) return [];

  const { data, error } = await supabase
    .from("course_utilization")
    .select(
      `
      id,
      class_id,
      course_id,
      section:section_id(
        id,
        code,
        student_count,
        academic_term_id
      )
      `,
    )
    .eq("class_id", classId)
    .eq("course_id", courseId)
    .eq("section.academic_term_id", academicTermId);

  if (error) {
    console.error(
      "lib.schedule.merge.getUnmergeCandidatesForCourseUtilization.list ::",
      error,
    );
    return [];
  }

  return (data as RawUtilizationMergeRow[])
    .filter((row) => row.id !== courseUtilizationId)
    .map((row) => {
      const section = first(row.section);
      return {
        utilization_id: row.id,
        section_id: section?.id ?? "",
        section_code: section?.code ?? "Unknown",
        student_count: Number(section?.student_count ?? 0),
        class_id: row.class_id ?? "",
      };
    });
};

export const detachOtherCourseUtilizations = async (
  input: {
    courseUtilizationId: string;
    otherUtilizationIds: string[];
    academicTermId: string;
    mode: "per_section" | "single_class";
  },
): Promise<{ data?: boolean; error?: string }> => {
  if (!input.courseUtilizationId?.trim()) {
    return { error: "Course utilization is required" };
  }
  if (!input.otherUtilizationIds || input.otherUtilizationIds.length === 0) {
    return { error: "Select at least one section to detach" };
  }

  const supabase = await createClient();
  const { data: currentRow, error: currentErr } = await supabase
    .from("course_utilization")
    .select("id, class_id, course_id")
    .eq("id", input.courseUtilizationId)
    .maybeSingle();

  if (currentErr || !currentRow) {
    console.error("lib.schedule.merge.detachOther.current ::", currentErr);
    return { error: currentErr?.message ?? "Utilization not found" };
  }

  const currentClassId = (currentRow as { class_id?: string | null }).class_id ?? null;
  const courseId = (currentRow as { course_id?: string | null }).course_id ?? null;
  if (!currentClassId || !courseId) {
    return { error: "Current class is missing" };
  }

  const { data: otherRows, error: otherErr } = await supabase
    .from("course_utilization")
    .select("id, class_id, course_id")
    .in("id", input.otherUtilizationIds);

  if (otherErr) {
    console.error("lib.schedule.merge.detachOther.list ::", otherErr);
    return { error: otherErr.message };
  }

  const invalidRow = (otherRows ?? []).find(
    (row) =>
      row.class_id !== currentClassId || row.course_id !== courseId,
  );

  if (invalidRow) {
    return { error: "Selected sections must belong to the same class and course" };
  }

  const newClassIds: string[] = [];

  if (input.mode === "single_class") {
    const { data: newClass, error: newClassErr } = await supabase
      .from("class")
      .insert({ code: `TMP-${randomUUID()}` })
      .select("id")
      .single();

    if (newClassErr || !newClass) {
      console.error("lib.schedule.merge.detachOther.createClass ::", newClassErr);
      return { error: newClassErr?.message ?? "Failed to create class" };
    }

    newClassIds.push(newClass.id);

    const { error: moveErr } = await supabase
      .from("course_utilization")
      .update({ class_id: newClass.id })
      .in("id", input.otherUtilizationIds);

    if (moveErr) {
      console.error("lib.schedule.merge.detachOther.move ::", moveErr);
      return { error: moveErr.message };
    }
  } else {
    for (const utilizationId of input.otherUtilizationIds) {
      const { data: newClass, error: newClassErr } = await supabase
        .from("class")
        .insert({ code: `TMP-${randomUUID()}` })
        .select("id")
        .single();

      if (newClassErr || !newClass) {
        console.error(
          "lib.schedule.merge.detachOther.createClassPerSection ::",
          newClassErr,
        );
        return { error: newClassErr?.message ?? "Failed to create class" };
      }

      newClassIds.push(newClass.id);

      const { error: moveErr } = await supabase
        .from("course_utilization")
        .update({ class_id: newClass.id })
        .eq("id", utilizationId);

      if (moveErr) {
        console.error("lib.schedule.merge.detachOther.movePerSection ::", moveErr);
        return { error: moveErr.message };
      }
    }
  }

  const cleanup = await cleanupEmptyClasses(supabase, [currentClassId]);
  if (cleanup.error) return { error: cleanup.error };

  const unlinkResult = await unlinkFacultyIfNoSessions(supabase, [
    currentClassId,
    ...newClassIds,
  ]);
  if (unlinkResult.error) return { error: unlinkResult.error };

  revalidatePath("/scheduler");
  return { data: true };
};
