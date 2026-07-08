"use server";

import { getCampusCollegeLoadList } from "@/features/campus-college-load/lib/queries";
import { formatName } from "@/features/shared/lib/format-name";
import { createClient } from "@/utils/supabase/server";
import { FacultyClassRow, sumFacultyLoads } from "./load-math";
import { getSectionRollup, SectionRollupRow } from "./shared-queries";
import {
  AttentionIssue,
  AttentionSection,
  ChairInsights,
  DashboardContext,
  FtlStatusItem,
} from "./types";

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

type RawUtilizationRow = {
  id: string;
  section_id: string;
  course: unknown;
  class: unknown;
};

type NormalizedClassRow = {
  classId: string;
  sectionId: string;
  courseCode: string;
  lectureUnit: number;
  laboratoryUnit: number;
  facultyId: string | null;
  facultyName: string | null;
  facultyShortName: string | null;
  sessionTypes: string[];
};

const normalizeUtilizationRow = (
  row: RawUtilizationRow,
): NormalizedClassRow | null => {
  const course = first(row.course) as {
    code?: string | null;
    lecture_unit?: number | null;
    laboratory_unit?: number | null;
  } | null;
  const classRow = first(row.class) as {
    id?: string;
    user_class?: Array<{
      user_id: string;
      user?: unknown;
    }> | null;
    session_class?: Array<{ session?: unknown }> | null;
  } | null;

  if (!classRow?.id) return null;

  const userClass = first(classRow.user_class);
  const user = first(userClass?.user) as { identity?: unknown } | null;
  const identity = first(user?.identity) as {
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    suffix?: string | null;
    professional_extension?: string | null;
  } | null;

  const sessionTypes = (classRow.session_class ?? [])
    .map((entry) => {
      const session = first(entry.session) as { type?: string | null } | null;
      return session?.type ?? null;
    })
    .filter((value): value is string => Boolean(value));

  return {
    classId: classRow.id,
    sectionId: row.section_id,
    courseCode: course?.code ?? "Unknown",
    lectureUnit: Number(course?.lecture_unit ?? 0),
    laboratoryUnit: Number(course?.laboratory_unit ?? 0),
    facultyId: userClass?.user_id ?? null,
    facultyName: identity
      ? formatName(identity, {
          firstWord: "FIRST",
          middleName: "INITIAL",
          isProfexIncluded: false,
        })
      : null,
    facultyShortName: identity?.last_name
      ? `${identity.last_name}${
          identity.first_name
            ? `, ${identity.first_name.charAt(0).toUpperCase()}.`
            : ""
        }`
      : null,
    sessionTypes,
  };
};

// Class-level rollup for a set of sections: faculty assignment, units,
// and scheduled session types — one select, aggregated in memory.
export const getClassRollupForSections = async (
  sectionIds: string[],
): Promise<NormalizedClassRow[]> => {
  if (sectionIds.length === 0) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_utilization")
    .select(
      `
      id,
      section_id,
      course:course_id(code, lecture_unit, laboratory_unit),
      class:class_id(
        id,
        user_class(
          user_id,
          user:user_id(
            identity(first_name, middle_name, last_name, suffix, professional_extension)
          )
        ),
        session_class(
          session:session_id(type)
        )
      )
      `,
    )
    .in("section_id", sectionIds);

  if (error) {
    console.error("lib.home.chair-queries.getClassRollupForSections ::", error);
    return [];
  }

  const seenClassIds = new Set<string>();
  const rows: NormalizedClassRow[] = [];
  ((data ?? []) as unknown as RawUtilizationRow[]).forEach((row) => {
    const normalized = normalizeUtilizationRow(row);
    if (!normalized || seenClassIds.has(normalized.classId)) return;
    seenClassIds.add(normalized.classId);
    rows.push(normalized);
  });
  return rows;
};

export const getFtlStatusItems = async (
  academicTermId: string,
): Promise<FtlStatusItem[]> => {
  const supabase = await createClient();
  const items = await getCampusCollegeLoadList(academicTermId);

  return Promise.all(
    items.map(async (item) => {
      let hasReturnComments = false;
      if (item.load?.status === "RETURNED" && item.latest_revision?.id) {
        const { count } = await supabase
          .from("campus_college_load_evaluation")
          .select("id", { count: "exact", head: true })
          .eq("campus_college_load_revision_id", item.latest_revision.id)
          .eq("status", "RETURNED");
        hasReturnComments = (count ?? 0) > 0;
      }
      return {
        id: item.load?.id ?? null,
        scopeLabel: `${item.campus_code ?? item.campus_name ?? "?"} — ${item.college_code ?? item.college_name ?? "?"}`,
        status: item.load?.status ?? null,
        step: item.load?.current_step ?? null,
        latestSubmittedAt: item.latest_revision?.submitted_at ?? null,
        hasReturnComments,
      };
    }),
  );
};

export const getChairInsights = async (
  context: DashboardContext,
): Promise<ChairInsights> => {
  const termId = context.term!.id;

  const [ftl, sections] = await Promise.all([
    getFtlStatusItems(termId),
    getSectionRollup(termId, {
      programOfferingIds: context.scope.programOfferingIds,
    }),
  ]);

  const classes = await getClassRollupForSections(
    sections.map((section) => section.sectionId),
  );

  const yearLevelCounts = new Map<number, number>();
  sections.forEach((section) => {
    yearLevelCounts.set(
      section.yearLevel,
      (yearLevelCounts.get(section.yearLevel) ?? 0) + 1,
    );
  });
  const sectionsByYearLevel = Array.from(yearLevelCounts.entries())
    .sort(([left], [right]) => left - right)
    .map(([yearLevel, value]) => ({
      label: `Year ${yearLevel}`,
      shortLabel: `Y${yearLevel}`,
      value,
    }));

  const facultyRows: FacultyClassRow[] = classes
    .filter((row) => row.facultyId)
    .map((row) => ({
      facultyId: row.facultyId!,
      facultyName: row.facultyName ?? "Unnamed faculty",
      facultyShortName: row.facultyShortName ?? undefined,
      lectureUnit: row.lectureUnit,
      laboratoryUnit: row.laboratoryUnit,
    }));

  const sessionMix = classes.reduce(
    (mix, row) => {
      row.sessionTypes.forEach((type) => {
        if (type === "Lecture") mix.lecture += 1;
        if (type === "Laboratory") mix.laboratory += 1;
      });
      return mix;
    },
    { lecture: 0, laboratory: 0 },
  );

  return {
    ftl,
    sectionsByYearLevel,
    totalSections: sections.length,
    totalStudents: sections.reduce(
      (sum, section) => sum + section.studentCount,
      0,
    ),
    facultyLoads: sumFacultyLoads(facultyRows),
    attentionSections: buildAttentionSections(sections, classes),
    sessionMix,
  };
};

// Group incomplete classes (missing faculty and/or schedule) under their
// section, worst-affected sections first.
const buildAttentionSections = (
  sections: SectionRollupRow[],
  classes: NormalizedClassRow[],
): AttentionSection[] => {
  const labelsBySectionId = new Map(
    sections.map((section) => [section.sectionId, section.sectionLabel]),
  );

  const grouped = new Map<string, AttentionSection>();
  classes.forEach((row) => {
    const issues: AttentionIssue[] = [];
    if (!row.facultyId) issues.push("NO_FACULTY");
    if (row.sessionTypes.length === 0) issues.push("NO_SCHEDULE");
    if (issues.length === 0) return;

    const existing = grouped.get(row.sectionId) ?? {
      sectionId: row.sectionId,
      sectionLabel: labelsBySectionId.get(row.sectionId) ?? "Unnamed section",
      items: [],
    };
    existing.items.push({ courseCode: row.courseCode, issues });
    grouped.set(row.sectionId, existing);
  });

  return Array.from(grouped.values())
    .map((section) => ({
      ...section,
      items: [...section.items].sort((left, right) =>
        left.courseCode.localeCompare(right.courseCode),
      ),
    }))
    .sort(
      (left, right) =>
        right.items.length - left.items.length ||
        left.sectionLabel.localeCompare(right.sectionLabel),
    );
};
