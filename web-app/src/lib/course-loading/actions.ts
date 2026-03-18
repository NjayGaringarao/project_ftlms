"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { ClassInsertInput, ClassUpdateInput } from "./types";
import {
  diffBlockIds,
  ensureSchedule,
  findConflictingBlockAssignments,
  validateClassInsertInput,
} from "./action-helpers";

const revalidateCourseLoading = (academicTermId: string) => {
  revalidatePath(`/course-loading/${academicTermId}`, "layout");
};

// ─── createClass ────────────────────────────────────────

export async function createClass(
  input: ClassInsertInput,
): Promise<{ data?: { id: string }; error?: string }> {
  const validation = validateClassInsertInput(input);
  if (validation.error) return { error: validation.error };

  const supabase = await createClient();

  // 1. Ensure schedule exists
  const schedule = await ensureSchedule(
    supabase,
    input.faculty_id,
    input.academic_term_id,
  );
  if (!schedule) return { error: "Failed to create or find schedule" };

  const conflictingBlocks = await findConflictingBlockAssignments(
    supabase,
    schedule.id,
    input.course_id,
    input.block_ids,
  );
  if (conflictingBlocks.length > 0) {
    return {
      error:
        "One or more selected blocks already have this course for the same faculty and term",
    };
  }

  // 3. Insert class
  const { data: newClass, error: classError } = await supabase
    .from("class")
    .insert({
      schedule_id: schedule.id,
      course_id: input.course_id,
    })
    .select("id")
    .single();

  if (classError) {
    console.error("lib.course-loading.createClass ::", classError);
    return { error: classError.message };
  }

  // 4. Insert class_block entries
  const classBlockRows = input.block_ids.map((blockId) => ({
    class_id: newClass.id,
    block_id: blockId,
  }));

  const { error: cbError } = await supabase
    .from("class_block")
    .insert(classBlockRows);

  if (cbError) {
    console.error("lib.course-loading.createClass.classBlock ::", cbError);
    // Rollback: delete the class we just created
    await supabase.from("class").delete().eq("id", newClass.id);
    return { error: cbError.message };
  }

  revalidateCourseLoading(input.academic_term_id);
  return { data: { id: newClass.id } };
}

// ─── updateClass ────────────────────────────────────────

export async function updateClass(
  input: ClassUpdateInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.class_id?.trim()) return { error: "Class ID is required" };

  const supabase = await createClient();

  const { data: currentClass, error: currentClassErr } = await supabase
    .from("class")
    .select("id, schedule_id, course_id")
    .eq("id", input.class_id)
    .single();

  if (currentClassErr || !currentClass) {
    console.error(
      "lib.course-loading.updateClass.currentClass ::",
      currentClassErr,
    );
    return { error: currentClassErr?.message ?? "Class not found" };
  }

  const { data: existingClassBlocks, error: existingClassBlocksErr } =
    await supabase
      .from("class_block")
      .select("id, block_id")
      .eq("class_id", input.class_id);

  if (existingClassBlocksErr) {
    console.error(
      "lib.course-loading.updateClass.existingBlocks ::",
      existingClassBlocksErr,
    );
    return { error: existingClassBlocksErr.message };
  }

  const nextCourseId = input.course_id ?? currentClass.course_id;
  let nextScheduleId = currentClass.schedule_id;

  if (input.faculty_id?.trim()) {
    const nextSchedule = await ensureSchedule(
      supabase,
      input.faculty_id,
      input.academic_term_id,
    );
    if (!nextSchedule) {
      return {
        error: "Failed to create or find schedule for selected faculty",
      };
    }
    nextScheduleId = nextSchedule.id;
  }

  const nextBlockIds =
    input.block_ids ?? (existingClassBlocks ?? []).map((cb) => cb.block_id);

  const conflictingBlocks = await findConflictingBlockAssignments(
    supabase,
    nextScheduleId,
    nextCourseId,
    nextBlockIds,
    input.class_id,
  );

  if (conflictingBlocks.length > 0) {
    return {
      error:
        "One or more selected blocks already have this course for the same faculty and term",
    };
  }

  const scheduleChanged = nextScheduleId !== currentClass.schedule_id;
  const courseChanged = nextCourseId !== currentClass.course_id;

  if (scheduleChanged || courseChanged) {
    const { error } = await supabase
      .from("class")
      .update({
        schedule_id: nextScheduleId,
        course_id: nextCourseId,
      })
      .eq("id", input.class_id);

    if (error) {
      console.error("lib.course-loading.updateClass.class ::", error);
      return { error: error.message };
    }
  }

  // Diff class_blocks if provided
  if (input.block_ids) {
    const existing = existingClassBlocks ?? [];
    const { toRemove, toAdd } = diffBlockIds(existing, input.block_ids);

    if (toRemove.length > 0) {
      const { error: removeErr } = await supabase
        .from("class_block")
        .delete()
        .in(
          "id",
          toRemove.map((cb) => cb.id),
        );

      if (removeErr) {
        console.error("lib.course-loading.updateClass.removeCB ::", removeErr);
        return { error: removeErr.message };
      }
    }

    if (toAdd.length > 0) {
      const { error: addErr } = await supabase.from("class_block").insert(
        toAdd.map((blockId) => ({
          class_id: input.class_id,
          block_id: blockId,
        })),
      );

      if (addErr) {
        console.error("lib.course-loading.updateClass.addCB ::", addErr);
        return { error: addErr.message };
      }
    }
  }

  revalidateCourseLoading(input.academic_term_id);
  return { data: true };
}

// ─── deleteClass ────────────────────────────────────────

export async function deleteClass(
  classId: string,
  academicTermId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!classId?.trim()) return { error: "Class ID is required" };

  const supabase = await createClient();

  const { error } = await supabase.from("class").delete().eq("id", classId);

  if (error) {
    console.error("lib.course-loading.deleteClass ::", error);
    return { error: error.message };
  }

  revalidateCourseLoading(academicTermId);
  return { data: true };
}

// ─── mergeClasses ──────────────────────────────────────
// Merge whole classes that share the same faculty schedule, course, and campus.

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
      schedule_id,
      course_id,
      class_block (
        id,
        block:block_id (
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
    const classBlocks = Array.isArray(cls.class_block) ? cls.class_block : [];
    const firstBlock = classBlocks[0];
    const block = Array.isArray(firstBlock?.block)
      ? firstBlock.block[0]
      : firstBlock?.block;
    const majorOffering = (block as { major_offering?: unknown })
      ?.major_offering;
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
      schedule_id: cls.schedule_id,
      course_id: cls.course_id,
      campus_id:
        (programOfferingNorm as { campus_id?: string })?.campus_id ?? null,
    };
  });

  const target = normalized.find((cls) => cls.id === targetClassId);
  if (!target) return { error: "Target class could not be found" };

  const hasMismatch = normalized.some(
    (cls) =>
      cls.schedule_id !== target.schedule_id ||
      cls.course_id !== target.course_id ||
      cls.campus_id !== target.campus_id,
  );

  if (hasMismatch) {
    return {
      error:
        "Only classes with the same faculty, course, and campus can be merged",
    };
  }

  const { error: moveErr } = await supabase
    .from("class_block")
    .update({ class_id: targetClassId })
    .in("class_id", uniqueSourceIds);

  if (moveErr) {
    console.error("lib.course-loading.mergeClasses.move ::", moveErr);
    return { error: moveErr.message };
  }

  const { error: deleteErr } = await supabase
    .from("class")
    .delete()
    .in("id", uniqueSourceIds);

  if (deleteErr) {
    console.error("lib.course-loading.mergeClasses.delete ::", deleteErr);
    return { error: deleteErr.message };
  }

  revalidateCourseLoading(academicTermId);
  return { data: true };
}

// ─── unmergeClass ──────────────────────────────────────
// Split a merged class so each class_block belongs to its own class again.

export async function unmergeClass(
  classId: string,
  academicTermId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!classId?.trim()) return { error: "Class ID is required" };

  const supabase = await createClient();

  const { data: cls, error: classErr } = await supabase
    .from("class")
    .select("id, schedule_id, course_id")
    .eq("id", classId)
    .single();

  if (classErr || !cls) {
    console.error("lib.course-loading.unmergeClass.fetchClass ::", classErr);
    return { error: classErr?.message ?? "Class not found" };
  }

  const { data: classBlocks, error: cbErr } = await supabase
    .from("class_block")
    .select("id, block_id")
    .eq("class_id", classId)
    .order("id", { ascending: true });

  if (cbErr) {
    console.error("lib.course-loading.unmergeClass.fetchBlocks ::", cbErr);
    return { error: cbErr.message };
  }

  if (!classBlocks || classBlocks.length <= 1) {
    return { error: "This class is not merged" };
  }

  for (const classBlock of classBlocks.slice(1)) {
    const { data: newClass, error: newClassErr } = await supabase
      .from("class")
      .insert({
        schedule_id: cls.schedule_id,
        course_id: cls.course_id,
      })
      .select("id")
      .single();

    if (newClassErr || !newClass) {
      console.error(
        "lib.course-loading.unmergeClass.createClass ::",
        newClassErr,
      );
      return { error: newClassErr?.message ?? "Failed to create class" };
    }

    const { error: moveErr } = await supabase
      .from("class_block")
      .update({ class_id: newClass.id })
      .eq("id", classBlock.id);

    if (moveErr) {
      console.error("lib.course-loading.unmergeClass.moveBlock ::", moveErr);
      return { error: moveErr.message };
    }
  }

  revalidateCourseLoading(academicTermId);
  return { data: true };
}
