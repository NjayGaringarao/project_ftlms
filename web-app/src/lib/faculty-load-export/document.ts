import { getUserRole } from "@/lib/auth/utils";
import { getTermById } from "@/lib/admin/terms";
import { getLatestProposalByUserTerm } from "@/lib/load-proposal/queries";
import {
  formatLatestProposalDegreeItem,
  formatProposalDesignationItems,
} from "@/lib/load-proposal/snapshot";
import type { FacultyScheduleRow } from "@/lib/schedule/types";
import { mergeBlockLabels, sortScheduleRows, toMinutes } from "@/lib/schedule/utils";
import type { ProposalScheduleSessionItem } from "@/models";
import { getCurrentUserData } from "@/lib/user-data/queries";
import { getUserOverviewById } from "@/lib/user-overview";
import { createClient } from "@/utils/supabase/server";

type FacultyLoadExportInput = {
  academicTermId: string;
  facultyId: string;
};

type FacultyLoadExportSignatorySlot = {
  name: string | null;
  title: string;
};

export type FacultyLoadExportDocument = {
  facultyId: string;
  academicTermId: string;
  termCode: string;
  termDisplayName: string;
  academicYearDisplay: string;
  facultyName: string;
  campusName: string;
  campusAddress: string;
  collegeName: string;
  employmentStatus: string;
  academicRank: string;
  bachelorsDegree: string;
  mastersDegree: string;
  doctorateDegree: string;
  designations: string;
  advisoryClass: string;
  equivalentTeachingLoad: number;
  totalLectureHours: number;
  totalLabHours: number;
  preparationCount: number;
  equivalentPrepUnits: number;
  actualTeachingLoad: number;
  totalWorkingLoad: number;
  excess24: number;
  scheduleRows: FacultyScheduleRow[];
  signatories: {
    preparedBy: FacultyLoadExportSignatorySlot;
    recommendingApproval: FacultyLoadExportSignatorySlot;
    approvedBy: FacultyLoadExportSignatorySlot;
  };
};

type RawDesignationHolder = {
  id?: string | null;
  identity?:
    | {
        name?: string | null;
      }
    | Array<{
        name?: string | null;
      }>
    | null;
};

type RawDesignationRow = {
  id: string;
  job_title: string;
  designated_at: string | null;
  holder?: RawDesignationHolder | RawDesignationHolder[] | null;
};

const PRIVILEGED_EXPORT_ROLES = new Set([
  "Admin",
  "Program Chairperson",
  "College Dean",
]);

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toFixed = (value: number): number => Number(value.toFixed(2));

const SESSION_DAY_ORDER: Record<ProposalScheduleSessionItem["day"], number> = {
  Sunday: 1,
  Monday: 2,
  Tuesday: 3,
  Wednesday: 4,
  Thursday: 5,
  Friday: 6,
  Saturday: 7,
};

const toNonEmptyText = (
  value: string | null | undefined,
  fallback = "-",
): string => {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
};

const toNullableText = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const toTermDisplayName = (rawTermName: string): string => {
  const normalized = rawTermName.toUpperCase();
  if (normalized === "FIRST SEMESTER") return "1st Semester";
  if (normalized === "SECOND SEMESTER") return "2nd Semester";
  if (normalized === "MIDYEAR") return "Midyear";
  return rawTermName;
};

const toScheduleSessions = (
  value: unknown,
): ProposalScheduleSessionItem[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Partial<ProposalScheduleSessionItem>;
      const sessionId = toNonEmptyText(row.session_id ?? null, "");
      const classId = toNonEmptyText(row.class_id ?? null, "");
      const courseUtilizationId = toNonEmptyText(row.course_utilization_id ?? null, "");
      const courseCode = toNonEmptyText(row.course_code ?? null, "Unknown");
      const courseTitle = toNonEmptyText(row.course_title ?? null, "Untitled Course");
      const day = toNonEmptyText(row.day ?? null, "");
      const startTime = toNonEmptyText(row.start_time ?? null, "");
      const endTime = toNonEmptyText(row.end_time ?? null, "");
      const type = toNonEmptyText(row.type ?? null, "");
      const blockId = toNonEmptyText(row.block_id ?? null, "");
      const blockCode = toNonEmptyText(row.block_code ?? null, "");
      const section = toNonEmptyText(row.section ?? null, "");

      if (
        !sessionId ||
        !classId ||
        !courseUtilizationId ||
        !day ||
        !startTime ||
        !endTime ||
        !type ||
        !blockId ||
        !blockCode ||
        !section
      ) {
        return null;
      }

      return {
        session_id: sessionId,
        class_id: classId,
        course_utilization_id: courseUtilizationId,
        course_code: courseCode,
        course_title: courseTitle,
        day: row.day as ProposalScheduleSessionItem["day"],
        start_time: startTime,
        end_time: endTime,
        type: row.type as ProposalScheduleSessionItem["type"],
        room_id: toNullableText(row.room_id ?? null),
        room_code: toNullableText(row.room_code ?? null),
        room_name: toNullableText(row.room_name ?? null),
        block_id: blockId,
        block_code: blockCode,
        year_level: Math.max(0, Math.round(toNumber(row.year_level))),
        section,
        student_count:
          row.student_count === null || row.student_count === undefined
            ? null
            : Math.max(0, Math.round(toNumber(row.student_count))),
      } satisfies ProposalScheduleSessionItem;
    })
    .filter((item): item is ProposalScheduleSessionItem => Boolean(item));
};

const toScheduleHours = (startTime: string, endTime: string): number => {
  const minutes = Math.max(toMinutes(endTime) - toMinutes(startTime), 0);
  return Number((minutes / 60).toFixed(2));
};

const toRoomLabel = (session: ProposalScheduleSessionItem): string | null => {
  if (!session.room_code && !session.room_name) return null;
  if (!session.room_code) return session.room_name ?? null;
  if (!session.room_name) return session.room_code;
  return session.room_code;
};

const toDisplayScheduleRows = (
  sessions: ProposalScheduleSessionItem[],
): FacultyScheduleRow[] => {
  const groupedByClass = new Map<string, ProposalScheduleSessionItem[]>();
  sessions.forEach((session) => {
    const rows = groupedByClass.get(session.class_id);
    if (rows) {
      rows.push(session);
      return;
    }
    groupedByClass.set(session.class_id, [session]);
  });

  const rows: FacultyScheduleRow[] = [];

  groupedByClass.forEach((classSessions, classId) => {
    if (classSessions.length === 0) {
      return;
    }

    const firstSession = classSessions[0]!;
    const seenBlocks = new Set<string>();
    const uniqueBlockRows = classSessions.filter((session) => {
      const dedupeKey = session.block_id.trim() || session.block_code.trim();
      if (!dedupeKey) return true;
      if (seenBlocks.has(dedupeKey)) return false;
      seenBlocks.add(dedupeKey);
      return true;
    });

    const blockCodes = Array.from(
      new Set(
        uniqueBlockRows
          .map((session) => session.block_code.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const studentCount = uniqueBlockRows.reduce(
      (sum, session) => sum + Number(session.student_count ?? 0),
      0,
    );
    const mergedBlockCodeLabel = mergeBlockLabels(blockCodes);

    const groupedSessions = new Map<
      string,
      { representative: ProposalScheduleSessionItem; days: Set<ProposalScheduleSessionItem["day"]> }
    >();

    classSessions.forEach((session) => {
      const roomMergeKey = session.room_id
        ? `id:${session.room_id}`
        : `label:${session.room_code ?? ""}:${session.room_name ?? ""}`;
      const sessionGroupKey = [
        session.type,
        session.start_time,
        session.end_time,
        roomMergeKey,
      ].join("|");

      const existingGroup = groupedSessions.get(sessionGroupKey);
      if (!existingGroup) {
        groupedSessions.set(sessionGroupKey, {
          representative: session,
          days: new Set([session.day]),
        });
        return;
      }

      existingGroup.days.add(session.day);

      const existingDayOrder = SESSION_DAY_ORDER[existingGroup.representative.day];
      const currentDayOrder = SESSION_DAY_ORDER[session.day];
      if (currentDayOrder < existingDayOrder) {
        existingGroup.representative = session;
      }
    });

    const compressedRows = Array.from(groupedSessions.values()).map((group) => {
      const sessionDays = Array.from(group.days).sort(
        (left, right) => SESSION_DAY_ORDER[left] - SESSION_DAY_ORDER[right],
      );
      const representativeSession = {
        ...group.representative,
        day: sessionDays[0] ?? group.representative.day,
      };
      const sessionHours = Number(
        (toScheduleHours(
          representativeSession.start_time,
          representativeSession.end_time,
        ) * sessionDays.length).toFixed(2),
      );
      const roomLabel = toRoomLabel(representativeSession);
      const isLecture = representativeSession.type === "Lecture";

      return {
        row_id: `${classId}:${representativeSession.type}:${representativeSession.start_time}:${representativeSession.end_time}:${roomLabel ?? ""}:${sessionDays.join(",")}`,
        class_id: classId,
        primary_block_id: firstSession.block_id,
        primary_course_utilization_id: firstSession.course_utilization_id,
        course_code: firstSession.course_code,
        course_title: firstSession.course_title,
        block_codes_label: mergedBlockCodeLabel,
        student_count: studentCount > 0 ? studentCount : null,
        lecture_hours: isLecture ? sessionHours : null,
        lecture_room: isLecture ? roomLabel : null,
        laboratory_hours: !isLecture ? sessionHours : null,
        laboratory_room: !isLecture ? roomLabel : null,
        session_days: sessionDays,
        session: {
          id: representativeSession.session_id,
          day: representativeSession.day,
          start_time: representativeSession.start_time,
          end_time: representativeSession.end_time,
          type: representativeSession.type,
          room_id: representativeSession.room_id,
          room_code: representativeSession.room_code,
          room_name: representativeSession.room_name,
        },
      } satisfies FacultyScheduleRow;
    });

    rows.push(...compressedRows);
  });

  return sortScheduleRows(rows);
};

const resolveDesignationName = (row: RawDesignationRow | null): string | null => {
  if (!row) return null;

  const holder = first(row.holder);
  const identity = holder ? first(holder.identity) : null;
  const name = identity?.name;
  return typeof name === "string" && name.trim().length > 0 ? name.trim() : null;
};

const getLatestSignatoryByTitle = async (
  jobTitle: string,
  campusId?: string | null,
): Promise<string | null> => {
  const supabase = await createClient();

  let query = supabase
    .from("designation")
    .select(
      `
      id,
      job_title,
      designated_at,
      holder:user_id (
        id,
        identity:identity (name)
      )
    `,
    )
    .eq("job_title", jobTitle)
    .order("designated_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1);

  if (campusId === undefined) {
    // No campus scope filter.
  } else if (campusId === null) {
    query = query.is("campus_id", null);
  } else {
    query = query.eq("campus_id", campusId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("facultyLoadExport.getLatestSignatoryByTitle ::", error);
    return null;
  }

  return resolveDesignationName((data as RawDesignationRow | null) ?? null);
};

const assertCanAccessFacultyLoadExport = async (
  facultyCampusId: string | null,
): Promise<void> => {
  const roles = await getUserRole();

  if (roles.some((role) => PRIVILEGED_EXPORT_ROLES.has(role))) {
    return;
  }

  if (!roles.includes("Campus Director") || !facultyCampusId) {
    throw new FacultyLoadExportError(403, "You are not allowed to export this document.");
  }

  const currentUserData = await getCurrentUserData({ includeDesignations: true });
  const hasMatchingCampusDesignation = (currentUserData?.designations ?? []).some(
    (designation) =>
      designation.job_title === "Campus Director" &&
      designation.campus_id === facultyCampusId,
  );

  if (!hasMatchingCampusDesignation) {
    throw new FacultyLoadExportError(403, "You are not allowed to export this document.");
  }
};

export class FacultyLoadExportError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "FacultyLoadExportError";
  }
}

export const isFacultyLoadExportError = (
  value: unknown,
): value is FacultyLoadExportError => value instanceof FacultyLoadExportError;

export const getFacultyLoadExportDocument = async ({
  academicTermId,
  facultyId,
}: FacultyLoadExportInput): Promise<FacultyLoadExportDocument> => {
  const [overview, proposal, term] = await Promise.all([
    getUserOverviewById(facultyId),
    getLatestProposalByUserTerm(facultyId, academicTermId),
    getTermById(academicTermId),
  ]);

  if (!overview) {
    throw new FacultyLoadExportError(404, "Faculty not found.");
  }

  await assertCanAccessFacultyLoadExport(overview.campus_id);

  if (!term) {
    throw new FacultyLoadExportError(404, "Academic term not found.");
  }

  if (!proposal) {
    throw new FacultyLoadExportError(404, "No proposal found for this faculty and term.");
  }

  const [preparedByName, recommendingApprovalName, approvedByName] =
    await Promise.all([
      getLatestSignatoryByTitle("Campus Director", overview.campus_id),
      getLatestSignatoryByTitle("Director for Instruction", null),
      getLatestSignatoryByTitle("Vice President for Academic Affairs", null),
    ]);

  const equivalentTeachingLoad = toFixed(toNumber(proposal.equivalent_teaching_load));
  const totalLectureHours = toFixed(toNumber(proposal.total_lecture_hours));
  const totalLabHours = toFixed(toNumber(proposal.total_lab_hours));
  const preparationCount = Math.max(0, Math.round(toNumber(proposal.preparation_count)));
  const equivalentPrepUnits = toFixed(preparationCount * 0.5);
  const actualTeachingLoad = toFixed(toNumber(proposal.actual_teaching_load));
  const totalWorkingLoad = toFixed(equivalentTeachingLoad + actualTeachingLoad);
  const excess24 = toFixed(Math.max(totalWorkingLoad - 24, 0));
  const scheduleRows = toDisplayScheduleRows(
    toScheduleSessions(proposal.schedule_sessions),
  );

  return {
    facultyId,
    academicTermId,
    termCode: term.code,
    termDisplayName: toTermDisplayName(term.name),
    academicYearDisplay: `${term.academic_year.start_year}-${term.academic_year.end_year}`,
    facultyName: toNonEmptyText(overview.identity?.name, "Unknown Faculty"),
    campusName: toNonEmptyText(overview.campus?.name),
    campusAddress: toNonEmptyText(overview.campus?.address),
    collegeName: toNonEmptyText(overview.college?.name),
    employmentStatus: toNonEmptyText(proposal.employment_status),
    academicRank: toNonEmptyText(proposal.academic_rank),
    bachelorsDegree: formatLatestProposalDegreeItem(proposal.bachelors_degree),
    mastersDegree: formatLatestProposalDegreeItem(proposal.masters_degree),
    doctorateDegree: formatLatestProposalDegreeItem(proposal.doctorate_degree),
    designations: formatProposalDesignationItems(proposal.designations),
    advisoryClass: toNonEmptyText(proposal.advisory_class),
    equivalentTeachingLoad,
    totalLectureHours,
    totalLabHours,
    preparationCount,
    equivalentPrepUnits,
    actualTeachingLoad,
    totalWorkingLoad,
    excess24,
    scheduleRows,
    signatories: {
      preparedBy: {
        name: preparedByName,
        title: "Campus Director",
      },
      recommendingApproval: {
        name: recommendingApprovalName,
        title: "Director for Instruction",
      },
      approvedBy: {
        name: approvedByName,
        title: "Vice President for Academic Affairs",
      },
    },
  };
};
