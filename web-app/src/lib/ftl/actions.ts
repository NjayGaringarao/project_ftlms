"use server";

import { revalidatePath } from "next/cache";
import { getUserRole } from "@/lib/auth/utils";
import { createClient } from "@/utils/supabase/server";
import {
  ConflictType,
  DayOfWeek,
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

const DAY_SORT_ORDER: Record<DayOfWeek, number> = {
  SUNDAY: 1,
  MONDAY: 2,
  TUESDAY: 3,
  WEDNESDAY: 4,
  THURSDAY: 5,
  FRIDAY: 6,
  SATURDAY: 7,
};

const asDayOfWeek = (value: unknown): DayOfWeek => {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized in DAY_SORT_ORDER) {
    return normalized as DayOfWeek;
  }
  return "MONDAY";
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
    class_delivery_id: asString(row.class_delivery_id) ?? "",
    room_id: asString(row.room_id) ?? "",
    room_code: asString(room?.code),
    room_name: asString(room?.name),
    day: asDayOfWeek(row.day),
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

  return (data ?? []).map((raw) => {
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
    const sessions = sessionsRaw
      .map(mapSession)
      .sort((a, b) =>
        a.day === b.day
          ? a.start_time.localeCompare(b.start_time)
          : DAY_SORT_ORDER[a.day] - DAY_SORT_ORDER[b.day],
      );

    return {
      id: asString(row.id) ?? "",
      schedule_id: asString(courseAllocation?.schedule_id) ?? "",
      course_offering_id: asString(courseAllocation?.course_offering_id) ?? "",
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
      campus_name: campusNameList.length > 0 ? campusNameList.join(", ") : null,
      year_section: yearSections.length > 0 ? yearSections.join(", ") : null,
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
      major_offering:major_offering!inner(
        program_offering:program_offering!inner(campus_id)
      )
    `,
    )
    .eq("major_offering.program_offering.campus_id", campusId);

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
    .from("course_offering")
    .select(
      `
      id,
      course_id,
      course:course!inner(id, code, title, lecture_hour, laboratory_hour),
      curriculum_offering:curriculum_offering!inner(
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
    .eq("curriculum_offering.academic_term_id", termId)
    .in("curriculum_offering.curriculum_id", curriculumIds);

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
    const curriculumOffering = asObject(row.curriculum_offering);
    const curriculum = asObject(curriculumOffering?.curriculum);
    const major = asObject(curriculum?.major);
    const program = asObject(major?.program);
    const curriculumId = asString(curriculumOffering?.curriculum_id) ?? "";

    return {
      course_offering_id: asString(row.id) ?? "",
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
      major_offering:major_offering!inner(
        major:major!inner(
          code,
          name,
          program:program(code, name)
        ),
        program_offering:program_offering!inner(
          campus:campus!inner(id, name)
        )
      )
    `,
    )
    .in("major_offering.program_offering.campus_id", dedupedCampusIds);

  if (blocksError) {
    console.error(
      "lib.ftl.getOfferedCourseOptionsByTermCampuses blocks::",
      blocksError,
    );
    return [];
  }

  const blocks = (blocksRaw ?? []).map((raw) => {
    const row = raw as RowObject;
    const majorOffering = asObject(row.major_offering);
    const major = asObject(majorOffering?.major);
    const program = asObject(major?.program);
    const programCampus = asObject(majorOffering?.program_offering);
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
      .from("course_offering")
      .select(
        `
        id,
        course_id,
        course:course!inner(id, code, title, lecture_hour, laboratory_hour),
        curriculum_offering:curriculum_offering!inner(
          id,
          curriculum_id,
          academic_term_id,
          curriculum:curriculum!inner(id, title)
        )
      `,
      )
      .eq("curriculum_offering.academic_term_id", termId)
      .in("curriculum_offering.curriculum_id", curriculumIds),
    supabase
      .from("class_delivery_block")
      .select(
        `
        block_id,
        class_delivery:class_delivery!inner(
          id,
          course_allocation:course_allocation!inner(
            id,
            schedule_id,
            course_offering_id,
            schedule:schedule!inner(
            id,
            academic_term_id,
            user:user!inner(
              identity(first_name, middle_name, last_name, extension)
            )
            )
          )
        )
      `,
      )
      .eq("class_delivery.course_allocation.schedule.academic_term_id", termId)
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
    const classDelivery = asObject(row.class_delivery);
    const courseAllocation = asObject(classDelivery?.course_allocation);
    const courseOfferingId = asString(courseAllocation?.course_offering_id);
    const blockId = asString(row.block_id);
    if (!courseOfferingId || !blockId) continue;

    const schedule = asObject(courseAllocation?.schedule);
    const user = asObject(schedule?.user);
    const identity = asObject(user?.identity);
    const facultyName = formatName(
      asString(identity?.first_name),
      asString(identity?.middle_name),
      asString(identity?.last_name),
      asString(identity?.extension),
    );

    const key = `${courseOfferingId}:${blockId}`;
    const existing = takenMap.get(key) ?? [];

    if (!existing.includes(facultyName)) {
      existing.push(facultyName);
    }

    takenMap.set(key, existing);
  }

  const options: FTLOfferingOption[] = [];

  for (const rawOffering of offeringsResult.data ?? []) {
    const offering = rawOffering as RowObject;
    const curriculumOffering = asObject(offering.curriculum_offering);
    const curriculumId = asString(curriculumOffering?.curriculum_id);
    if (!curriculumId) continue;

    const curriculum = asObject(curriculumOffering?.curriculum);
    const course = asObject(offering.course);
    const courseOfferingId = asString(offering.id) ?? "";

    for (const block of blocks.filter(
      (item) => item.curriculum_id === curriculumId,
    )) {
      const key = `${courseOfferingId}:${block.id}`;
      const assignedFaculty = takenMap.get(key) ?? [];

      options.push({
        key,
        campus_id: block.campus_id,
        campus_name: block.campus_name,
        course_offering_id: courseOfferingId,
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
  course_offering_id: string;
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

  const { data: existingAllocation, error: existingAllocationError } =
    await supabase
      .from("course_allocation")
      .select("id")
      .eq("schedule_id", input.schedule_id)
      .eq("course_offering_id", input.course_offering_id)
      .maybeSingle();

  if (existingAllocationError) {
    console.error(
      "lib.ftl.createClass existingAllocation::",
      existingAllocationError,
    );
    return { error: existingAllocationError.message ?? "Unable to add class" };
  }

  let courseAllocationId = existingAllocation?.id ?? null;

  if (!courseAllocationId) {
    const { data: insertedAllocation, error: insertAllocationError } =
      await supabase
        .from("course_allocation")
        .insert({
          schedule_id: input.schedule_id,
          course_offering_id: input.course_offering_id,
        })
        .select("id")
        .single();

    if (insertAllocationError) {
      console.error(
        "lib.ftl.createClass insertAllocation::",
        insertAllocationError,
      );
      return { error: insertAllocationError.message ?? "Unable to add class" };
    }

    courseAllocationId = insertedAllocation.id;
  }

  if (input.block_id) {
    const { data: duplicateBlockLinks, error: duplicateBlockLinksError } =
      await supabase
        .from("class_delivery_block")
        .select(
          `
          block_id,
          class_delivery:class_delivery!inner(
            course_allocation:course_allocation!inner(id)
          )
        `,
        )
        .eq("class_delivery.course_allocation.id", courseAllocationId)
        .eq("block_id", input.block_id)
        .limit(1);

    if (duplicateBlockLinksError) {
      console.error(
        "lib.ftl.createClass duplicateBlockLinks::",
        duplicateBlockLinksError,
      );
      return {
        error: duplicateBlockLinksError.message ?? "Unable to validate class",
      };
    }

    if ((duplicateBlockLinks ?? []).length > 0) {
      return {
        error:
          "This course and block are already listed in Step 2 for this schedule.",
      };
    }
  }

  const { data: insertedDelivery, error: insertDeliveryError } = await supabase
    .from("class_delivery")
    .insert({
      course_allocation_id: courseAllocationId,
    })
    .select("id")
    .single();

  if (insertDeliveryError) {
    console.error("lib.ftl.createClass insertDelivery::", insertDeliveryError);
    return { error: insertDeliveryError.message ?? "Unable to add class" };
  }

  const classDeliveryId = insertedDelivery.id;

  if (input.block_id && classDeliveryId) {
    const { error: blockLinkError } = await supabase
      .from("class_delivery_block")
      .upsert(
        {
          class_delivery_id: classDeliveryId,
          block_id: input.block_id,
        },
        {
          onConflict: "class_delivery_id,block_id",
          ignoreDuplicates: true,
        },
      );

    if (blockLinkError) {
      console.error("lib.ftl.createClass blockLink::", blockLinkError);
      return { error: blockLinkError.message ?? "Unable to add class block" };
    }
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const mergeClassDeliveries = async (input: {
  schedule_id: string;
  source_class_id: string;
  target_class_id: string;
  expected_schedule_updated_at: string | null;
  force_stale_save?: boolean;
}): Promise<MutationResult> => {
  await ensureProgramChair();
  const supabase = await createClient();

  if (input.source_class_id === input.target_class_id) {
    return { error: "Source and target class must be different." };
  }

  const staleError = await assertScheduleIsFresh(
    input.schedule_id,
    input.expected_schedule_updated_at,
    Boolean(input.force_stale_save),
  );
  if (staleError) return { error: staleError };

  const { data: classesRaw, error: classesError } = await supabase
    .from("class_delivery")
    .select(
      `
      id,
      course_allocation_id,
      course_allocation:course_allocation!inner(
        id,
        schedule_id,
        course_offering:course_offering!inner(
          course:course!inner(code)
        )
      ),
      class_delivery_block(id, block_id)
    `,
    )
    .eq("course_allocation.schedule_id", input.schedule_id)
    .in("id", [input.source_class_id, input.target_class_id]);

  if (classesError) {
    console.error("lib.ftl.mergeClassDeliveries classes::", classesError);
    return { error: classesError.message ?? "Unable to load classes to merge" };
  }

  const classes = (classesRaw ?? []).map((raw) => raw as RowObject);
  if (classes.length !== 2) {
    return { error: "Unable to find source and target classes in schedule." };
  }

  const source = classes.find(
    (row) => asString(row.id) === input.source_class_id,
  );
  const target = classes.find(
    (row) => asString(row.id) === input.target_class_id,
  );

  if (!source || !target) {
    return { error: "Unable to resolve selected classes for merge." };
  }

  const sourceAllocation = asObject(source.course_allocation);
  const targetAllocation = asObject(target.course_allocation);
  const sourceOffering = asObject(sourceAllocation?.course_offering);
  const targetOffering = asObject(targetAllocation?.course_offering);
  const sourceCourse = asObject(sourceOffering?.course);
  const targetCourse = asObject(targetOffering?.course);
  const sourceCode = asString(sourceCourse?.code);
  const targetCode = asString(targetCourse?.code);

  if (!sourceCode || !targetCode || sourceCode !== targetCode) {
    return { error: "Only classes with the same course code can be merged." };
  }

  const sourceBlockLinks =
    (source.class_delivery_block as RowObject[] | undefined) ?? [];

  if (sourceBlockLinks.length === 0) {
    return { error: "Source class has no block links to merge." };
  }

  const blockRowsToInsert = sourceBlockLinks
    .map((item) => asString(item.block_id))
    .filter((item): item is string => Boolean(item))
    .map((blockId) => ({
      class_delivery_id: input.target_class_id,
      block_id: blockId,
    }));

  if (blockRowsToInsert.length > 0) {
    const { error: insertBlocksError } = await supabase
      .from("class_delivery_block")
      .upsert(blockRowsToInsert, {
        onConflict: "class_delivery_id,block_id",
        ignoreDuplicates: true,
      });

    if (insertBlocksError) {
      console.error(
        "lib.ftl.mergeClassDeliveries insertBlocks::",
        insertBlocksError,
      );
      return { error: insertBlocksError.message ?? "Unable to merge blocks" };
    }
  }

  const { error: deleteSourceSessionsError } = await supabase
    .from("session")
    .delete()
    .eq("class_delivery_id", input.source_class_id);

  if (deleteSourceSessionsError) {
    console.error(
      "lib.ftl.mergeClassDeliveries deleteSourceSessions::",
      deleteSourceSessionsError,
    );
    return {
      error:
        deleteSourceSessionsError.message ??
        "Unable to clear source sessions during merge",
    };
  }

  const { error: deleteSourceClassError } = await supabase
    .from("class_delivery")
    .delete()
    .eq("id", input.source_class_id);

  if (deleteSourceClassError) {
    console.error(
      "lib.ftl.mergeClassDeliveries deleteSourceClass::",
      deleteSourceClassError,
    );
    return {
      error:
        deleteSourceClassError.message ??
        "Unable to finalize merged class cleanup",
    };
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const unmergeClassBlock = async (input: {
  schedule_id: string;
  class_id: string;
  block_id: string;
  expected_schedule_updated_at: string | null;
  remove_sessions: boolean;
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

  const { data: classRaw, error: classError } = await supabase
    .from("class_delivery")
    .select(
      `
      id,
      course_allocation_id,
      course_allocation:course_allocation!inner(schedule_id),
      class_delivery_block(id, block_id)
    `,
    )
    .eq("id", input.class_id)
    .eq("course_allocation.schedule_id", input.schedule_id)
    .maybeSingle();

  if (classError) {
    console.error("lib.ftl.unmergeClassBlock class::", classError);
    return {
      error: classError.message ?? "Unable to load class for unmerge",
    };
  }

  if (!classRaw) {
    return { error: "Class to unmerge was not found in this schedule." };
  }

  const classRow = classRaw as RowObject;
  const courseAllocationId = asString(classRow.course_allocation_id);
  const blockLinks =
    (classRow.class_delivery_block as RowObject[] | undefined) ?? [];

  if (!courseAllocationId) {
    return { error: "Class is missing allocation reference." };
  }

  if (blockLinks.length <= 1) {
    return { error: "This class has only one block and cannot be unmerged." };
  }

  const blockLinkToMove = blockLinks.find(
    (item) => asString(item.block_id) === input.block_id,
  );

  if (!blockLinkToMove) {
    return { error: "Selected block is not linked to this class." };
  }

  const { data: newClass, error: createClassError } = await supabase
    .from("class_delivery")
    .insert({
      course_allocation_id: courseAllocationId,
    })
    .select("id")
    .single();

  if (createClassError) {
    console.error("lib.ftl.unmergeClassBlock createClass::", createClassError);
    return {
      error: createClassError.message ?? "Unable to create unmerged class",
    };
  }

  const { error: moveBlockError } = await supabase
    .from("class_delivery_block")
    .update({ class_delivery_id: newClass.id })
    .eq("id", asString(blockLinkToMove.id) ?? "");

  if (moveBlockError) {
    console.error("lib.ftl.unmergeClassBlock moveBlock::", moveBlockError);
    return { error: moveBlockError.message ?? "Unable to move block" };
  }

  if (input.remove_sessions) {
    const { error: deleteSessionsError } = await supabase
      .from("session")
      .delete()
      .eq("class_delivery_id", input.class_id);

    if (deleteSessionsError) {
      console.error(
        "lib.ftl.unmergeClassBlock deleteSessions::",
        deleteSessionsError,
      );
      return {
        error:
          deleteSessionsError.message ??
          "Unable to remove sessions during unmerge",
      };
    }
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const updateClass = async (input: {
  class_id: string;
  schedule_id: string;
  course_offering_id: string;
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

  const { data: classDelivery, error: classDeliveryError } = await supabase
    .from("class_delivery")
    .select("course_allocation_id")
    .eq("id", input.class_id)
    .maybeSingle();

  if (classDeliveryError || !classDelivery?.course_allocation_id) {
    return { error: classDeliveryError?.message ?? "Class delivery not found" };
  }

  const { error } = await supabase
    .from("course_allocation")
    .update({
      course_offering_id: input.course_offering_id,
    })
    .eq("id", classDelivery.course_allocation_id);

  if (error) {
    console.error("lib.ftl.updateClass ::", error);
    return { error: error.message ?? "Unable to update class" };
  }

  if (input.block_id) {
    const { error: blockLinkError } = await supabase
      .from("class_delivery_block")
      .upsert(
        {
          class_delivery_id: input.class_id,
          block_id: input.block_id,
        },
        {
          onConflict: "class_delivery_id,block_id",
          ignoreDuplicates: true,
        },
      );

    if (blockLinkError) {
      console.error("lib.ftl.updateClass blockLink::", blockLinkError);
      return {
        error: blockLinkError.message ?? "Unable to update class block",
      };
    }
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
    .from("class_delivery")
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

export const deleteClassesByCourseOffering = async (input: {
  schedule_id: string;
  course_offering_id: string;
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

  const { data: allocations, error: allocationsError } = await supabase
    .from("course_allocation")
    .select("id")
    .eq("schedule_id", input.schedule_id)
    .eq("course_offering_id", input.course_offering_id);

  if (allocationsError) {
    console.error(
      "lib.ftl.deleteClassesByCourseOffering allocations::",
      allocationsError,
    );
    return {
      error:
        allocationsError.message ?? "Unable to remove course from schedule",
    };
  }

  const allocationIds = (allocations ?? [])
    .map((item) => item.id)
    .filter((item): item is string => Boolean(item));

  if (allocationIds.length === 0) {
    return { error: null };
  }

  const { error: deleteDeliveryError } = await supabase
    .from("class_delivery")
    .delete()
    .in("course_allocation_id", allocationIds);

  if (deleteDeliveryError) {
    console.error(
      "lib.ftl.deleteClassesByCourseOffering class_delivery::",
      deleteDeliveryError,
    );
    return {
      error: deleteDeliveryError.message ?? "Unable to remove class delivery",
    };
  }

  const { error: deleteAllocationError } = await supabase
    .from("course_allocation")
    .delete()
    .in("id", allocationIds);

  if (deleteAllocationError) {
    console.error(
      "lib.ftl.deleteClassesByCourseOffering course_allocation::",
      deleteAllocationError,
    );
    return {
      error:
        deleteAllocationError.message ?? "Unable to remove course allocation",
    };
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const pruneScheduleByCampuses = async (input: {
  schedule_id: string;
  campus_ids: string[];
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

  const keptCampusIds = new Set(input.campus_ids.filter(Boolean));

  const { data: deliveriesRaw, error: deliveriesError } = await supabase
    .from("class_delivery")
    .select(
      `
      id,
      course_allocation:course_allocation!inner(schedule_id),
      class_delivery_block(
        id,
        block:block!inner(
          major_offering:major_offering!inner(
            program_offering:program_offering!inner(campus_id)
          )
        )
      )
    `,
    )
    .eq("course_allocation.schedule_id", input.schedule_id);

  if (deliveriesError) {
    console.error(
      "lib.ftl.pruneScheduleByCampuses deliveries::",
      deliveriesError,
    );
    return {
      error: deliveriesError.message ?? "Unable to prune schedule by campus",
    };
  }

  const blockLinkIdsToDelete: string[] = [];
  const classDeliveryIdsToDelete: string[] = [];

  for (const raw of deliveriesRaw ?? []) {
    const row = raw as RowObject;
    const classDeliveryId = asString(row.id);
    if (!classDeliveryId) continue;

    const blockLinks =
      (row.class_delivery_block as RowObject[] | undefined) ?? [];

    let hasKeptCampus = false;

    for (const link of blockLinks) {
      const linkId = asString(link.id);
      const block = asObject(link.block);
      const majorOffering = asObject(block?.major_offering);
      const programOffering = asObject(majorOffering?.program_offering);
      const campusId = asString(programOffering?.campus_id);

      if (campusId && keptCampusIds.has(campusId)) {
        hasKeptCampus = true;
      } else if (linkId) {
        blockLinkIdsToDelete.push(linkId);
      }
    }

    if (!hasKeptCampus || keptCampusIds.size === 0) {
      classDeliveryIdsToDelete.push(classDeliveryId);
    }
  }

  if (blockLinkIdsToDelete.length > 0) {
    const { error: deleteLinksError } = await supabase
      .from("class_delivery_block")
      .delete()
      .in("id", blockLinkIdsToDelete);

    if (deleteLinksError) {
      console.error(
        "lib.ftl.pruneScheduleByCampuses delete links::",
        deleteLinksError,
      );
      return {
        error:
          deleteLinksError.message ??
          "Unable to remove campus-related class links",
      };
    }
  }

  if (classDeliveryIdsToDelete.length > 0) {
    const { error: deleteDeliveriesError } = await supabase
      .from("class_delivery")
      .delete()
      .in("id", classDeliveryIdsToDelete);

    if (deleteDeliveriesError) {
      console.error(
        "lib.ftl.pruneScheduleByCampuses delete deliveries::",
        deleteDeliveriesError,
      );
      return {
        error:
          deleteDeliveriesError.message ??
          "Unable to remove campus-related classes",
      };
    }
  }

  const [
    { data: allocationRows, error: allocationError },
    { data: activeDeliveries, error: activeDeliveriesError },
  ] = await Promise.all([
    supabase
      .from("course_allocation")
      .select("id")
      .eq("schedule_id", input.schedule_id),
    supabase
      .from("class_delivery")
      .select(
        "course_allocation_id, course_allocation:course_allocation!inner(schedule_id)",
      )
      .eq("course_allocation.schedule_id", input.schedule_id),
  ]);

  if (allocationError || activeDeliveriesError) {
    console.error(
      "lib.ftl.pruneScheduleByCampuses cleanup::",
      allocationError ?? activeDeliveriesError,
    );
    return {
      error:
        allocationError?.message ??
        activeDeliveriesError?.message ??
        "Unable to clean course allocations",
    };
  }

  const referencedAllocationIds = new Set(
    (activeDeliveries ?? [])
      .map((item) => item.course_allocation_id)
      .filter((item): item is string => Boolean(item)),
  );

  const orphanAllocationIds = (allocationRows ?? [])
    .map((item) => item.id)
    .filter((item): item is string => Boolean(item))
    .filter((item) => !referencedAllocationIds.has(item));

  if (orphanAllocationIds.length > 0) {
    const { error: deleteOrphanError } = await supabase
      .from("course_allocation")
      .delete()
      .in("id", orphanAllocationIds);

    if (deleteOrphanError) {
      console.error(
        "lib.ftl.pruneScheduleByCampuses delete orphans::",
        deleteOrphanError,
      );
      return {
        error:
          deleteOrphanError.message ??
          "Unable to remove orphan course allocations",
      };
    }
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
        day: asDayOfWeek(row.day),
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
      day: asDayOfWeek(dataRow.day),
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
