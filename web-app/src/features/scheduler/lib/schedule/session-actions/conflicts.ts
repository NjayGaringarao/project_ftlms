"use server";

import type { SessionDay } from "@/features/shared/types/models";
import { createClient } from "@/utils/supabase/server";
import { first } from "./utils";
import {
  getClassContext,
  getSessionWindowsByPredicate,
} from "./shared";
import type { SessionConflictWindow } from "./types";

export const getSessionConflictWindows = async (
  classId: string,
  day: SessionDay,
  roomId?: string | null,
  facultyId?: string | null,
): Promise<SessionConflictWindow[]> => {
  const context = await getClassContext(classId);
  if (!context) return [];
  const conflictFacultyId = facultyId ?? context.userId ?? null;

  const supabase = await createClient();
  const { data: ownSessions, error: ownSessionError } = await supabase
    .from("session_class")
    .select("session:session_id(start_time, end_time)")
    .eq("class_id", classId)
    .eq("session.day", day);

  if (ownSessionError) {
    console.error(
      "lib.schedule.session-actions.getSessionConflictWindows.own ::",
      ownSessionError,
    );
  }

  const [facultySessions, blockSessions, roomSessions] = await Promise.all([
    conflictFacultyId
      ? getSessionWindowsByPredicate(context.academicTermId, day, {
          facultyId: conflictFacultyId,
          excludeClassId: classId,
        })
      : Promise.resolve([]),
    getSessionWindowsByPredicate(context.academicTermId, day, {
      blockIds: context.blockIds,
      excludeClassId: classId,
    }),
    roomId
      ? getSessionWindowsByPredicate(context.academicTermId, day, {
          roomId,
          excludeClassId: classId,
        })
      : Promise.resolve([]),
  ]);

  const windows: SessionConflictWindow[] = [];

  (ownSessions ?? []).forEach((row) => {
    const session = first((row as { session?: unknown }).session) as {
      start_time?: string | null;
      end_time?: string | null;
    } | null;
    if (!session?.start_time || !session?.end_time) return;
    windows.push({
      start_time: session.start_time,
      end_time: session.end_time,
      reason: "Class has an existing session",
    });
  });

  facultySessions.forEach((row) => {
    windows.push({
      start_time: row.start_time,
      end_time: row.end_time,
      reason: "Faculty has another schedule",
    });
  });

  blockSessions.forEach((row) => {
    windows.push({
      start_time: row.start_time,
      end_time: row.end_time,
      reason: "Block has another schedule",
    });
  });

  roomSessions.forEach((row) => {
    windows.push({
      start_time: row.start_time,
      end_time: row.end_time,
      reason: "Room is occupied",
    });
  });

  return windows;
};
