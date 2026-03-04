"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  DayOfWeek,
  FTLClass,
  FTLScheduleBundle,
  FTLSession,
  ScheduleState,
} from "../types";
import { ensureProgramChair } from "./auth";
import { asNumber, asObject, asString, RowObject } from "./shared";

const mapScheduleState = (value: string | null | undefined): ScheduleState => {
  if (value === "APPROVED" || value === "PENDING" || value === "REJECTED") {
    return value;
  }
  return "NONE";
};

const DAY_SORT_ORDER: Record<DayOfWeek, number> = {
  SUNDAY: 1,
  MONDAY: 2,
  TUESDAY: 3,
  WEDNESDAY: 4,
  THURSDAY: 5,
  FRIDAY: 6,
  SATURDAY: 7,
};

export const asDayOfWeek = async (value: unknown): Promise<DayOfWeek> => {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized in DAY_SORT_ORDER) {
    return normalized as DayOfWeek;
  }
  return "MONDAY";
};

export const getLatestEvaluationStateMap = async (scheduleIds: string[]) => {
  if (scheduleIds.length === 0) return new Map<string, ScheduleState>();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evaluation")
    .select("schedule_id, status, created_at")
    .in("schedule_id", scheduleIds)
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("lib.ftl.getLatestEvaluationStateMap ::", error);
    return new Map<string, ScheduleState>();
  }

  const stateMap = new Map<string, ScheduleState>();
  for (const row of data ?? []) {
    if (!stateMap.has(row.schedule_id)) {
      stateMap.set(row.schedule_id, mapScheduleState(row.status));
    }
  }

  return stateMap;
};

const getScheduleByFacultyAndTerm = async (
  facultyId: string,
  termId: string,
) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedule")
    .select("id, user_id, academic_term_id, updated_at")
    .eq("user_id", facultyId)
    .eq("academic_term_id", termId)
    .maybeSingle();

  if (error) {
    console.error("lib.ftl.getScheduleByFacultyAndTerm ::", error);
    return null;
  }

  return data;
};

const mapSession = async (row: RowObject): Promise<FTLSession> => {
  const room = asObject(row.room);
  return {
    id: asString(row.id) ?? "",
    class_delivery_id: asString(row.class_delivery_id) ?? "",
    room_id: asString(row.room_id) ?? "",
    room_code: asString(room?.code),
    room_name: asString(room?.name),
    day: await asDayOfWeek(row.day),
    start_time: asString(row.start_time) ?? "00:00",
    end_time: asString(row.end_time) ?? "00:00",
    last_conflict_count: 0,
  };
};

const mapScheduleClasses = async (scheduleId: string): Promise<FTLClass[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("class_delivery")
    .select(
      `
      id,
      course_allocation:course_allocation!inner(
        id,
        schedule_id,
        course_offering_id,
        course_offering:course_offering!inner(
        id,
        course:course!inner(id, code, title, lecture_hour, laboratory_hour),
        curriculum_offering:curriculum_offering!inner(
          id,
          academic_term_id,
          curriculum:curriculum!inner(
            id,
            title,
            major:major(id, code, name, program:program(id, code, name))
          )
        )
        )
      ),
      class_delivery_block(
        block_id,
        block:block(
          id,
          year_level,
          section,
          major_offering:major_offering!inner(
            program_offering:program_offering!inner(
              campus:campus!inner(id, name)
            )
          )
        )
      ),
      session:session!session_class_delivery_id_fkey(
        id,
        class_delivery_id,
        room_id,
        day,
        start_time,
        end_time,
        room:room(id, code, name)
      )
    `,
    )
    .eq("course_allocation.schedule_id", scheduleId);

  if (error) {
    console.error("lib.ftl.mapScheduleClasses ::", error);
    return [];
  }

  return Promise.all(
    (data ?? []).map(async (raw) => {
      const row = raw as RowObject;
      const courseAllocation = asObject(row.course_allocation);
      const courseOffering = asObject(courseAllocation?.course_offering);
      const course = asObject(courseOffering?.course);
      const curriculumOffering = asObject(courseOffering?.curriculum_offering);
      const curriculum = asObject(curriculumOffering?.curriculum);
      const major = asObject(curriculum?.major);
      const program = asObject(major?.program);

      const classDeliveryBlocks =
        (row.class_delivery_block as RowObject[] | undefined) ?? [];

      const mappedBlocks = classDeliveryBlocks
        .map((item) => asObject(item.block))
        .filter((item): item is RowObject => Boolean(item));

      const blockIds = classDeliveryBlocks
        .map((item) => asString(item.block_id))
        .filter((item): item is string => Boolean(item));

      const blocks = classDeliveryBlocks
        .map((item) => {
          const blockId = asString(item.block_id);
          const block = asObject(item.block);
          const yearLevel = asNumber(block?.year_level);
          const section = asString(block?.section);
          if (!blockId || !yearLevel || !section) return null;

          return {
            id: blockId,
            label: `${yearLevel} - ${section}`,
          };
        })
        .filter((item): item is { id: string; label: string } => Boolean(item));

      const campuses = mappedBlocks
        .map((item) => asObject(item.major_offering))
        .map((majorOffering) => asObject(majorOffering?.program_offering))
        .map((programCampus) => asObject(programCampus?.campus))
        .filter((item): item is RowObject => Boolean(item));

      const campusIdList = Array.from(
        new Set(campuses.map((item) => asString(item.id)).filter(Boolean)),
      ) as string[];

      const campusNameList = Array.from(
        new Set(campuses.map((item) => asString(item.name)).filter(Boolean)),
      ) as string[];

      const yearSections = mappedBlocks
        .map((item) => {
          const yearLevel = asNumber(item.year_level);
          const section = asString(item.section);
          if (!yearLevel || !section) return null;
          return `${yearLevel} - ${section}`;
        })
        .filter((item): item is string => Boolean(item));

      const sessionsRaw = (row.session as RowObject[] | undefined) ?? [];
      const sessions = (await Promise.all(sessionsRaw.map(mapSession))).sort(
        (a, b) =>
          a.day === b.day
            ? a.start_time.localeCompare(b.start_time)
            : DAY_SORT_ORDER[a.day] - DAY_SORT_ORDER[b.day],
      );

      return {
        id: asString(row.id) ?? "",
        schedule_id: asString(courseAllocation?.schedule_id) ?? "",
        course_offering_id:
          asString(courseAllocation?.course_offering_id) ?? "",
        block_ids: blockIds,
        blocks,
        course_code: asString(course?.code) ?? "",
        course_title: asString(course?.title) ?? "",
        lecture_hour: asNumber(course?.lecture_hour),
        laboratory_hour: asNumber(course?.laboratory_hour),
        curriculum_title: asString(curriculum?.title) ?? "",
        program_code: asString(program?.code),
        major_code: asString(major?.code),
        major_name: asString(major?.name),
        campus_ids: campusIdList,
        campus_id: campusIdList[0] ?? null,
        campus_name:
          campusNameList.length > 0 ? campusNameList.join(", ") : null,
        year_section: yearSections.length > 0 ? yearSections.join(", ") : null,
        sessions,
      };
    }),
  );
};

const mapScheduleBundle = async (
  schedule: {
    id: string;
    user_id: string;
    academic_term_id: string;
    updated_at: string | null;
  } | null,
): Promise<FTLScheduleBundle> => {
  if (!schedule) {
    return {
      schedule: null,
      classes: [],
    };
  }

  const [classes, stateMap] = await Promise.all([
    mapScheduleClasses(schedule.id),
    getLatestEvaluationStateMap([schedule.id]),
  ]);

  return {
    schedule: {
      id: schedule.id,
      user_id: schedule.user_id,
      academic_term_id: schedule.academic_term_id,
      updated_at: schedule.updated_at,
      state: stateMap.get(schedule.id) ?? "NONE",
    },
    classes,
  };
};

export const getFacultyScheduleBundle = async (
  facultyId: string,
  termId: string,
): Promise<FTLScheduleBundle> => {
  await ensureProgramChair();
  const schedule = await getScheduleByFacultyAndTerm(facultyId, termId);
  return mapScheduleBundle(schedule);
};

export const findOrCreateSchedule = async (
  facultyId: string,
  termId: string,
): Promise<FTLScheduleBundle> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const existing = await getScheduleByFacultyAndTerm(facultyId, termId);
  if (existing) return mapScheduleBundle(existing);

  const { data, error } = await supabase
    .from("schedule")
    .insert({ user_id: facultyId, academic_term_id: termId })
    .select("id, user_id, academic_term_id, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      const recovered = await getScheduleByFacultyAndTerm(facultyId, termId);
      return mapScheduleBundle(recovered);
    }

    console.error("lib.ftl.findOrCreateSchedule ::", error);
    return { schedule: null, classes: [] };
  }

  revalidatePath("/ftl");
  return mapScheduleBundle(data);
};
