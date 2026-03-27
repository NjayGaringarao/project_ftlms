import type { SessionDay } from "@/models";
import { createClient } from "@/utils/supabase/server";
import type {
  ClassContext,
  SessionContext,
} from "@/lib/schedule/session-actions/types";
import { first } from "./utils";

export const unlinkFacultyIfNoSessions = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  classId: string,
): Promise<void> => {
  const { data: remaining, error } = await supabase
    .from("session_class")
    .select("session_id")
    .eq("class_id", classId)
    .limit(1);

  if (error) {
    console.error(
      "lib.schedule.session-actions.unlinkFacultyIfNoSessions ::",
      error,
    );
    return;
  }

  if (!remaining || remaining.length === 0) {
    await supabase.from("user_class").delete().eq("class_id", classId);
  }
};

export const getClassContext = async (
  classId: string,
): Promise<ClassContext | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class")
    .select(
      `
      id,
      user_class(user_id),
      course_utilization(block_id, block:block_id(academic_term_id))
      `,
    )
    .eq("id", classId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("lib.schedule.session-actions.getClassContext ::", error);
    }
    return null;
  }

  const row = data as { user_class?: unknown; course_utilization?: unknown };
  const userClass = first(row.user_class) as { user_id?: string } | null;
  const userId = userClass?.user_id ?? null;

  const utilizations = (row.course_utilization ?? []) as Array<{
    block_id?: string;
    block?: { academic_term_id?: string } | Array<{ academic_term_id?: string }>;
  }>;
  const blockIds = Array.from(
    new Set(
      utilizations
        .map((item) => item.block_id)
        .filter((item): item is string => Boolean(item)),
    ),
  );

  const firstUtil = utilizations[0];
  const block = first(firstUtil?.block);
  const academicTermId = block?.academic_term_id ?? "";

  if (!academicTermId) {
    return null;
  }

  return {
    classId,
    userId,
    academicTermId,
    blockIds,
  };
};

export const getSessionContext = async (
  sessionId: string,
): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_class")
    .select(
      `
      class_id,
      session:session_id(day, start_time, end_time),
      class:class_id(
        user_class(user_id),
        course_utilization(block_id, block:block_id(academic_term_id))
      )
      `,
    )
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("lib.schedule.session-actions.getSessionContext ::", error);
    }
    return null;
  }

  const session = first((data as { session?: unknown }).session) as {
    day?: SessionDay | null;
    start_time?: string | null;
    end_time?: string | null;
  } | null;
  const classRow = first((data as { class?: unknown }).class) as {
    user_class?: unknown;
    course_utilization?: unknown;
  } | null;

  const userClass = first(classRow?.user_class) as { user_id?: string } | null;
  const facultyId = userClass?.user_id ?? "";
  const utilizations = (classRow?.course_utilization ?? []) as Array<{
    block_id?: string;
    block?: { academic_term_id?: string } | Array<{ academic_term_id?: string }>;
  }>;
  const blockIds = Array.from(
    new Set(
      utilizations
        .map((item) => item.block_id)
        .filter((item): item is string => Boolean(item)),
    ),
  );
  const firstUtil = utilizations[0];
  const block = first(firstUtil?.block);
  const academicTermId = block?.academic_term_id ?? "";

  if (
    !session?.day ||
    !session.start_time ||
    !session.end_time ||
    !academicTermId
  ) {
    return null;
  }

  return {
    sessionId,
    classId: data.class_id as string,
    facultyId,
    academicTermId,
    blockIds,
    day: session.day,
    start_time: session.start_time,
    end_time: session.end_time,
  };
};

export const getSessionWindowsByPredicate = async (
  academicTermId: string,
  day: SessionDay,
  options: {
    roomId?: string | null;
    facultyId?: string | null;
    blockIds?: string[];
    excludeClassId?: string;
    excludeSessionId?: string;
  },
): Promise<Array<{ start_time: string; end_time: string }>> => {
  const supabase = await createClient();
  let facultyClassIds: string[] | null = null;
  let blockClassIds: string[] | null = null;

  if (options.facultyId) {
    const { data: facultyClasses, error: facultyClassError } = await supabase
      .from("user_class")
      .select("class_id")
      .eq("user_id", options.facultyId);

    if (facultyClassError) {
      console.error(
        "lib.schedule.session-actions.getSessionWindowsByPredicate.faculty ::",
        facultyClassError,
      );
      return [];
    }

    facultyClassIds = (facultyClasses ?? [])
      .map((row) => row.class_id as string)
      .filter(Boolean);

    if (facultyClassIds.length === 0) return [];
  }

  if (options.blockIds && options.blockIds.length > 0) {
    const { data: blockClasses, error: blockClassError } = await supabase
      .from("course_utilization")
      .select("class_id, block:block_id(academic_term_id)")
      .in("block_id", options.blockIds)
      .eq("block.academic_term_id", academicTermId);

    if (blockClassError) {
      console.error(
        "lib.schedule.session-actions.getSessionWindowsByPredicate.block ::",
        blockClassError,
      );
      return [];
    }

    blockClassIds = Array.from(
      new Set(
        (blockClasses ?? [])
          .map((row) => row.class_id as string)
          .filter(Boolean),
      ),
    );

    if (blockClassIds.length === 0) return [];
  }
  let query = supabase
    .from("session_class")
    .select(
      `
      session:session_id(start_time, end_time, day, room_id),
      class:class_id(
        id,
        user_class(user_id),
        course_utilization(block_id, block:block_id(academic_term_id))
      )
      `,
    )
    .eq("session.day", day)
    .eq("class.course_utilization.block.academic_term_id", academicTermId);

  if (options.roomId) {
    query = query.eq("session.room_id", options.roomId);
  }

  if (facultyClassIds) {
    query = query.in("class_id", facultyClassIds);
  }

  if (blockClassIds) {
    query = query.in("class_id", blockClassIds);
  }

  if (options.excludeClassId) {
    query = query.neq("class.id", options.excludeClassId);
  }

  if (options.excludeSessionId) {
    query = query.neq("session.id", options.excludeSessionId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "lib.schedule.session-actions.getSessionWindowsByPredicate ::",
      error,
    );
    return [];
  }

  return (data ?? [])
    .map((item) => {
      const session = first((item as { session?: unknown }).session) as {
        start_time?: string | null;
        end_time?: string | null;
      } | null;
      if (!session?.start_time || !session?.end_time) return null;
      return { start_time: session.start_time, end_time: session.end_time };
    })
    .filter(
      (item): item is { start_time: string; end_time: string } => Boolean(item),
    );
};
