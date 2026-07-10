"use server";

import type {
  CampusCollegeLoadStatus,
  CampusCollegeLoadStep,
} from "@/features/shared/types/models/campus_college_load";
import { createClient } from "@/utils/supabase/server";
import { FtlStatusItem, LabelValue } from "./types";

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

export type SectionRollupRow = {
  sectionId: string;
  sectionLabel: string;
  yearLevel: number;
  studentCount: number;
  programOfferingId: string | null;
  campusId: string | null;
  campusLabel: string;
  collegeId: string | null;
  collegeLabel: string;
};

type SectionRollupFilters = {
  campusId?: string;
  collegeId?: string;
  programOfferingIds?: string[];
};

type RawSectionRow = {
  id: string;
  code: string | null;
  name: string | null;
  year_level: number | null;
  student_count: number | null;
  major_offering:
    | {
        program_offering:
          | {
              id: string;
              campus_id: string | null;
              campus: { code?: string | null; name?: string | null } | null;
              program:
                | {
                    college_id: string | null;
                    college: {
                      code?: string | null;
                      name?: string | null;
                    } | null;
                  }
                | Array<{
                    college_id: string | null;
                    college: {
                      code?: string | null;
                      name?: string | null;
                    } | null;
                  }>
                | null;
            }
          | Array<{
              id: string;
              campus_id: string | null;
              campus: { code?: string | null; name?: string | null } | null;
              program: unknown;
            }>
          | null;
      }
    | Array<{ program_offering: unknown }>
    | null;
};

// One term-scoped select covering every "sections/students grouped by X"
// widget; grouping happens in memory per dashboard.
export const getSectionRollup = async (
  academicTermId: string,
  filters: SectionRollupFilters = {},
): Promise<SectionRollupRow[]> => {
  const supabase = await createClient();

  let query = supabase
    .from("section")
    .select(
      `
      id,
      code,
      name,
      year_level,
      student_count,
      major_offering:major_offering_id!inner(
        program_offering:program_offering_id!inner(
          id,
          campus_id,
          campus:campus_id(code, name),
          program:program_id!inner(
            college_id,
            college:college_id(code, name)
          )
        )
      )
      `,
    )
    .eq("academic_term_id", academicTermId);

  if (filters.campusId) {
    query = query.eq(
      "major_offering.program_offering.campus_id",
      filters.campusId,
    );
  }
  if (filters.collegeId) {
    query = query.eq(
      "major_offering.program_offering.program.college_id",
      filters.collegeId,
    );
  }
  if (filters.programOfferingIds) {
    query = query.in(
      "major_offering.program_offering_id",
      filters.programOfferingIds,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("lib.home.shared-queries.getSectionRollup ::", error);
    return [];
  }

  return ((data ?? []) as unknown as RawSectionRow[]).map((row) => {
    const majorOffering = first(row.major_offering) as {
      program_offering?: unknown;
    } | null;
    const offering = first(majorOffering?.program_offering) as {
      id?: string;
      campus_id?: string | null;
      campus?: { code?: string | null; name?: string | null } | null;
      program?: unknown;
    } | null;
    const campus = first(offering?.campus);
    const program = first(offering?.program) as {
      college_id?: string | null;
      college?: { code?: string | null; name?: string | null } | null;
    } | null;
    const college = first(program?.college);

    return {
      sectionId: row.id,
      sectionLabel: row.code || row.name || "Unnamed section",
      yearLevel: Number(row.year_level ?? 0),
      studentCount: Number(row.student_count ?? 0),
      programOfferingId: offering?.id ?? null,
      campusId: offering?.campus_id ?? null,
      campusLabel: campus?.code || campus?.name || "Unknown campus",
      collegeId: program?.college_id ?? null,
      collegeLabel: college?.code || college?.name || "Unknown college",
    };
  });
};

const EMPLOYMENT_STATUSES = [
  "Regular",
  "Part-time",
  "Contract of Service",
  "Temporary",
] as const;

export const countUsers = async (
  filters: Record<string, string>,
): Promise<number> => {
  const supabase = await createClient();
  let query = supabase.from("user").select("id", {
    count: "exact",
    head: true,
  });
  Object.entries(filters).forEach(([column, value]) => {
    query = query.eq(column, value);
  });
  const { count, error } = await query;
  if (error) {
    console.error("lib.home.shared-queries.countUsers ::", error);
    return 0;
  }
  return count ?? 0;
};

type RawScopedLoadRow = {
  id: string;
  status: CampusCollegeLoadStatus;
  current_step: CampusCollegeLoadStep;
  campus: { code?: string | null; name?: string | null } | null;
  college: { code?: string | null; name?: string | null } | null;
  campus_college_load_revision: Array<{
    id: string;
    revision_number: number | null;
    submitted_at: string | null;
  }> | null;
};

// One existence query for all revisions instead of a count query per load.
// Only ever called with the handful of loads in a term, so the PostgREST row
// cap is not a concern.
export const getRevisionIdsWithReturnComments = async (
  revisionIds: string[],
): Promise<Set<string>> => {
  if (revisionIds.length === 0) return new Set();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campus_college_load_evaluation")
    .select("campus_college_load_revision_id")
    .in("campus_college_load_revision_id", revisionIds)
    .eq("status", "RETURNED");

  if (error) {
    console.error(
      "lib.home.shared-queries.getRevisionIdsWithReturnComments ::",
      error,
    );
    return new Set();
  }

  return new Set(
    (data ?? []).map((row) => String(row.campus_college_load_revision_id)),
  );
};

// FTL status rows for a campus- or college-scoped viewer (Dean / Campus
// Director). The Program Chair path uses getCampusCollegeLoadList instead,
// which also surfaces scopes with no load created yet.
export const getFtlStatusItemsByScope = async (
  academicTermId: string,
  filters: { campusId?: string; collegeId?: string },
): Promise<FtlStatusItem[]> => {
  const supabase = await createClient();

  let query = supabase
    .from("campus_college_load")
    .select(
      `
      id,
      status,
      current_step,
      campus:campus_id(code, name),
      college:college_id(code, name),
      campus_college_load_revision(id, revision_number, submitted_at)
      `,
    )
    .eq("academic_term_id", academicTermId);

  if (filters.campusId) query = query.eq("campus_id", filters.campusId);
  if (filters.collegeId) query = query.eq("college_id", filters.collegeId);

  const { data, error } = await query;

  if (error) {
    console.error(
      "lib.home.shared-queries.getFtlStatusItemsByScope ::",
      error,
    );
    return [];
  }

  const rows = (data ?? []) as unknown as RawScopedLoadRow[];

  const rowsWithLatest = rows.map((row) => ({
    row,
    latest: [...(row.campus_college_load_revision ?? [])].sort(
      (left, right) =>
        Number(right.revision_number ?? 0) - Number(left.revision_number ?? 0),
    )[0],
  }));

  const revisionsWithReturns = await getRevisionIdsWithReturnComments(
    rowsWithLatest.flatMap(({ row, latest }) =>
      row.status === "RETURNED" && latest?.id ? [latest.id] : [],
    ),
  );

  return rowsWithLatest.map(({ row, latest }) => {
    const campus = first(row.campus);
    const college = first(row.college);

    return {
      id: row.id,
      scopeLabel: `${campus?.code ?? campus?.name ?? "?"} — ${college?.code ?? college?.name ?? "?"}`,
      status: row.status,
      step: row.current_step,
      latestSubmittedAt: latest?.submitted_at ?? null,
      hasReturnComments:
        row.status === "RETURNED" && latest?.id
          ? revisionsWithReturns.has(latest.id)
          : false,
    };
  });
};

// Employment mix via per-status head-counts — immune to the PostgREST row cap.
export const getEmploymentMix = async (
  filters: Record<string, string> = {},
): Promise<LabelValue[]> => {
  const counts = await Promise.all(
    EMPLOYMENT_STATUSES.map((status) =>
      countUsers({ ...filters, employment_status: status }),
    ),
  );
  return EMPLOYMENT_STATUSES.map((status, index) => ({
    label: status,
    value: counts[index],
  })).filter((entry) => entry.value > 0);
};
