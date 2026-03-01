"use server";

import { revalidatePath } from "next/cache";
import { getUserRole } from "@/lib/auth/utils";
import { createClient } from "@/utils/supabase/server";
import {
  ConflictType,
  FTLBootstrapData,
  FTLClass,
  FTLFaculty,
  FTLOfferingOption,
  FTLOffering,
  FTLRoom,
  FTLScheduleBundle,
  FTLSession,
  MultiCampusSubmitResult,
  MutationResult,
  SaveSessionInput,
  SaveSessionResult,
  ScheduleState,
  SessionConflict,
} from "./types";

type RowObject = Record<string, unknown>;

const STALE_ERROR =
  "This schedule was updated by another editor. Reload to avoid overwriting recent changes.";

const ensureProgramChair = async () => {
  const roles = await getUserRole();
  if (!roles.includes("PROGRAM_CHAIRPERSON")) {
    throw new Error("Unauthorized");
  }
};

const asObject = (value: unknown): RowObject | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object" ? (first as RowObject) : null;
  }
  return typeof value === "object" ? (value as RowObject) : null;
};

const asString = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
};

const mapScheduleState = (value: string | null | undefined): ScheduleState => {
  if (value === "APPROVED" || value === "PENDING" || value === "REJECTED") {
    return value;
  }
  return "NONE";
};

const formatName = (
  firstName: string | null,
  middleName: string | null,
  lastName: string | null,
  extension: string | null,
) => {
  const segments = [firstName, middleName, lastName].filter(Boolean);
  const extensionLabel = extension?.trim();
  const base = segments.join(" ").replace(/\s+/g, " ").trim();

  if (!base) return "Unknown Faculty";
  return extensionLabel ? `${base}, ${extensionLabel}` : base;
};

const getLatestEvaluationStateMap = async (scheduleIds: string[]) => {
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

const touchSchedule = async (scheduleId: string) => {
  const supabase = await createClient();
  await supabase
    .from("schedule")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", scheduleId);
};

const assertScheduleIsFresh = async (
  scheduleId: string,
  expectedUpdatedAt: string | null,
  forceStaleSave: boolean,
) => {
  if (forceStaleSave) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedule")
    .select("updated_at")
    .eq("id", scheduleId)
    .single();

  if (error) {
    console.error("lib.ftl.assertScheduleIsFresh ::", error);
    return "Unable to validate schedule freshness";
  }

  const latest = data?.updated_at ?? null;
  if (latest && expectedUpdatedAt && latest !== expectedUpdatedAt) {
    return STALE_ERROR;
  }

  return null;
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

const mapSession = (row: RowObject): FTLSession => {
  const room = asObject(row.room);
  return {
    id: asString(row.id) ?? "",
    class_id: asString(row.class_id) ?? "",
    room_id: asString(row.room_id),
    room_code: asString(room?.code),
    room_name: asString(room?.name),
    day: asNumber(row.day) ?? 1,
    start_time: asString(row.start_time) ?? "00:00",
    end_time: asString(row.end_time) ?? "00:00",
    last_conflict_count: 0,
  };
};

const mapScheduleClasses = async (scheduleId: string): Promise<FTLClass[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("class")
    .select(
      `
      id,
      schedule_id,
      course_c_t_id,
      block_id,
      course_c_t:course_c_t!inner(
        id,
        course:course!inner(id, code, title, lecture_hour, laboratory_hour),
        curriculum_at:curriculum_at!inner(
          id,
          academic_term_id,
          curriculum:curriculum!inner(
            id,
            title,
            major:major(id, code, name, program:program(id, code, name))
          )
        )
      ),
      block:block(
        id,
        year_level,
        section,
        major_p_c:major_p_c!inner(
          program_campus:program_campus!inner(
            campus:campus!inner(id, name)
          )
        )
      ),
      session(
        id,
        class_id,
        room_id,
        day,
        start_time,
        end_time,
        room:room(id, code, name)
      )
    `,
    )
    .eq("schedule_id", scheduleId);

  if (error) {
    console.error("lib.ftl.mapScheduleClasses ::", error);
    return [];
  }

  return (data ?? []).map((raw) => {
    const row = raw as RowObject;
    const block = asObject(row.block);
    const courseCt = asObject(row.course_c_t);
    const course = asObject(courseCt?.course);
    const curriculumAt = asObject(courseCt?.curriculum_at);
    const curriculum = asObject(curriculumAt?.curriculum);
    const major = asObject(curriculum?.major);
    const program = asObject(major?.program);

    const majorPc = asObject(block?.major_p_c);
    const programCampus = asObject(majorPc?.program_campus);
    const campus = asObject(programCampus?.campus);

    const sessionsRaw = (row.session as RowObject[] | undefined) ?? [];
    const sessions = sessionsRaw
      .map(mapSession)
      .sort((a, b) =>
        a.day === b.day
          ? a.start_time.localeCompare(b.start_time)
          : a.day - b.day,
      );

    const yearLevel = asNumber(block?.year_level);
    const section = asString(block?.section);

    return {
      id: asString(row.id) ?? "",
      schedule_id: asString(row.schedule_id) ?? "",
      course_c_t_id: asString(row.course_c_t_id) ?? "",
      block_id: asString(row.block_id),
      course_code: asString(course?.code) ?? "",
      course_title: asString(course?.title) ?? "",
      lecture_hour: asNumber(course?.lecture_hour),
      laboratory_hour: asNumber(course?.laboratory_hour),
      curriculum_title: asString(curriculum?.title) ?? "",
      program_code: asString(program?.code),
      major_code: asString(major?.code),
      major_name: asString(major?.name),
      campus_id: asString(campus?.id),
      campus_name: asString(campus?.name),
      year_section:
        yearLevel && section ? `Year ${yearLevel} - ${section}` : null,
      sessions,
    };
  });
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

export const getProgramChairBootstrapData =
  async (): Promise<FTLBootstrapData> => {
    await ensureProgramChair();
    const supabase = await createClient();

    const [termsResult, campusesResult] = await Promise.all([
      supabase
        .from("academic_term")
        .select(
          "id, code, academic_year_start, academic_year_end, term_order, type, start, end",
        )
        .order("academic_year_start", { ascending: false })
        .order("academic_year_end", { ascending: false })
        .order("term_order", { ascending: true }),
      supabase
        .from("campus")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

    if (termsResult.error) {
      console.error(
        "lib.ftl.getProgramChairBootstrapData terms::",
        termsResult.error,
      );
    }

    if (campusesResult.error) {
      console.error(
        "lib.ftl.getProgramChairBootstrapData campuses::",
        campusesResult.error,
      );
    }

    return {
      terms: termsResult.data ?? [],
      campuses: campusesResult.data ?? [],
    };
  };

export const getFacultyList = async (): Promise<FTLFaculty[]> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user")
    .select(
      `
      id,
      employment_status,
      identity(first_name, middle_name, last_name, extension),
      designation(load)
    `,
    )
    .order("id", { ascending: true });

  if (error) {
    console.error("lib.ftl.getFacultyList ::", error);
    return [];
  }

  return (data ?? []).map((raw) => {
    const row = raw as RowObject;
    const identity = asObject(row.identity);
    const designations = (
      (row.designation as RowObject[] | undefined) ?? []
    ).map((item) => asNumber(item.load) ?? 0);

    return {
      id: asString(row.id) ?? "",
      first_name: asString(identity?.first_name) ?? "",
      middle_name: asString(identity?.middle_name),
      last_name: asString(identity?.last_name) ?? "",
      extension: asString(identity?.extension),
      employment_status: asString(row.employment_status) ?? "UNKNOWN",
      total_designation_load: designations.reduce(
        (sum, value) => sum + value,
        0,
      ),
    };
  });
};

export const getRoomsByCampus = async (
  campusId: string,
): Promise<FTLRoom[]> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("room")
    .select("id, campus_id, code, name")
    .eq("campus_id", campusId)
    .order("code", { ascending: true });

  if (error) {
    console.error("lib.ftl.getRoomsByCampus ::", error);
    return [];
  }

  return (data ?? []) as FTLRoom[];
};

export const getOfferedCoursesByTermCampus = async (
  termId: string,
  campusId: string,
): Promise<FTLOffering[]> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const { data: blocksRaw, error: blocksError } = await supabase
    .from("block")
    .select(
      `
      id,
      curriculum_id,
      year_level,
      section,
      student_count,
      major_p_c:major_p_c!inner(
        program_campus:program_campus!inner(campus_id)
      )
    `,
    )
    .eq("major_p_c.program_campus.campus_id", campusId);

  if (blocksError) {
    console.error(
      "lib.ftl.getOfferedCoursesByTermCampus blocks::",
      blocksError,
    );
    return [];
  }

  const blocksByCurriculum = new Map<
    string,
    {
      id: string;
      year_level: number;
      section: string;
      student_count: number | null;
    }[]
  >();

  for (const raw of blocksRaw ?? []) {
    const row = raw as RowObject;
    const curriculumId = asString(row.curriculum_id);
    if (!curriculumId) continue;

    const bucket = blocksByCurriculum.get(curriculumId) ?? [];
    bucket.push({
      id: asString(row.id) ?? "",
      year_level: asNumber(row.year_level) ?? 1,
      section: asString(row.section) ?? "",
      student_count: asNumber(row.student_count),
    });
    blocksByCurriculum.set(curriculumId, bucket);
  }

  const curriculumIds = Array.from(blocksByCurriculum.keys());
  if (curriculumIds.length === 0) return [];

  const { data: offeringsRaw, error: offeringsError } = await supabase
    .from("course_c_t")
    .select(
      `
      id,
      course_id,
      course:course!inner(id, code, title, lecture_hour, laboratory_hour),
      curriculum_at:curriculum_at!inner(
        id,
        curriculum_id,
        academic_term_id,
        curriculum:curriculum!inner(
          id,
          title,
          series_year,
          revised_year,
          major:major!inner(
            id,
            code,
            name,
            program:program(id, code, name)
          )
        )
      )
    `,
    )
    .eq("curriculum_at.academic_term_id", termId)
    .in("curriculum_at.curriculum_id", curriculumIds);

  if (offeringsError) {
    console.error(
      "lib.ftl.getOfferedCoursesByTermCampus offerings::",
      offeringsError,
    );
    return [];
  }

  return (offeringsRaw ?? []).map((raw) => {
    const row = raw as RowObject;
    const course = asObject(row.course);
    const curriculumAt = asObject(row.curriculum_at);
    const curriculum = asObject(curriculumAt?.curriculum);
    const major = asObject(curriculum?.major);
    const program = asObject(major?.program);
    const curriculumId = asString(curriculumAt?.curriculum_id) ?? "";

    return {
      course_c_t_id: asString(row.id) ?? "",
      course_id: asString(row.course_id) ?? "",
      course_code: asString(course?.code) ?? "",
      course_title: asString(course?.title) ?? "",
      lecture_hour: asNumber(course?.lecture_hour),
      laboratory_hour: asNumber(course?.laboratory_hour),
      curriculum_id: curriculumId,
      curriculum_title: asString(curriculum?.title) ?? "",
      curriculum_series_year: asNumber(curriculum?.series_year) ?? 0,
      curriculum_revised_year: asNumber(curriculum?.revised_year),
      major_code: asString(major?.code),
      major_name: asString(major?.name),
      program_code: asString(program?.code),
      program_name: asString(program?.name),
      available_blocks:
        blocksByCurriculum
          .get(curriculumId)
          ?.sort((a, b) =>
            a.year_level === b.year_level
              ? a.section.localeCompare(b.section)
              : a.year_level - b.year_level,
          ) ?? [],
    };
  });
};

export const getOfferedCourseOptionsByTermCampuses = async (
  termId: string,
  campusIds: string[],
): Promise<FTLOfferingOption[]> => {
  await ensureProgramChair();

  const dedupedCampusIds = Array.from(new Set(campusIds.filter(Boolean)));
  if (!termId || dedupedCampusIds.length === 0) return [];

  const supabase = await createClient();

  const { data: blocksRaw, error: blocksError } = await supabase
    .from("block")
    .select(
      `
      id,
      curriculum_id,
      year_level,
      section,
      major_p_c:major_p_c!inner(
        major:major!inner(
          code,
          name,
          program:program(code, name)
        ),
        program_campus:program_campus!inner(
          campus:campus!inner(id, name)
        )
      )
    `,
    )
    .in("major_p_c.program_campus.campus_id", dedupedCampusIds);

  if (blocksError) {
    console.error(
      "lib.ftl.getOfferedCourseOptionsByTermCampuses blocks::",
      blocksError,
    );
    return [];
  }

  const blocks = (blocksRaw ?? []).map((raw) => {
    const row = raw as RowObject;
    const majorPc = asObject(row.major_p_c);
    const major = asObject(majorPc?.major);
    const program = asObject(major?.program);
    const programCampus = asObject(majorPc?.program_campus);
    const campus = asObject(programCampus?.campus);

    return {
      id: asString(row.id) ?? "",
      curriculum_id: asString(row.curriculum_id) ?? "",
      year_level: asNumber(row.year_level) ?? 1,
      section: asString(row.section) ?? "",
      campus_id: asString(campus?.id) ?? "",
      campus_name: asString(campus?.name) ?? "Unknown Campus",
      program_code: asString(program?.code),
      major_code: asString(major?.code),
      major_name: asString(major?.name),
    };
  });

  const curriculumIds = Array.from(
    new Set(blocks.map((item) => item.curriculum_id).filter(Boolean)),
  );
  const blockIds = Array.from(
    new Set(blocks.map((item) => item.id).filter(Boolean)),
  );

  if (curriculumIds.length === 0 || blockIds.length === 0) return [];

  const [offeringsResult, takenResult] = await Promise.all([
    supabase
      .from("course_c_t")
      .select(
        `
        id,
        course_id,
        course:course!inner(id, code, title, lecture_hour, laboratory_hour),
        curriculum_at:curriculum_at!inner(
          id,
          curriculum_id,
          academic_term_id,
          curriculum:curriculum!inner(id, title)
        )
      `,
      )
      .eq("curriculum_at.academic_term_id", termId)
      .in("curriculum_at.curriculum_id", curriculumIds),
    supabase
      .from("class")
      .select(
        `
        id,
        course_c_t_id,
        block_id,
        schedule:schedule!inner(
          id,
          academic_term_id,
          user:user!inner(
            identity(first_name, middle_name, last_name, extension)
          )
        )
      `,
      )
      .eq("schedule.academic_term_id", termId)
      .in("block_id", blockIds),
  ]);

  if (offeringsResult.error) {
    console.error(
      "lib.ftl.getOfferedCourseOptionsByTermCampuses offerings::",
      offeringsResult.error,
    );
    return [];
  }

  if (takenResult.error) {
    console.error(
      "lib.ftl.getOfferedCourseOptionsByTermCampuses taken::",
      takenResult.error,
    );
    return [];
  }

  const takenMap = new Map<string, string[]>();

  for (const raw of takenResult.data ?? []) {
    const row = raw as RowObject;
    const courseCtId = asString(row.course_c_t_id);
    const blockId = asString(row.block_id);
    if (!courseCtId || !blockId) continue;

    const schedule = asObject(row.schedule);
    const user = asObject(schedule?.user);
    const identity = asObject(user?.identity);
    const facultyName = formatName(
      asString(identity?.first_name),
      asString(identity?.middle_name),
      asString(identity?.last_name),
      asString(identity?.extension),
    );

    const key = `${courseCtId}:${blockId}`;
    const existing = takenMap.get(key) ?? [];

    if (!existing.includes(facultyName)) {
      existing.push(facultyName);
    }

    takenMap.set(key, existing);
  }

  const options: FTLOfferingOption[] = [];

  for (const rawOffering of offeringsResult.data ?? []) {
    const offering = rawOffering as RowObject;
    const curriculumAt = asObject(offering.curriculum_at);
    const curriculumId = asString(curriculumAt?.curriculum_id);
    if (!curriculumId) continue;

    const curriculum = asObject(curriculumAt?.curriculum);
    const course = asObject(offering.course);
    const courseCtId = asString(offering.id) ?? "";

    for (const block of blocks.filter(
      (item) => item.curriculum_id === curriculumId,
    )) {
      const key = `${courseCtId}:${block.id}`;
      const assignedFaculty = takenMap.get(key) ?? [];

      options.push({
        key,
        campus_id: block.campus_id,
        campus_name: block.campus_name,
        course_c_t_id: courseCtId,
        block_id: block.id,
        block_label: `Y${block.year_level}-${block.section}`,
        course_code: asString(course?.code) ?? "",
        course_title: asString(course?.title) ?? "",
        lecture_hour: asNumber(course?.lecture_hour),
        laboratory_hour: asNumber(course?.laboratory_hour),
        program_code: block.program_code,
        major_code: block.major_code,
        major_name: block.major_name,
        curriculum_title: asString(curriculum?.title) ?? "",
        is_taken: assignedFaculty.length > 0,
        assigned_faculty_name:
          assignedFaculty.length > 0 ? assignedFaculty.join(", ") : null,
      });
    }
  }

  return options.sort((a, b) => {
    if (a.campus_name !== b.campus_name)
      return a.campus_name.localeCompare(b.campus_name);
    if (a.course_code !== b.course_code)
      return a.course_code.localeCompare(b.course_code);
    if ((a.program_code ?? "") !== (b.program_code ?? "")) {
      return (a.program_code ?? "").localeCompare(b.program_code ?? "");
    }
    return a.block_label.localeCompare(b.block_label);
  });
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

export const createClass = async (input: {
  schedule_id: string;
  course_c_t_id: string;
  block_id: string | null;
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

  const { error } = await supabase.from("class").insert({
    schedule_id: input.schedule_id,
    course_c_t_id: input.course_c_t_id,
    block_id: input.block_id,
  });

  if (error) {
    console.error("lib.ftl.createClass ::", error);
    return { error: error.message ?? "Unable to add class" };
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const updateClass = async (input: {
  class_id: string;
  schedule_id: string;
  course_c_t_id: string;
  block_id: string | null;
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
    .from("class")
    .update({
      course_c_t_id: input.course_c_t_id,
      block_id: input.block_id,
    })
    .eq("id", input.class_id);

  if (error) {
    console.error("lib.ftl.updateClass ::", error);
    return { error: error.message ?? "Unable to update class" };
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const deleteClass = async (input: {
  class_id: string;
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
    .from("class")
    .delete()
    .eq("id", input.class_id);

  if (error) {
    console.error("lib.ftl.deleteClass ::", error);
    return { error: error.message ?? "Unable to delete class" };
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

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
      class:class!inner(
        id,
        block_id,
        block:block(id, year_level, section),
        course_c_t:course_c_t!inner(
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
      )
    `,
    )
    .eq("day", input.day)
    .eq("class.schedule.academic_term_id", input.academic_term_id);

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
    .map((raw) => asObject((raw as RowObject).class))
    .map((classRow) => asObject(classRow?.schedule))
    .map((schedule) => asString(schedule?.id))
    .filter((id): id is string => Boolean(id));

  const stateMap = await getLatestEvaluationStateMap(scheduleIds);
  const conflicts: SessionConflict[] = [];

  for (const raw of overlaps) {
    const row = raw as RowObject;
    const classRow = asObject(row.class);
    const schedule = asObject(classRow?.schedule);
    if (!classRow || !schedule) continue;

    const user = asObject(schedule.user);
    const identity = asObject(user?.identity);
    const room = asObject(row.room);
    const courseCt = asObject(classRow.course_c_t);
    const course = asObject(courseCt?.course);
    const block = asObject(classRow.block);

    const scheduleId = asString(schedule.id);
    if (!scheduleId) continue;

    const matchedTypes: ConflictType[] = [];

    if (asString(schedule.user_id) === input.faculty_user_id) {
      matchedTypes.push("FACULTY");
    }

    if (
      input.room_id &&
      asString(row.room_id) &&
      asString(row.room_id) === input.room_id &&
      asString(room?.campus_id) === input.campus_id
    ) {
      matchedTypes.push("ROOM");
    }

    if (input.block_id && asString(classRow.block_id) === input.block_id) {
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
          asNumber(block?.year_level) && asString(block?.section)
            ? `Year ${asNumber(block?.year_level)} - ${asString(block?.section)}`
            : null,
        day: asNumber(row.day) ?? input.day,
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
    class_id: input.class_id,
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
      class_id,
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
      class_id: asString(dataRow.class_id) ?? "",
      room_id: asString(dataRow.room_id),
      room_code: asString(room?.code),
      room_name: asString(room?.name),
      day: asNumber(dataRow.day) ?? input.day,
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

export const submitScheduleForCampusDirector = async (input: {
  schedule_id: string;
  campus_id: string;
}): Promise<MutationResult> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const { data: designation, error: designationError } = await supabase
    .from("designation")
    .select("id")
    .eq("campus_id", input.campus_id)
    .ilike("job_title", "Campus Director")
    .order("designated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (designationError) {
    console.error(
      "lib.ftl.submitScheduleForCampusDirector designation::",
      designationError,
    );
    return {
      error: designationError.message ?? "Unable to resolve campus director",
    };
  }

  if (!designation?.id) {
    return {
      error:
        "No campus director designation found for this campus. Assign a campus director before submission.",
    };
  }

  const { error } = await supabase.from("evaluation").upsert(
    {
      designation_id: designation.id,
      schedule_id: input.schedule_id,
      evaluation_level: 0,
      evaluator_role: "CAMPUS_DIRECTOR",
      status: "PENDING",
      comment: null,
      created_at: new Date().toISOString(),
    },
    {
      onConflict: "designation_id,schedule_id",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    console.error(
      "lib.ftl.submitScheduleForCampusDirector evaluation::",
      error,
    );
    return { error: error.message ?? "Unable to submit schedule" };
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const submitScheduleForCampusDirectors = async (input: {
  schedule_id: string;
  campus_ids: string[];
}): Promise<MultiCampusSubmitResult> => {
  await ensureProgramChair();

  const campusIds = Array.from(new Set(input.campus_ids.filter(Boolean)));
  if (campusIds.length === 0) {
    return {
      error: "Select at least one campus before submission.",
      submitted_campus_count: 0,
      missing_directors: [],
    };
  }

  const supabase = await createClient();

  const { data: campuses, error: campusesError } = await supabase
    .from("campus")
    .select("id, name")
    .in("id", campusIds);

  if (campusesError) {
    console.error(
      "lib.ftl.submitScheduleForCampusDirectors campuses::",
      campusesError,
    );
    return {
      error: campusesError.message ?? "Unable to resolve selected campuses",
      submitted_campus_count: 0,
      missing_directors: [],
    };
  }

  const campusNameMap = new Map<string, string>(
    (campuses ?? []).map((item) => [item.id, item.name]),
  );

  const missing_directors: { campus_id: string; campus_name: string }[] = [];
  let submittedCount = 0;

  for (const campusId of campusIds) {
    const { data: designation, error: designationError } = await supabase
      .from("designation")
      .select("id")
      .eq("campus_id", campusId)
      .ilike("job_title", "Campus Director")
      .order("designated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (designationError) {
      console.error(
        "lib.ftl.submitScheduleForCampusDirectors designation::",
        designationError,
      );
      return {
        error: designationError.message ?? "Unable to resolve campus director",
        submitted_campus_count: submittedCount,
        missing_directors,
      };
    }

    if (!designation?.id) {
      missing_directors.push({
        campus_id: campusId,
        campus_name: campusNameMap.get(campusId) ?? "Unknown Campus",
      });
      continue;
    }

    const { error } = await supabase.from("evaluation").upsert(
      {
        designation_id: designation.id,
        schedule_id: input.schedule_id,
        evaluation_level: 0,
        evaluator_role: "CAMPUS_DIRECTOR",
        status: "PENDING",
        comment: null,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "designation_id,schedule_id",
        ignoreDuplicates: false,
      },
    );

    if (error) {
      console.error(
        "lib.ftl.submitScheduleForCampusDirectors evaluation::",
        error,
      );
      return {
        error: error.message ?? "Unable to submit schedule",
        submitted_campus_count: submittedCount,
        missing_directors,
      };
    }

    submittedCount += 1;
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");

  return {
    error: null,
    submitted_campus_count: submittedCount,
    missing_directors,
  };
};
