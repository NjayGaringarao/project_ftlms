"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import type { SessionDay } from "@/features/shared/types/models";
import { createClient } from "@/utils/supabase/server";
import { getSessionConflictWindows } from "./conflicts";
import {
  first,
  mapMutationError,
  normalizeDay,
  overlaps,
  toMinutes,
} from "./utils";
import {
  getClassContext,
  getSessionContext,
  getSessionWindowsByPredicate,
  unlinkFacultyIfNoSessions,
} from "./shared";
import type {
  CreateClassSessionInput,
  CreateSessionFromOfferingInput,
  RawBlockRow,
} from "./types";

export const createClassSession = async (
  input: CreateClassSessionInput,
): Promise<{ data?: { id: string }; error?: string }> => {
  if (!input.classId?.trim()) return { error: "Class is required" };
  if (!input.startTime?.trim() || !input.endTime?.trim()) {
    return { error: "Session time range is required" };
  }
  if (toMinutes(input.endTime) <= toMinutes(input.startTime)) {
    return { error: "End time must be after start time" };
  }

  const context = await getClassContext(input.classId);
  if (!context) {
    return { error: "Class context not found" };
  }

  const windows = await getSessionConflictWindows(
    input.classId,
    input.day,
    input.roomId,
    input.facultyId ?? null,
  );
  const conflict = windows.find((window) =>
    overlaps(input.startTime, input.endTime, window.start_time, window.end_time),
  );

  if (conflict) {
    return { error: `${conflict.reason} at ${conflict.start_time} - ${conflict.end_time}` };
  }

  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("session")
    .insert({
      room_id: input.roomId,
      day: input.day,
      start_time: input.startTime,
      end_time: input.endTime,
      type: input.type,
      code: "",
    })
    .select("id")
    .single();

  if (error || !session) {
    return { error: mapMutationError(error ?? {}) };
  }

  const { error: linkError } = await supabase
    .from("session_class")
    .insert({
      class_id: input.classId,
      session_id: session.id,
    });

  if (linkError) {
    return { error: mapMutationError(linkError) };
  }

  revalidatePath("/scheduler");
  return { data: { id: session.id } };
};

export const createSessionFromOffering = async (
  input: CreateSessionFromOfferingInput,
): Promise<{ data?: { id: string }; error?: string }> => {
  if (!input.academicTermId?.trim()) return { error: "Academic term is required" };
  if (!input.blockId?.trim()) return { error: "Block is required" };
  if (!input.courseUtilizationId?.trim()) return { error: "Course offering is required" };
  if (!input.facultyId?.trim()) return { error: "Faculty is required" };

  const supabase = await createClient();
  const { data: utilization, error } = await supabase
    .from("course_utilization")
    .select("id, class_id, block_id, block:block_id(academic_term_id)")
    .eq("id", input.courseUtilizationId)
    .maybeSingle();

  if (error || !utilization) {
    return { error: error?.message ?? "Course offering not found" };
  }

  const block = first((utilization as { block?: unknown }).block) as {
    academic_term_id?: string | null;
  } | null;

  if (utilization.block_id !== input.blockId) {
    return { error: "Course offering does not belong to the selected block" };
  }

  if (block?.academic_term_id !== input.academicTermId) {
    return { error: "Course offering does not belong to the selected term" };
  }

  let classId = utilization.class_id as string | null;

  if (!classId) {
    const { data: newClass, error: classError } = await supabase
      .from("class")
      .insert({ code: `TMP-${randomUUID()}` })
      .select("id")
      .single();

    if (classError || !newClass) {
      return { error: classError?.message ?? "Unable to create class" };
    }

    const { error: linkError } = await supabase
      .from("course_utilization")
      .update({ class_id: newClass.id })
      .eq("id", utilization.id);

    if (linkError) {
      return { error: linkError.message };
    }

    classId = newClass.id;
  }

  if (!classId) {
    return { error: "Unable to resolve class for this offering" };
  }

  const { data: existingUserClass, error: userClassError } = await supabase
    .from("user_class")
    .select("user_id")
    .eq("class_id", classId)
    .maybeSingle();

  if (userClassError) {
    return { error: userClassError.message };
  }

  if (existingUserClass?.user_id && existingUserClass.user_id !== input.facultyId) {
    return { error: "Class is already assigned to a different faculty" };
  }

  const sessionResult = await createClassSession({
    classId,
    type: input.type,
    roomId: input.roomId,
    day: input.day,
    startTime: input.startTime,
    endTime: input.endTime,
    facultyId: input.facultyId,
  });

  if (sessionResult.error || !sessionResult.data) {
    return sessionResult;
  }

  if (!existingUserClass?.user_id) {
    const { error: insertUserClassError } = await supabase
      .from("user_class")
      .insert({ user_id: input.facultyId, class_id: classId });
    if (insertUserClassError) {
      return { error: insertUserClassError.message };
    }
  }

  return sessionResult;
};

export const updateSessionRoom = async (
  sessionId: string,
  roomId: string | null,
): Promise<{ data?: boolean; error?: string }> => {
  if (!sessionId?.trim()) return { error: "Session is required" };

  const context = await getSessionContext(sessionId);
  if (!context) return { error: "Session context not found" };

  const [facultyWindows, blockWindows, roomWindows] = await Promise.all([
    context.facultyId
      ? getSessionWindowsByPredicate(context.academicTermId, context.day, {
          facultyId: context.facultyId,
          excludeSessionId: sessionId,
        })
      : Promise.resolve([]),
    getSessionWindowsByPredicate(context.academicTermId, context.day, {
      blockIds: context.blockIds,
      excludeSessionId: sessionId,
    }),
    roomId
      ? getSessionWindowsByPredicate(context.academicTermId, context.day, {
          roomId,
          excludeSessionId: sessionId,
        })
      : Promise.resolve([]),
  ]);

  const conflicts: Array<{ start_time: string; end_time: string; reason: string }> = [];
  facultyWindows.forEach((window) =>
    conflicts.push({ ...window, reason: "Faculty has another schedule" }),
  );
  blockWindows.forEach((window) =>
    conflicts.push({ ...window, reason: "Block has another schedule" }),
  );
  roomWindows.forEach((window) =>
    conflicts.push({ ...window, reason: "Room is occupied" }),
  );

  const conflict = conflicts.find((window) =>
    overlaps(context.start_time, context.end_time, window.start_time, window.end_time),
  );

  if (conflict) {
    return {
      error: `${conflict.reason} at ${conflict.start_time} - ${conflict.end_time}`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("session")
    .update({ room_id: roomId })
    .eq("id", sessionId);

  if (error) {
    return { error: mapMutationError(error) };
  }

  revalidatePath("/scheduler");
  return { data: true };
};

export const replaceClassFaculty = async (
  classId: string,
  facultyId: string,
): Promise<{ data?: boolean; error?: string }> => {
  if (!classId?.trim()) return { error: "Class is required" };
  if (!facultyId?.trim()) return { error: "Faculty is required" };

  const supabase = await createClient();
  const { data: classSessions, error: sessionError } = await supabase
    .from("session_class")
    .select("session:session_id(day, start_time, end_time)")
    .eq("class_id", classId);

  if (sessionError) {
    return { error: sessionError.message };
  }

  if (!classSessions || classSessions.length === 0) {
    return { error: "Assign faculty after scheduling sessions." };
  }

  const { data: classRow, error: classContextError } = await supabase
    .from("class")
    .select(
      `
      id,
      course_utilization(block_id, block:block_id(academic_term_id))
      `,
    )
    .eq("id", classId)
    .maybeSingle();

  if (classContextError || !classRow) {
    return { error: classContextError?.message ?? "Class context not found" };
  }

  const utilizations = (classRow as { course_utilization?: unknown })
    .course_utilization as Array<{
    block_id?: string;
    block?: { academic_term_id?: string } | Array<{ academic_term_id?: string }>;
  }> | null;

  const firstUtil = (utilizations ?? [])[0];
  const block = first(firstUtil?.block);
  const academicTermId = block?.academic_term_id ?? "";

  if (!academicTermId) {
    return { error: "Academic term not found for class" };
  }

  const sessions = (classSessions ?? [])
    .map(
      (row) =>
        first((row as { session?: unknown }).session) as
          | { day?: SessionDay | null; start_time?: string | null; end_time?: string | null }
          | null,
    )
    .filter(
      (row): row is { day: SessionDay; start_time: string; end_time: string } =>
        Boolean(row?.day && row?.start_time && row?.end_time),
    );

  for (const session of sessions) {
    const windows = await getSessionWindowsByPredicate(
      academicTermId,
      normalizeDay(session.day),
      {
        facultyId,
        excludeClassId: classId,
      },
    );

    const conflict = windows.find((window) =>
      overlaps(
        session.start_time ?? "",
        session.end_time ?? "",
        window.start_time,
        window.end_time,
      ),
    );

    if (conflict) {
      return {
        error: `Faculty has a conflict at ${conflict.start_time} - ${conflict.end_time}`,
      };
    }
  }

  await supabase.from("user_class").delete().eq("class_id", classId);
  const { error: userClassError } = await supabase.from("user_class").insert({
    class_id: classId,
    user_id: facultyId,
  });

  if (userClassError) {
    return { error: userClassError.message };
  }

  revalidatePath("/scheduler");
  return { data: true };
};

export const deleteClassSession = async (
  sessionId: string,
): Promise<{ data?: boolean; error?: string }> => {
  if (!sessionId?.trim()) return { error: "Session is required" };

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("session_class")
    .select(
      "class_id, class:class_id(course_utilization(block:block_id(academic_term_id)))",
    )
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existingError || !existing) {
    return { error: existingError?.message ?? "Session not found" };
  }

  const classRow = first((existing as { class?: unknown }).class) as {
    course_utilization?: unknown;
  } | null;
  const firstUtil = first(
    (classRow?.course_utilization ?? []) as Array<{
      block?: RawBlockRow | RawBlockRow[] | null;
    }>,
  );
  const academicTermId = first(firstUtil?.block)?.academic_term_id ?? null;

  const { error } = await supabase.from("session").delete().eq("id", sessionId);
  if (error) {
    return { error: mapMutationError(error) };
  }

  await unlinkFacultyIfNoSessions(supabase, existing.class_id as string);

  if (academicTermId) {
    revalidatePath("/scheduler");
  }

  return { data: true };
};
