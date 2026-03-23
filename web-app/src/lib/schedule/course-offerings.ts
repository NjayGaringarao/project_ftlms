"use server";

import { createClient } from "@/utils/supabase/server";
import type { SessionType } from "@/models";

export type SchedulerCourseOfferingItem = {
  id: string;
  block_id: string;
  block_code: string;
  student_count: number;
  campus_id: string | null;
  merge_candidate_count: number;
  course_id: string;
  course_code: string;
  course_title: string;
  class_id: string | null;
  class_code: string | null;
  faculty_id: string | null;
  faculty_name: string | null;
  unscheduled_lecture_hours: number;
  unscheduled_laboratory_hours: number;
  merged_blocks: Array<{ id: string; code: string }>;
};

type RawUtilizationRow = {
  id: string;
  block_id: string;
  course_id: string;
  class_id: string | null;
  block?: {
    id?: string | null;
    code?: string | null;
    student_count?: number | null;
    academic_term_id?: string | null;
    major_offering?: {
      program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
    } | Array<{
      program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
    }> | null;
  } | Array<{
    id?: string | null;
    code?: string | null;
    student_count?: number | null;
    major_offering?: {
      program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
    } | Array<{
      program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
    }> | null;
  }> | null;
  course?: {
    code?: string | null;
    title?: string | null;
    lecture_unit?: number | null;
    laboratory_unit?: number | null;
  } | Array<{
    code?: string | null;
    title?: string | null;
    lecture_unit?: number | null;
    laboratory_unit?: number | null;
  }> | null;
  class?: {
    id?: string | null;
    code?: string | null;
    user_class?: Array<{
      user?: { id?: string; identity?: { name?: string | null } | Array<{ name?: string | null }> | null } | Array<{ id?: string; identity?: { name?: string | null } | Array<{ name?: string | null }> | null }>;
    }> | null;
    course_utilization?: Array<{
      block?: { id?: string | null; code?: string | null } | Array<{ id?: string | null; code?: string | null }>;
    }> | null;
    session_class?: Array<{
      session?: {
        type?: SessionType | null;
        start_time?: string | null;
        end_time?: string | null;
      } | Array<{
        type?: SessionType | null;
        start_time?: string | null;
        end_time?: string | null;
      }>;
    }> | null;
  } | Array<{
    id?: string | null;
    code?: string | null;
    user_class?: Array<{
      user?: { id?: string; identity?: { name?: string | null } | Array<{ name?: string | null }> | null } | Array<{ id?: string; identity?: { name?: string | null } | Array<{ name?: string | null }> | null }>;
    }> | null;
    course_utilization?: Array<{
      block?: { id?: string | null; code?: string | null } | Array<{ id?: string | null; code?: string | null }>;
    }> | null;
    session_class?: Array<{
      session?: {
        type?: SessionType | null;
        start_time?: string | null;
        end_time?: string | null;
      } | Array<{
        type?: SessionType | null;
        start_time?: string | null;
        end_time?: string | null;
      }>;
    }> | null;
  }> | null;
};

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const toMinutes = (value: string | null | undefined): number => {
  if (!value) return 0;
  const [rawHour = "0", rawMinute = "0"] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return hour * 60 + minute;
};

const toHours = (minutes: number): number => {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return minutes / 60;
};

export const getBlockCourseOfferingsForScheduler = async (
  blockId: string,
): Promise<SchedulerCourseOfferingItem[]> => {
  if (!blockId?.trim()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_utilization")
    .select(
      `
      id,
      course_id,
      class_id,
      block_id,
      course:course_id(id, code, title, lecture_unit, laboratory_unit),
      block:block_id(
        id,
        code,
        student_count,
        academic_term_id,
        major_offering:major_offering_id(
          program_offering:program_offering_id(campus_id)
        )
      ),
      class:class_id(
        id,
        code,
        user_class(
          user:user_id(id, identity:identity(name))
        ),
        course_utilization(
          block:block_id(id, code)
        ),
        session_class(
          session:session_id(type, start_time, end_time)
        )
      )
      `,
    )
    .eq("block_id", blockId)
    .order("id", { ascending: true });

  if (error) {
    console.error(
      "lib.schedule.course-offerings.getBlockCourseOfferingsForScheduler ::",
      error,
    );
    return [];
  }

  const rows = (data ?? []).map((row) => {
    const raw = row as RawUtilizationRow;
    const course = first(raw.course);
    const block = first(raw.block);
    const majorOffering = first(block?.major_offering);
    const programOffering = first(majorOffering?.program_offering);
    const cls = first(raw.class);
    const userClass = (cls?.user_class ?? [])[0];
    const faculty = first(userClass?.user);

    const lectureTarget = Number(course?.lecture_unit ?? 0);
    const laboratoryTarget = Number(course?.laboratory_unit ?? 0) * 3;

    const sessions = (cls?.session_class ?? []).map((sc) => first(sc.session));
    const lectureScheduled = sessions
      .filter((session) => session?.type === "Lecture")
      .reduce((sum, session) => {
        const minutes = toMinutes(session?.end_time) - toMinutes(session?.start_time);
        return sum + toHours(minutes);
      }, 0);
    const laboratoryScheduled = sessions
      .filter((session) => session?.type === "Laboratory")
      .reduce((sum, session) => {
        const minutes = toMinutes(session?.end_time) - toMinutes(session?.start_time);
        return sum + toHours(minutes);
      }, 0);

    const mergedBlocks = (cls?.course_utilization ?? [])
      .map((util) => first(util.block))
      .filter((block): block is { id?: string | null; code?: string | null } =>
        Boolean(block?.id),
      )
      .filter((block) => block.id !== blockId)
      .map((block) => ({ id: block.id ?? "", code: block.code ?? "Unknown" }));

    return {
      id: raw.id,
      block_id: raw.block_id,
      block_code: block?.code ?? "Unknown",
      student_count: Number(block?.student_count ?? 0),
      campus_id: programOffering?.campus_id ?? null,
      merge_candidate_count: 0,
      course_id: raw.course_id,
      course_code: course?.code ?? "Unknown",
      course_title: course?.title ?? "Untitled Course",
      class_id: raw.class_id ?? null,
      class_code: cls?.code ?? null,
      faculty_id: faculty?.id ?? null,
      faculty_name: first(faculty?.identity)?.name ?? null,
      unscheduled_lecture_hours: Math.max(lectureTarget - lectureScheduled, 0),
      unscheduled_laboratory_hours: Math.max(
        laboratoryTarget - laboratoryScheduled,
        0,
      ),
      merged_blocks: mergedBlocks,
    };
  });

  const academicTermId = rows[0]
    ? first((data?.[0] as RawUtilizationRow)?.block)?.academic_term_id ?? null
    : null;
  const courseIds = Array.from(new Set(rows.map((row) => row.course_id)));

  if (academicTermId && courseIds.length > 0) {
    const { data: candidates, error: candidateErr } = await supabase
      .from("course_utilization")
      .select(
        `
        id,
        course_id,
        class_id,
        block:block_id(
          id,
          academic_term_id,
          major_offering:major_offering_id(
            program_offering:program_offering_id(campus_id)
          )
        )
        `,
      )
      .eq("block.academic_term_id", academicTermId)
      .in("course_id", courseIds);

    if (candidateErr) {
      console.error(
        "lib.schedule.course-offerings.getBlockCourseOfferingsForScheduler.candidates ::",
        candidateErr,
      );
      return rows;
    }

    const normalizedCandidates = (candidates ?? []).map((candidate) => {
      const raw = candidate as RawUtilizationRow;
      const block = first(raw.block);
      const majorOffering = first(block?.major_offering);
      const programOffering = first(majorOffering?.program_offering);
      return {
        id: raw.id,
        course_id: raw.course_id,
        class_id: raw.class_id ?? null,
        campus_id: programOffering?.campus_id ?? null,
      };
    });

    return rows.map((row) => {
      const count = normalizedCandidates.filter((candidate) => {
        if (candidate.id === row.id) return false;
        if (!candidate.class_id || !row.class_id) return false;
        if (candidate.class_id === row.class_id) return false;
        if (candidate.course_id !== row.course_id) return false;
        if (candidate.campus_id !== row.campus_id) return false;
        return true;
      }).length;

      return { ...row, merge_candidate_count: count };
    });
  }

  return rows;
};
