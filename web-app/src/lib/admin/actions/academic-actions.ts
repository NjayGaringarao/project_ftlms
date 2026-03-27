"use server";

import { AcademicTermName } from "@/models";
import { createClient } from "@/utils/supabase/server";
import {
  mapCourseMutationError,
  mapDuplicateError,
  normalizeCode,
  normalizeDescription,
  normalizeName,
  revalidateAcademicYearsPaths,
  revalidateCoursesPaths,
  revalidateRanksPaths,
  revalidateTermsPaths,
} from "./shared";

type AcademicYearInput = {
  start_year: number;
  end_year: number;
};

type UpdateAcademicYearInput = AcademicYearInput & {
  id: string;
};

const normalizeAcademicYearInput = (input: AcademicYearInput) => ({
  start_year: input.start_year,
  end_year: input.end_year,
});

export async function createAcademicYear(
  input: AcademicYearInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!Number.isInteger(input.start_year)) {
    return { error: "Academic year start year is required" };
  }
  if (!Number.isInteger(input.end_year)) {
    return { error: "Academic year end year is required" };
  }
  if (input.end_year < input.start_year) {
    return {
      error: "Academic year end must be greater than or equal to start year",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_year")
    .insert(normalizeAcademicYearInput(input))
    .select("id")
    .single();

  if (error) {
    return { error: mapDuplicateError("Academic year", "code", error) };
  }

  revalidateAcademicYearsPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateAcademicYear(
  input: UpdateAcademicYearInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Academic year ID is required" };
  if (!Number.isInteger(input.start_year)) {
    return { error: "Academic year start year is required" };
  }
  if (!Number.isInteger(input.end_year)) {
    return { error: "Academic year end year is required" };
  }
  if (input.end_year < input.start_year) {
    return {
      error: "Academic year end must be greater than or equal to start year",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("academic_year")
    .update(normalizeAcademicYearInput(input))
    .eq("id", input.id);

  if (error) {
    return { error: mapDuplicateError("Academic year", "code", error) };
  }

  revalidateAcademicYearsPaths(input.id);
  return { data: true };
}

export async function deleteAcademicYear(
  yearId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!yearId?.trim()) return { error: "Academic year ID is required" };

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("academic_term")
    .select("id", { count: "exact", head: true })
    .eq("academic_year_id", yearId);

  if (countError) {
    return { error: countError.message };
  }

  if ((count ?? 0) > 0) {
    return {
      error:
        "Cannot delete academic year while academic terms are attached. Remove terms first.",
    };
  }

  const { error } = await supabase.from("academic_year").delete().eq("id", yearId);

  if (error) {
    return { error: error.message };
  }

  revalidateAcademicYearsPaths();
  return { data: true };
}

type TermInput = {
  academic_year_id: string;
  name: AcademicTermName;
  start: string;
  end: string;
};

type UpdateTermInput = TermInput & {
  id: string;
};

const normalizeTermInput = (input: TermInput) => ({
  academic_year_id: input.academic_year_id,
  name: input.name,
  start: input.start,
  end: input.end,
});

export async function createTerm(
  input: TermInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.academic_year_id?.trim()) return { error: "Academic year is required" };
  if (!input.name) return { error: "Academic term name is required" };

  if (!input.start?.trim()) return { error: "Start date is required" };
  if (!input.end?.trim()) return { error: "End date is required" };

  if (new Date(input.start) > new Date(input.end)) {
    return { error: "Start date must be before end date" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_term")
    .insert(normalizeTermInput(input))
    .select("id")
    .single();

  if (error) {
    return {
      error: mapDuplicateError("Term", "code within academic year", error),
    };
  }

  revalidateTermsPaths(input.academic_year_id);
  return { data: { id: data.id } };
}

export async function updateTerm(
  input: UpdateTermInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Term ID is required" };
  if (!input.academic_year_id?.trim()) return { error: "Academic year is required" };
  if (!input.name) return { error: "Academic term name is required" };

  if (!input.start?.trim()) return { error: "Start date is required" };
  if (!input.end?.trim()) return { error: "End date is required" };

  if (new Date(input.start) > new Date(input.end)) {
    return { error: "Start date must be before end date" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("academic_term")
    .update(normalizeTermInput(input))
    .eq("id", input.id);

  if (error) {
    return {
      error: mapDuplicateError("Term", "code within academic year", error),
    };
  }

  revalidateTermsPaths(input.academic_year_id);
  return { data: true };
}

export async function deleteTerm(
  termId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!termId?.trim()) return { error: "Term ID is required" };

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("block")
    .select("id", { count: "exact", head: true })
    .eq("academic_term_id", termId);

  if (countError) {
    return { error: countError.message };
  }

  if ((count ?? 0) > 0) {
    return {
      error:
        "Cannot delete term while blocks are attached. Remove or reassign blocks first.",
    };
  }

  const { error } = await supabase.from("academic_term").delete().eq("id", termId);

  if (error) {
    return { error: error.message };
  }

  revalidateTermsPaths();
  return { data: true };
}

type RankInput = {
  code: string;
  title: string;
  description?: string | null;
};

type UpdateRankInput = RankInput & {
  id: string;
};

const normalizeRankInput = (input: RankInput) => ({
  code: normalizeCode(input.code),
  title: normalizeName(input.title),
  description: normalizeDescription(input.description),
});

const mapRankMutationError = (message: string | undefined, code: string | undefined) => {
  if (code === "23505") {
    const lowerMessage = message?.toLowerCase() ?? "";
    if (lowerMessage.includes("code")) return "Rank code already exists";
    if (lowerMessage.includes("title")) return "Rank title already exists";
    return "Rank already exists";
  }
  return message ?? "Unexpected error";
};

export async function createRank(
  input: RankInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.code?.trim()) return { error: "Rank code is required" };
  if (!input.title?.trim()) return { error: "Rank title is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_rank")
    .insert(normalizeRankInput(input))
    .select("id")
    .single();

  if (error) {
    return { error: mapRankMutationError(error.message, error.code) };
  }

  revalidateRanksPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateRank(
  input: UpdateRankInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Rank ID is required" };
  if (!input.code?.trim()) return { error: "Rank code is required" };
  if (!input.title?.trim()) return { error: "Rank title is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("academic_rank")
    .update(normalizeRankInput(input))
    .eq("id", input.id);

  if (error) {
    return { error: mapRankMutationError(error.message, error.code) };
  }

  revalidateRanksPaths(input.id);
  return { data: true };
}

export async function deleteRank(
  rankId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!rankId?.trim()) return { error: "Rank ID is required" };

  const supabase = await createClient();

  const { error } = await supabase.from("academic_rank").delete().eq("id", rankId);

  if (error) {
    return { error: error.message };
  }

  revalidateRanksPaths();
  return { data: true };
}

type CourseInput = {
  code: string;
  title: string;
  lecture_unit?: number | null;
  laboratory_unit?: number | null;
};

type UpdateCourseInput = CourseInput & {
  id: string;
};

const normalizeCourseInput = (input: CourseInput) => ({
  code: normalizeCode(input.code),
  title: normalizeName(input.title),
  lecture_unit: input.lecture_unit ?? 0,
  laboratory_unit: input.laboratory_unit ?? 0,
});

export async function createCourse(
  input: CourseInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.code?.trim()) return { error: "Course code is required" };
  if (!input.title?.trim()) return { error: "Course title is required" };
  if (
    input.lecture_unit !== undefined &&
    input.lecture_unit !== null &&
    (!Number.isFinite(input.lecture_unit) || input.lecture_unit < 0)
  ) {
    return { error: "Lecture unit must be zero or greater" };
  }
  if (
    input.laboratory_unit !== undefined &&
    input.laboratory_unit !== null &&
    (!Number.isFinite(input.laboratory_unit) || input.laboratory_unit < 0)
  ) {
    return { error: "Laboratory unit must be zero or greater" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course")
    .insert(normalizeCourseInput(input))
    .select("id")
    .single();

  if (error) {
    return { error: mapCourseMutationError(error) };
  }

  revalidateCoursesPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateCourse(
  input: UpdateCourseInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Course ID is required" };
  if (!input.code?.trim()) return { error: "Course code is required" };
  if (!input.title?.trim()) return { error: "Course title is required" };
  if (
    input.lecture_unit !== undefined &&
    input.lecture_unit !== null &&
    (!Number.isFinite(input.lecture_unit) || input.lecture_unit < 0)
  ) {
    return { error: "Lecture unit must be zero or greater" };
  }
  if (
    input.laboratory_unit !== undefined &&
    input.laboratory_unit !== null &&
    (!Number.isFinite(input.laboratory_unit) || input.laboratory_unit < 0)
  ) {
    return { error: "Laboratory unit must be zero or greater" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("course")
    .update(normalizeCourseInput(input))
    .eq("id", input.id);

  if (error) {
    return { error: mapCourseMutationError(error) };
  }

  revalidateCoursesPaths(input.id);
  return { data: true };
}

export async function deleteCourse(
  courseId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!courseId?.trim()) return { error: "Course ID is required" };

  const supabase = await createClient();

  const { error } = await supabase.from("course").delete().eq("id", courseId);

  if (error) {
    return { error: error.message };
  }

  revalidateCoursesPaths();
  return { data: true };
}
