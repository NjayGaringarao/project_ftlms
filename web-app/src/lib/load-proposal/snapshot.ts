import type { UserDataReadModel } from "@/lib/user-data/types";
import type {
  Degree,
  ProposalDegreeItem,
  ProposalDesignationItem,
  ProposalScheduleSessionItem,
  SessionDay,
  SessionType,
} from "@/models";
import { calculateLaboratoryContactHours } from "@/lib/course-loading/calculations";
import { createClient } from "@/utils/supabase/server";

export type FacultyLoadSnapshot = {
  employment_status: string | null;
  academic_rank: string | null;
  bachelors_degree: ProposalDegreeItem[];
  masters_degree: ProposalDegreeItem[];
  doctorate_degree: ProposalDegreeItem[];
  designations: ProposalDesignationItem[];
  schedule_sessions: ProposalScheduleSessionItem[];
  equivalent_teaching_load: number;
  total_lecture_hours: number;
  total_lab_hours: number;
  preparation_count: number;
  actual_teaching_load: number;
  advisory_class: string | null;
};

type BuildFacultyLoadSnapshotInput = {
  userData: UserDataReadModel;
  userId: string;
  academicTermId: string;
};

type ProgramOfferingContext = {
  program_offering_code: string | null;
  campus_code: string | null;
  college_code: string | null;
};

const DAY_ORDER: Record<SessionDay, number> = {
  Sunday: 1,
  Monday: 2,
  Tuesday: 3,
  Wednesday: 4,
  Thursday: 5,
  Friday: 6,
  Saturday: 7,
};

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const toNonEmptyText = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toMinutes = (value: string): number => {
  const [rawHour = "0", rawMinute = "0"] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  return hour * 60 + minute;
};

const toDegreeItems = (
  degrees: Degree[],
  level: Degree["academic_level"],
): ProposalDegreeItem[] => {
  const matches = degrees
    .filter((degree) => degree.academic_level === level)
    .filter((degree) => Boolean(toNonEmptyText(degree.title)));
  if (matches.length === 0) return [];

  const sorted = [...matches].sort((a, b) => {
    if (a.year_graduated === null && b.year_graduated !== null) return 1;
    if (a.year_graduated !== null && b.year_graduated === null) return -1;

    if (
      a.year_graduated !== null &&
      b.year_graduated !== null &&
      a.year_graduated !== b.year_graduated
    ) {
      return b.year_graduated - a.year_graduated;
    }

    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });

  return sorted.map((degree) => ({
    title: degree.title.trim(),
    year_graduated: degree.year_graduated,
  }));
};

const toDegreeDisplayLabel = (item: ProposalDegreeItem): string => {
  const suffix = item.year_graduated === null ? " (ongoing)" : "";
  return `${item.title}${suffix}`;
};

export const formatProposalDegreeItems = (
  items: ProposalDegreeItem[] | null | undefined,
  joiner = "\n",
): string => {
  const values = (items ?? []).map(toDegreeDisplayLabel);
  return values.length > 0 ? values.join(joiner) : "-";
};

const toDesignationDisplayLabel = (item: ProposalDesignationItem): string => {
  const codes = [
    item.campus_code,
    item.college_code,
    item.program_offering_code,
  ].filter((value): value is string => Boolean(toNonEmptyText(value)));

  if (codes.length === 0) return item.job_title;
  return `${item.job_title} - ${codes.join(" ")}`;
};

export const formatProposalDesignationItems = (
  items: ProposalDesignationItem[] | null | undefined,
  joiner = "\n",
): string => {
  const values = (items ?? []).map(toDesignationDisplayLabel);
  return values.length > 0 ? values.join(joiner) : "-";
};

const getCodeMap = async (
  table: "campus" | "college",
  ids: string[],
): Promise<Map<string, string>> => {
  if (ids.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select("id, code")
    .in("id", ids);

  if (error) {
    console.error(`loadProposal.snapshot.getCodeMap.${table} ::`, error);
    return new Map();
  }

  return new Map(
    (data ?? [])
      .map((row) => [row.id, row.code] as const)
      .filter((row): row is readonly [string, string] => Boolean(row[0] && row[1])),
  );
};

const getProgramOfferingContextMap = async (
  ids: string[],
): Promise<Map<string, ProgramOfferingContext>> => {
  if (ids.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_offering")
    .select(
      `
      id,
      code,
      campus:campus_id (code),
      program:program_id (
        college:college_id (code)
      )
    `,
    )
    .in("id", ids);

  if (error) {
    console.error("loadProposal.snapshot.getProgramOfferingContextMap ::", error);
    return new Map();
  }

  return new Map(
    (data ?? []).map((row) => {
      const campus = first(row.campus as { code?: string | null } | Array<{ code?: string | null }> | null);
      const program = first(
        row.program as
          | { college?: { code?: string | null } | Array<{ code?: string | null }> | null }
          | Array<{
              college?: { code?: string | null } | Array<{ code?: string | null }> | null;
            }>
          | null,
      );
      const college = first(
        program?.college as
          | { code?: string | null }
          | Array<{ code?: string | null }>
          | null,
      );

      return [
        row.id,
        {
          program_offering_code: toNonEmptyText(row.code),
          campus_code: toNonEmptyText(campus?.code),
          college_code: toNonEmptyText(college?.code),
        },
      ] as const;
    }),
  );
};

const buildDesignationItems = async (
  userData: UserDataReadModel,
): Promise<ProposalDesignationItem[]> => {
  const designations = userData.designations ?? [];
  if (designations.length === 0) return [];

  const campusIds = Array.from(
    new Set(
      designations
        .map((designation) => designation.campus_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const collegeIds = Array.from(
    new Set(
      designations
        .map((designation) => designation.college_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const programOfferingIds = Array.from(
    new Set(
      designations
        .map((designation) => designation.program_offering_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [campusCodeById, collegeCodeById, programOfferingContextById] =
    await Promise.all([
      getCodeMap("campus", campusIds),
      getCodeMap("college", collegeIds),
      getProgramOfferingContextMap(programOfferingIds),
    ]);

  return designations
    .map((designation) => {
      const jobTitle = toNonEmptyText(designation.job_title);
      if (!jobTitle) return null;

      const programOfferingContext = designation.program_offering_id
        ? programOfferingContextById.get(designation.program_offering_id) ?? null
        : null;

      const campusCode =
        toNonEmptyText(designation.campus?.code) ??
        (designation.campus_id
          ? toNonEmptyText(campusCodeById.get(designation.campus_id))
          : null) ??
        programOfferingContext?.campus_code ??
        null;

      const collegeCode =
        toNonEmptyText(designation.college?.code) ??
        (designation.college_id
          ? toNonEmptyText(collegeCodeById.get(designation.college_id))
          : null) ??
        programOfferingContext?.college_code ??
        null;

      const programOfferingCode =
        toNonEmptyText(
          (designation.program_offering as { code?: string | null } | null)?.code,
        ) ??
        programOfferingContext?.program_offering_code ??
        null;

      return {
        job_title: jobTitle,
        campus_code: campusCode,
        college_code: collegeCode,
        program_offering_code: programOfferingCode,
      } as ProposalDesignationItem;
    })
    .filter((designation): designation is ProposalDesignationItem => Boolean(designation));
};

type RawSessionRow = {
  id?: string | null;
  day?: SessionDay | null;
  start_time?: string | null;
  end_time?: string | null;
  type?: SessionType | null;
  room_id?: string | null;
  room?:
    | {
        code?: string | null;
        name?: string | null;
      }
    | Array<{
        code?: string | null;
        name?: string | null;
      }>
    | null;
};

type RawClassRow = {
  id?: string | null;
  course_utilization?: Array<{
    id?: string | null;
    course?:
      | {
          code?: string | null;
          title?: string | null;
        }
      | Array<{
          code?: string | null;
          title?: string | null;
        }>
      | null;
    block?:
      | {
          id?: string | null;
          code?: string | null;
          year_level?: number | null;
          section?: string | null;
          student_count?: number | null;
        }
      | Array<{
          id?: string | null;
          code?: string | null;
          year_level?: number | null;
          section?: string | null;
          student_count?: number | null;
        }>
      | null;
  }> | null;
  session_class?: Array<{
    session?: RawSessionRow | RawSessionRow[] | null;
  }> | null;
};

const getRawScheduleSessions = async (
  userId: string,
  academicTermId: string,
): Promise<ProposalScheduleSessionItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_class")
    .select(
      `
      class:class_id(
        id,
        course_utilization(
          id,
          course:course_id(code, title),
          block:block_id(id, code, year_level, section, student_count)
        ),
        session_class(
          session:session_id(
            id,
            day,
            start_time,
            end_time,
            type,
            room_id,
            room:room_id(code, name)
          )
        )
      )
      `,
    )
    .eq("user_id", userId)
    .eq("class.course_utilization.block.academic_term_id", academicTermId);

  if (error) {
    console.error("loadProposal.snapshot.getRawScheduleSessions ::", error);
    return [];
  }

  const classRows = (data ?? []).flatMap((row) => {
    const cls = row.class as RawClassRow | RawClassRow[] | null | undefined;
    if (!cls) return [];
    return Array.isArray(cls) ? cls : [cls];
  });

  const snapshotRows: ProposalScheduleSessionItem[] = [];

  classRows.forEach((classRow) => {
    const classId = toNonEmptyText(classRow.id) ?? "";
    const utilizations = classRow.course_utilization ?? [];
    const sessions = (classRow.session_class ?? [])
      .map((item) => first(item.session))
      .filter((session): session is RawSessionRow => Boolean(session));

    if (!classId || utilizations.length === 0 || sessions.length === 0) return;

    utilizations.forEach((utilization) => {
      const course = first(utilization.course);
      const block = first(utilization.block);
      const courseUtilizationId = toNonEmptyText(utilization.id);
      const blockId = toNonEmptyText(block?.id);
      const blockCode = toNonEmptyText(block?.code);
      const section = toNonEmptyText(block?.section);
      const dayRows = sessions;

      if (!courseUtilizationId || !blockId || !blockCode || !section) return;

      dayRows.forEach((session) => {
        const sessionId = toNonEmptyText(session.id);
        const startTime = toNonEmptyText(session.start_time);
        const endTime = toNonEmptyText(session.end_time);
        const type = session.type ?? null;
        const day = session.day ?? null;

        if (!sessionId || !startTime || !endTime || !type || !day) return;

        const room = first(session.room);
        snapshotRows.push({
          session_id: sessionId,
          class_id: classId,
          course_utilization_id: courseUtilizationId,
          course_code: toNonEmptyText(course?.code) ?? "Unknown",
          course_title: toNonEmptyText(course?.title) ?? "Untitled Course",
          day,
          start_time: startTime,
          end_time: endTime,
          type,
          room_id: toNonEmptyText(session.room_id),
          room_code: toNonEmptyText(room?.code),
          room_name: toNonEmptyText(room?.name),
          block_id: blockId,
          block_code: blockCode,
          year_level: Math.max(0, Math.round(toNumber(block?.year_level))),
          section,
          student_count:
            block?.student_count === null || block?.student_count === undefined
              ? null
              : Math.max(0, Math.round(toNumber(block.student_count))),
        });
      });
    });
  });

  return [...snapshotRows].sort((left, right) => {
    const dayDiff = (DAY_ORDER[left.day] ?? 999) - (DAY_ORDER[right.day] ?? 999);
    if (dayDiff !== 0) return dayDiff;

    const startDiff = toMinutes(left.start_time) - toMinutes(right.start_time);
    if (startDiff !== 0) return startDiff;

    const courseDiff = left.course_code.localeCompare(right.course_code);
    if (courseDiff !== 0) return courseDiff;

    return left.block_code.localeCompare(right.block_code);
  });
};

export const buildFacultyLoadSnapshot = async ({
  userData,
  userId,
  academicTermId,
}: BuildFacultyLoadSnapshotInput): Promise<FacultyLoadSnapshot> => {
  const lectureSum = userData.classes.reduce(
    (sum, cls) => sum + Number(cls.lecture_unit ?? 0),
    0,
  );
  const labSum = userData.classes.reduce(
    (sum, cls) =>
      sum + calculateLaboratoryContactHours(Number(cls.laboratory_unit ?? 0)),
    0,
  );

  const preparationCount = new Set(
    userData.classes.map((cls) => cls.course_code).filter(Boolean),
  ).size;

  const [designations, scheduleSessions] = await Promise.all([
    buildDesignationItems(userData),
    getRawScheduleSessions(userId, academicTermId),
  ]);

  return {
    employment_status: userData.employmentStatus,
    academic_rank: userData.rank?.title ?? null,
    bachelors_degree: toDegreeItems(userData.degrees, "Bachelor's Degree"),
    masters_degree: toDegreeItems(userData.degrees, "Master's Degree"),
    doctorate_degree: toDegreeItems(userData.degrees, "Doctorate Degree"),
    designations,
    schedule_sessions: scheduleSessions,
    equivalent_teaching_load: userData.designationLoad,
    total_lecture_hours: lectureSum,
    total_lab_hours: labSum,
    preparation_count: preparationCount,
    actual_teaching_load: userData.actualTeachingLoad,
    advisory_class: null,
  };
};
