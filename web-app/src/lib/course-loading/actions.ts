"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { ClassInsertInput, ClassUpdateInput } from "./types";

// ─── helpers ────────────────────────────────────────────

/**
 * Find-or-create a schedule for a given user + academic term.
 * The unique constraint (user_id, academic_term_id) prevents duplicates.
 */
const ensureSchedule = async (
  userId: string,
  academicTermId: string,
): Promise<{ id: string } | null> => {
  const supabase = await createClient();

  // Try to find existing
  const { data: existing } = await supabase
    .from("schedule")
    .select("id")
    .eq("user_id", userId)
    .eq("academic_term_id", academicTermId)
    .maybeSingle();

  if (existing) return existing;

  // Create new
  const { data: created, error } = await supabase
    .from("schedule")
    .insert({ user_id: userId, academic_term_id: academicTermId })
    .select("id")
    .single();

  if (error) {
    console.error("lib.course-loading.ensureSchedule ::", error);
    return null;
  }

  return created;
};

/**
 * Auto-generate a class code: "{courseCode}-{n}" where n is the next sequential
 * suffix for that course within the schedule.
 *
 * This must not rely on row count because merges/deletes can leave gaps
 * in the numbering sequence while existing codes still remain in use.
 */
const generateClassCode = async (
  scheduleId: string,
  courseId: string,
  courseCode: string,
): Promise<string> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("class")
    .select("code")
    .eq("schedule_id", scheduleId)
    .eq("course_id", courseId);

  if (error) {
    console.error("lib.course-loading.generateClassCode ::", error);
  }

  const escapedCourseCode = courseCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedCourseCode}-(\\d+)$`);

  const maxSuffix = (data ?? []).reduce((max, row) => {
    const match = pattern.exec(row.code ?? "");
    if (!match) return max;

    const suffix = Number(match[1]);
    if (!Number.isFinite(suffix)) return max;

    return Math.max(max, suffix);
  }, 0);

  const next = maxSuffix + 1;
  return `${courseCode}-${next}`;
};

const revalidateCourseLoading = (academicTermId: string) => {
  revalidatePath(`/course-loading/${academicTermId}`, "layout");
};

const findConflictingBlockAssignments = async (
  scheduleId: string,
  courseId: string,
  blockIds: string[],
  excludedClassId?: string,
): Promise<string[]> => {
  if (blockIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_block")
    .select("block_id, class_id, class:class_id (id, schedule_id, course_id)")
    .in("block_id", blockIds);

  if (error) {
    console.error(
      "lib.course-loading.findConflictingBlockAssignments ::",
      error,
    );
    // Let DB constraints/trigger be the final guard if this check cannot run.
    return [];
  }

  return [
    ...new Set(
      (data ?? [])
        .filter((row) => {
          const cls = Array.isArray(row.class) ? row.class[0] : row.class;
          const clsId = (cls as { id?: string })?.id ?? row.class_id;
          const clsScheduleId = (cls as { schedule_id?: string })?.schedule_id;
          const clsCourseId = (cls as { course_id?: string })?.course_id;

          return (
            clsScheduleId === scheduleId &&
            clsCourseId === courseId &&
            clsId !== excludedClassId
          );
        })
        .map((row) => row.block_id),
    ),
  ];
};

// ─── createClass ────────────────────────────────────────

export async function createClass(
  input: ClassInsertInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.faculty_id?.trim()) return { error: "Faculty is required" };
  if (!input.course_id?.trim()) return { error: "Course is required" };
  if (!input.academic_term_id?.trim())
    return { error: "Academic term is required" };
  if (!input.block_ids || input.block_ids.length === 0)
    return { error: "At least one block is required" };

  const supabase = await createClient();

  // 1. Ensure schedule exists
  const schedule = await ensureSchedule(
    input.faculty_id,
    input.academic_term_id,
  );
  if (!schedule) return { error: "Failed to create or find schedule" };

  // 2. Look up course code for auto-generated class code
  const { data: course } = await supabase
    .from("course")
    .select("code")
    .eq("id", input.course_id)
    .single();

  const classCode = await generateClassCode(
    schedule.id,
    input.course_id,
    course?.code ?? "CLS",
  );

  const conflictingBlocks = await findConflictingBlockAssignments(
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
      code: classCode,
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
  const nextBlockIds =
    input.block_ids ?? (existingClassBlocks ?? []).map((cb) => cb.block_id);

  const conflictingBlocks = await findConflictingBlockAssignments(
    currentClass.schedule_id,
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

  // Update course if changed
  if (input.course_id) {
    const { error } = await supabase
      .from("class")
      .update({ course_id: input.course_id })
      .eq("id", input.class_id);

    if (error) {
      console.error("lib.course-loading.updateClass.course ::", error);
      return { error: error.message };
    }
  }

  // Diff class_blocks if provided
  if (input.block_ids) {
    const existing = existingClassBlocks ?? [];

    const existingBlockIds = new Set((existing ?? []).map((cb) => cb.block_id));
    const desiredBlockIds = new Set(input.block_ids);

    // Remove blocks no longer in desired set
    const toRemove = (existing ?? []).filter(
      (cb) => !desiredBlockIds.has(cb.block_id),
    );
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

    // Add new blocks
    const toAdd = input.block_ids.filter((bid) => !existingBlockIds.has(bid));
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

  const { data: course } = await supabase
    .from("course")
    .select("code")
    .eq("id", cls.course_id)
    .single();

  for (const classBlock of classBlocks.slice(1)) {
    const classCode = await generateClassCode(
      cls.schedule_id,
      cls.course_id,
      course?.code ?? "CLS",
    );

    const { data: newClass, error: newClassErr } = await supabase
      .from("class")
      .insert({
        schedule_id: cls.schedule_id,
        course_id: cls.course_id,
        code: classCode,
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
