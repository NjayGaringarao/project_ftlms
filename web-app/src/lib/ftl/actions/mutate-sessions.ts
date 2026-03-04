"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  ConflictType,
  MutationResult,
  SaveSessionInput,
  SaveSessionResult,
  SessionConflict,
} from "../types";
import { ensureProgramChair } from "./auth";
import { assertScheduleIsFresh, touchSchedule } from "./mutation-shared";
import { asDayOfWeek, getLatestEvaluationStateMap } from "./read-schedule";
import { asNumber, asObject, asString, formatName, RowObject } from "./shared";

const getOverlapConflicts = async (
  input: SaveSessionInput,
): Promise<SessionConflict[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("session")
    .select(
      `
      id,
      room_id,
      day,
      start_time,
      end_time,
      room:room(id, campus_id, code, name),
      class_delivery:class_delivery!inner(
        id,
        course_allocation:course_allocation!inner(
          id,
          course_offering:course_offering!inner(
            id,
            course:course!inner(code, title)
          ),
          schedule:schedule!inner(
            id,
            user_id,
            academic_term_id,
            user:user!inner(
              identity(first_name, middle_name, last_name, extension)
            )
          )
        ),
        class_delivery_block(
          block_id,
          block:block(id, year_level, section)
        )
      )
    `,
    )
    .eq("day", input.day)
    .eq(
      "class_delivery.course_allocation.schedule.academic_term_id",
      input.academic_term_id,
    );

  if (error) {
    console.error("lib.ftl.getOverlapConflicts ::", error);
    return [];
  }

  const overlaps = (data ?? []).filter((raw) => {
    const row = raw as RowObject;
    if (input.session_id && asString(row.id) === input.session_id) return false;

    const rowStart = asString(row.start_time) ?? "";
    const rowEnd = asString(row.end_time) ?? "";
    return input.start_time < rowEnd && rowStart < input.end_time;
  });

  if (overlaps.length === 0) return [];

  const scheduleIds = overlaps
    .map((raw) => asObject((raw as RowObject).class_delivery))
    .map((classRow) => asObject(classRow?.course_allocation))
    .map((courseAllocation) => asObject(courseAllocation?.schedule))
    .map((schedule) => asString(schedule?.id))
    .filter((id): id is string => Boolean(id));

  const stateMap = await getLatestEvaluationStateMap(scheduleIds);
  const conflicts: SessionConflict[] = [];

  for (const raw of overlaps) {
    const row = raw as RowObject;
    const classRow = asObject(row.class_delivery);
    const courseAllocation = asObject(classRow?.course_allocation);
    const schedule = asObject(courseAllocation?.schedule);
    if (!classRow || !schedule) continue;

    const user = asObject(schedule.user);
    const identity = asObject(user?.identity);
    const room = asObject(row.room);
    const courseOffering = asObject(courseAllocation?.course_offering);
    const course = asObject(courseOffering?.course);
    const classDeliveryBlocks =
      (classRow.class_delivery_block as RowObject[] | undefined) ?? [];

    const conflictingBlockIds = classDeliveryBlocks
      .map((item) => asString(item.block_id))
      .filter((item): item is string => Boolean(item));

    const conflictingBlockLabels = classDeliveryBlocks
      .map((item) => asObject(item.block))
      .map((block) => {
        const yearLevel = asNumber(block?.year_level);
        const section = asString(block?.section);
        if (!yearLevel || !section) return null;
        return `Year ${yearLevel} - ${section}`;
      })
      .filter((item): item is string => Boolean(item));

    const scheduleId = asString(schedule.id);
    if (!scheduleId) continue;

    const matchedTypes: ConflictType[] = [];

    if (asString(schedule.user_id) === input.faculty_user_id) {
      matchedTypes.push("FACULTY");
    }

    if (
      input.room_id &&
      asString(row.room_id) &&
      asString(row.room_id) === input.room_id
    ) {
      matchedTypes.push("ROOM");
    }

    if (
      input.block_ids.length > 0 &&
      conflictingBlockIds.some((blockId) => input.block_ids.includes(blockId))
    ) {
      matchedTypes.push("BLOCK");
    }

    if (matchedTypes.length === 0) continue;

    const facultyName = formatName(
      asString(identity?.first_name),
      asString(identity?.middle_name),
      asString(identity?.last_name),
      asString(identity?.extension),
    );

    for (const type of matchedTypes) {
      conflicts.push({
        type,
        severity: type === "FACULTY" ? "HIGH" : "MEDIUM",
        message:
          type === "FACULTY"
            ? "Faculty double-booked"
            : type === "ROOM"
              ? "Room occupied"
              : "Block overlap",
        conflicting_session_id: asString(row.id) ?? "",
        conflicting_schedule_id: scheduleId,
        conflicting_schedule_state: stateMap.get(scheduleId) ?? "NONE",
        conflicting_course_code: asString(course?.code) ?? "",
        conflicting_course_title: asString(course?.title) ?? "",
        conflicting_faculty_name: facultyName,
        conflicting_room_code: asString(room?.code),
        conflicting_block:
          conflictingBlockLabels.length > 0
            ? conflictingBlockLabels.join(", ")
            : null,
        day: await asDayOfWeek(row.day),
        start_time: asString(row.start_time) ?? "00:00",
        end_time: asString(row.end_time) ?? "00:00",
      });
    }
  }

  return conflicts;
};

export const saveSession = async (
  input: SaveSessionInput,
): Promise<SaveSessionResult> => {
  await ensureProgramChair();
  const supabase = await createClient();

  if (!input.room_id) {
    return {
      session: null,
      conflicts: [],
      stale_error: null,
      needs_conflict_confirmation: false,
      error: "Room is required.",
    };
  }

  const staleError = await assertScheduleIsFresh(
    input.schedule_id,
    input.expected_schedule_updated_at,
    Boolean(input.force_stale_save),
  );

  if (staleError) {
    return {
      session: null,
      conflicts: [],
      stale_error: staleError,
      needs_conflict_confirmation: false,
      error: staleError,
    };
  }

  const conflicts = await getOverlapConflicts(input);

  if (conflicts.length > 0 && !input.save_anyway) {
    return {
      session: null,
      conflicts,
      stale_error: null,
      needs_conflict_confirmation: true,
      error: null,
    };
  }

  const payload = {
    class_delivery_id: input.class_delivery_id,
    room_id: input.room_id,
    day: input.day,
    start_time: input.start_time,
    end_time: input.end_time,
  };

  const query = input.session_id
    ? supabase.from("session").update(payload).eq("id", input.session_id)
    : supabase.from("session").insert(payload);

  const { data, error } = await query
    .select(
      `
      id,
      class_delivery_id,
      room_id,
      day,
      start_time,
      end_time,
      room:room(code, name)
    `,
    )
    .single();

  if (error) {
    console.error("lib.ftl.saveSession ::", error);
    return {
      session: null,
      conflicts,
      stale_error: null,
      needs_conflict_confirmation: false,
      error: error.message ?? "Unable to save session",
    };
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");

  const dataRow = data as RowObject;
  const room = asObject(dataRow.room);

  return {
    session: {
      id: asString(dataRow.id) ?? "",
      class_delivery_id: asString(dataRow.class_delivery_id) ?? "",
      room_id: asString(dataRow.room_id) ?? "",
      room_code: asString(room?.code),
      room_name: asString(room?.name),
      day: await asDayOfWeek(dataRow.day),
      start_time: asString(dataRow.start_time) ?? input.start_time,
      end_time: asString(dataRow.end_time) ?? input.end_time,
      last_conflict_count: conflicts.length,
    },
    conflicts,
    stale_error: null,
    needs_conflict_confirmation: false,
    error: null,
  };
};

export const deleteSession = async (input: {
  session_id: string;
  schedule_id: string;
  expected_schedule_updated_at: string | null;
  force_stale_save?: boolean;
}): Promise<MutationResult> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const staleError = await assertScheduleIsFresh(
    input.schedule_id,
    input.expected_schedule_updated_at,
    Boolean(input.force_stale_save),
  );
  if (staleError) return { error: staleError };

  const { error } = await supabase
    .from("session")
    .delete()
    .eq("id", input.session_id);

  if (error) {
    console.error("lib.ftl.deleteSession ::", error);
    return { error: error.message ?? "Unable to delete session" };
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};
