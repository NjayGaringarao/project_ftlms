"use server";

import { createClient } from "@/utils/supabase/server";
import { sessionHours } from "./load-math";
import {
  getEmploymentMix,
  getFtlStatusItemsByScope,
  getSectionRollup,
} from "./shared-queries";
import {
  CampusDirectorInsights,
  DashboardContext,
  LabelValue,
} from "./types";

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

type RawRoomUtilizationRow = {
  class: unknown;
};

// Weekly scheduled hours per room for one campus+term. Starts from
// course_utilization (term-bounded) rather than session (unbounded).
const getRoomUtilization = async (
  academicTermId: string,
  campusId: string,
): Promise<LabelValue[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_utilization")
    .select(
      `
      section:section_id!inner(
        academic_term_id,
        major_offering:major_offering_id!inner(
          program_offering:program_offering_id!inner(campus_id)
        )
      ),
      class:class_id(
        session_class(
          session:session_id(
            id,
            start_time,
            end_time,
            room:room_id(code, name)
          )
        )
      )
      `,
    )
    .eq("section.academic_term_id", academicTermId)
    .eq(
      "section.major_offering.program_offering.campus_id",
      campusId,
    );

  if (error) {
    console.error(
      "lib.home.campus-director-queries.getRoomUtilization ::",
      error,
    );
    return [];
  }

  const hoursByRoom = new Map<string, number>();
  const seenSessionIds = new Set<string>();

  ((data ?? []) as unknown as RawRoomUtilizationRow[]).forEach((row) => {
    const classRow = first(row.class) as {
      session_class?: Array<{ session?: unknown }> | null;
    } | null;
    (classRow?.session_class ?? []).forEach((entry) => {
      const session = first(entry.session) as {
        id?: string;
        start_time?: string | null;
        end_time?: string | null;
        room?: { code?: string | null; name?: string | null } | null;
      } | null;
      if (!session?.id || seenSessionIds.has(session.id)) return;
      seenSessionIds.add(session.id);
      const room = first(session.room);
      if (!room) return;
      const label = room.code || room.name || "Unknown room";
      hoursByRoom.set(
        label,
        (hoursByRoom.get(label) ?? 0) +
          sessionHours(session.start_time ?? "", session.end_time ?? ""),
      );
    });
  });

  return Array.from(hoursByRoom.entries())
    .map(([label, value]) => ({ label, value: Number(value.toFixed(1)) }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 10);
};

export const getCampusDirectorInsights = async (
  context: DashboardContext,
): Promise<CampusDirectorInsights> => {
  const termId = context.term!.id;
  const campusIds = context.scope.campusIds;

  const [ftlGroups, sectionGroups, employmentGroups, roomGroups] =
    await Promise.all([
      Promise.all(
        campusIds.map((campusId) =>
          getFtlStatusItemsByScope(termId, { campusId }),
        ),
      ),
      Promise.all(
        campusIds.map((campusId) => getSectionRollup(termId, { campusId })),
      ),
      Promise.all(
        campusIds.map((campusId) => getEmploymentMix({ campus_id: campusId })),
      ),
      Promise.all(
        campusIds.map((campusId) => getRoomUtilization(termId, campusId)),
      ),
    ]);

  const sections = sectionGroups.flat();

  const collegeCounts = new Map<string, number>();
  sections.forEach((section) => {
    collegeCounts.set(
      section.collegeLabel,
      (collegeCounts.get(section.collegeLabel) ?? 0) + 1,
    );
  });

  const employmentMix = new Map<string, number>();
  employmentGroups.flat().forEach((entry) => {
    employmentMix.set(
      entry.label,
      (employmentMix.get(entry.label) ?? 0) + entry.value,
    );
  });

  return {
    ftl: ftlGroups.flat(),
    employmentMix: Array.from(employmentMix.entries()).map(
      ([label, value]) => ({ label, value }),
    ),
    roomUtilization: roomGroups.flat().slice(0, 10),
    sectionsPerCollege: Array.from(collegeCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value),
    totalSections: sections.length,
    totalStudents: sections.reduce(
      (sum, section) => sum + section.studentCount,
      0,
    ),
  };
};
