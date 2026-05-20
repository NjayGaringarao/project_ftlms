"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { ClassInsertInput, ClassUpdateInput } from "./types";
import {
  ensureCourseUtilizations,
  findConflictingSectionAssignments,
  validateClassInsertInput,
} from "./action-helpers";

const revalidateCourseLoading = (academicTermId: string) => {
  void academicTermId;
  revalidatePath("/scheduler");
  revalidatePath("/sections");
  revalidatePath("/campus-college-load");
};

export async function createClass(
  input: ClassInsertInput,
): Promise<{ data?: { id: string }; error?: string }> {
  const validation = validateClassInsertInput(input);
  if (validation.error) return { error: validation.error };

  const supabase = await createClient();

  const conflictingSections = await findConflictingSectionAssignments(
    supabase,
    input.course_id,
    input.section_ids,
  );
  if (conflictingSections.length > 0) {
    return {
      error:
        "One or more selected sections already have this course assigned to a different class",
    };
  }

  const utilizations = await ensureCourseUtilizations(
    supabase,
    input.course_id,
    input.section_ids,
  );
  if (utilizations.length === 0) {
    return { error: "Failed to create course utilization rows" };
  }

  const { data: newClass, error: classError } = await supabase
    .from("class")
    .insert({ code: `TMP-${randomUUID()}` })
    .select("id")
    .single();

  if (classError) {
    console.error("lib.course-loading.createClass ::", classError);
    return { error: classError.message };
  }

  const { error: userClassError } = await supabase
    .from("user_class")
    .insert({
      user_id: input.faculty_id,
      class_id: newClass.id,
    });

  if (userClassError) {
    console.error("lib.course-loading.createClass.userClass ::", userClassError);
    await supabase.from("class").delete().eq("id", newClass.id);
    return { error: userClassError.message };
  }

  const { error: linkError } = await supabase
    .from("course_utilization")
    .update({ class_id: newClass.id })
    .in(
      "id",
      utilizations.map((row) => row.id),
    );

  if (linkError) {
    console.error("lib.course-loading.createClass.link ::", linkError);
    await supabase.from("class").delete().eq("id", newClass.id);
    return { error: linkError.message };
  }

  revalidateCourseLoading(input.academic_term_id);
  return { data: { id: newClass.id } };
}

export async function createSectionCourses(
  input: Omit<ClassInsertInput, "faculty_id">,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.course_id?.trim()) return { error: "Course is required" };
  if (!input.academic_term_id?.trim()) {
    return { error: "Academic term is required" };
  }
  if (!input.section_ids || input.section_ids.length === 0) {
    return { error: "At least one section is required" };
  }

  const supabase = await createClient();

  const conflictingSections = await findConflictingSectionAssignments(
    supabase,
    input.course_id,
    input.section_ids,
  );
  if (conflictingSections.length > 0) {
    return {
      error:
        "One or more selected sections already have this course assigned to a class",
    };
  }

  const utilizations = await ensureCourseUtilizations(
    supabase,
    input.course_id,
    input.section_ids,
  );

  if (utilizations.length === 0) {
    return { error: "Failed to create course utilization rows" };
  }

  revalidateCourseLoading(input.academic_term_id);
  return { data: true };
}

export async function updateClass(
  input: ClassUpdateInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.class_id?.trim()) return { error: "Class ID is required" };

  const supabase = await createClient();

  const { data: existingUtilizations, error: utilError } = await supabase
    .from("course_utilization")
    .select("id, section_id, course_id")
    .eq("class_id", input.class_id);

  if (utilError) {
    console.error("lib.course-loading.updateClass.utilizations ::", utilError);
    return { error: utilError.message };
  }

  const currentCourseIds = Array.from(
    new Set((existingUtilizations ?? []).map((row) => row.course_id)),
  );

  const nextCourseId = input.course_id ?? currentCourseIds[0];
  if (!nextCourseId) {
    return { error: "Course is required" };
  }

  const existingSections = (existingUtilizations ?? []).filter(
    (row) => row.course_id === nextCourseId,
  );

  const desiredSectionIds =
    input.section_ids ?? existingSections.map((row) => row.section_id);

  if (desiredSectionIds.length === 0) {
    return { error: "At least one section is required" };
  }

  const conflicts = await findConflictingSectionAssignments(
    supabase,
    nextCourseId,
    desiredSectionIds,
    input.class_id,
  );
  if (conflicts.length > 0) {
    return {
      error:
        "One or more selected sections already have this course assigned to a different class",
    };
  }

  await ensureCourseUtilizations(supabase, nextCourseId, desiredSectionIds);

  const { error: clearCourseError } = await supabase
    .from("course_utilization")
    .update({ class_id: null })
    .eq("class_id", input.class_id)
    .neq("course_id", nextCourseId);

  if (clearCourseError) {
    console.error("lib.course-loading.updateClass.clearCourse ::", clearCourseError);
    return { error: clearCourseError.message };
  }

  const { error: clearSectionError } = await supabase
    .from("course_utilization")
    .update({ class_id: null })
    .eq("class_id", input.class_id)
    .not("section_id", "in", `(${desiredSectionIds.map((id) => `"${id}"`).join(",")})`);

  if (clearSectionError) {
    console.error("lib.course-loading.updateClass.clearSections ::", clearSectionError);
    return { error: clearSectionError.message };
  }

  const { error: assignError } = await supabase
    .from("course_utilization")
    .update({ class_id: input.class_id })
    .eq("course_id", nextCourseId)
    .in("section_id", desiredSectionIds);

  if (assignError) {
    console.error("lib.course-loading.updateClass.assign ::", assignError);
    return { error: assignError.message };
  }

  if (input.faculty_id?.trim()) {
    await supabase
      .from("user_class")
      .delete()
      .eq("class_id", input.class_id);

    const { error: userClassError } = await supabase
      .from("user_class")
      .insert({
        user_id: input.faculty_id,
        class_id: input.class_id,
      });

    if (userClassError) {
      console.error("lib.course-loading.updateClass.userClass ::", userClassError);
      return { error: userClassError.message };
    }
  }

  revalidateCourseLoading(input.academic_term_id);
  return { data: true };
}

export async function mergeClasses(
  targetClassId: string,
  sourceClassIds: string[],
  academicTermId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!targetClassId?.trim()) return { error: "Target class is required" };
  if (!sourceClassIds || sourceClassIds.length === 0)
    return { error: "At least one class must be selected" };

  const uniqueSourceIds = [...new Set(sourceClassIds)].filter(
    (id) => id !== targetClassId,
  );
  if (uniqueSourceIds.length === 0)
    return { error: "Select at least one different class to merge" };

  const supabase = await createClient();
  const classIds = [targetClassId, ...uniqueSourceIds];

  const { data: classes, error } = await supabase
    .from("class")
    .select(
      `
      id,
      user_class ( user_id ),
      course_utilization (
        course_id,
        section:section_id (
          major_offering:major_offering_id (
            program_offering:program_offering_id (
              campus_id
            )
          )
        )
      )
    `,
    )
    .in("id", classIds);

  if (error) {
    console.error("lib.course-loading.mergeClasses.fetch ::", error);
    return { error: error.message };
  }

  if (!classes || classes.length !== classIds.length) {
    return { error: "One or more classes could not be found" };
  }

  const normalized = classes.map((cls) => {
    const userClass = Array.isArray(cls.user_class)
      ? cls.user_class[0]
      : cls.user_class;
    const utilizations = Array.isArray(cls.course_utilization)
      ? cls.course_utilization
      : [];
    const courseIds = Array.from(
      new Set(utilizations.map((row: { course_id?: string }) => row.course_id).filter(Boolean)),
    );
    const firstUtil = utilizations[0];
    const section = Array.isArray(firstUtil?.section)
      ? firstUtil?.section[0]
      : firstUtil?.section;
    const majorOffering = (section as { major_offering?: unknown })?.major_offering;
    const majorOfferingNorm = Array.isArray(majorOffering)
      ? majorOffering[0]
      : majorOffering;
    const programOffering = (
      majorOfferingNorm as { program_offering?: unknown }
    )?.program_offering;
    const programOfferingNorm = Array.isArray(programOffering)
      ? programOffering[0]
      : programOffering;

    return {
      id: cls.id,
      user_id: (userClass as { user_id?: string })?.user_id ?? null,
      course_id: courseIds[0] ?? null,
      has_multiple_courses: courseIds.length > 1,
      campus_id:
        (programOfferingNorm as { campus_id?: string })?.campus_id ?? null,
    };
  });

  const target = normalized.find((cls) => cls.id === targetClassId);
  if (!target) return { error: "Target class could not be found" };
  if (target.has_multiple_courses) {
    return { error: "Target class has multiple courses assigned" };
  }

  const hasMismatch = normalized.some(
    (cls) =>
      cls.user_id !== target.user_id ||
      cls.course_id !== target.course_id ||
      cls.campus_id !== target.campus_id ||
      cls.has_multiple_courses,
  );

  if (hasMismatch) {
    return {
      error:
        "Only classes with the same faculty, course, and campus can be merged",
    };
  }

  const { error: moveErr } = await supabase
    .from("course_utilization")
    .update({ class_id: targetClassId })
    .in("class_id", uniqueSourceIds);

  if (moveErr) {
    console.error("lib.course-loading.mergeClasses.move ::", moveErr);
    return { error: moveErr.message };
  }

  const { data: remaining, error: remainingErr } = await supabase
    .from("course_utilization")
    .select("class_id")
    .in("class_id", uniqueSourceIds);

  if (remainingErr) {
    console.error(
      "lib.course-loading.mergeClasses.remaining ::",
      remainingErr,
    );
    return { error: remainingErr.message };
  }

  const remainingIds = new Set(
    (remaining ?? []).map((row) => row.class_id as string),
  );
  const emptyClassIds = uniqueSourceIds.filter(
    (id) => !remainingIds.has(id),
  );

  if (emptyClassIds.length > 0) {
    const { data: sessionRows, error: sessionErr } = await supabase
      .from("session_class")
      .select("session_id")
      .in("class_id", emptyClassIds);

    if (sessionErr) {
      console.error(
        "lib.course-loading.mergeClasses.sessions ::",
        sessionErr,
      );
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
        console.error(
          "lib.course-loading.mergeClasses.sessionClassDelete ::",
          sessionClassErr,
        );
        return { error: sessionClassErr.message };
      }

      const { error: sessionDeleteErr } = await supabase
        .from("session")
        .delete()
        .in("id", sessionIds);

      if (sessionDeleteErr) {
        console.error(
          "lib.course-loading.mergeClasses.sessionDelete ::",
          sessionDeleteErr,
        );
        return { error: sessionDeleteErr.message };
      }
    }

    const { error: userClassErr } = await supabase
      .from("user_class")
      .delete()
      .in("class_id", emptyClassIds);

    if (userClassErr) {
      console.error(
        "lib.course-loading.mergeClasses.userClassDelete ::",
        userClassErr,
      );
      return { error: userClassErr.message };
    }

    const { error: classDeleteErr } = await supabase
      .from("class")
      .delete()
      .in("id", emptyClassIds);

    if (classDeleteErr) {
      console.error(
        "lib.course-loading.mergeClasses.classDelete ::",
        classDeleteErr,
      );
      return { error: classDeleteErr.message };
    }
  }

  revalidateCourseLoading(academicTermId);
  return { data: true };
}
