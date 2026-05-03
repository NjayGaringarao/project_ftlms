"use server";

import { AcademicTermName } from "@/features/shared/types/models";
import { ACADEMIC_TERM_NAMES } from "@/features/admin/lib/academic-terms";
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

type TermInput = {
  academic_year_id: string;
  name: AcademicTermName;
  start: string;
  end: string;
};

type AcademicCalendarTermInput = Omit<TermInput, "academic_year_id">;

type AcademicCalendarInput = AcademicYearInput & {
  terms: AcademicCalendarTermInput[];
};

type UpdateAcademicYearInput = AcademicYearInput & {
  id: string;
};

const normalizeAcademicYearInput = (input: AcademicYearInput) => ({
  start_year: input.start_year,
  end_year: input.end_year,
});

const validateAcademicYearInput = (input: AcademicYearInput) => {
  if (!Number.isInteger(input.start_year)) {
    return "Academic year start year is required";
  }
  if (!Number.isInteger(input.end_year)) {
    return "Academic year end year is required";
  }
  if (input.end_year < input.start_year) {
    return "Academic year end must be greater than or equal to start year";
  }

  return null;
};

const validateTermDateInput = (input: Pick<TermInput, "start" | "end">) => {
  if (!input.start?.trim()) return "Start date is required";
  if (!input.end?.trim()) return "End date is required";

  if (new Date(input.start) >= new Date(input.end)) {
    return "Start date must be before end date";
  }

  return null;
};

const rangesOverlap = (
  first: Pick<TermInput, "start" | "end">,
  second: Pick<TermInput, "start" | "end">,
) => new Date(first.start) <= new Date(second.end) && new Date(first.end) >= new Date(second.start);

const validateCalendarTermsInput = (terms: AcademicCalendarTermInput[]) => {
  if (terms.length !== ACADEMIC_TERM_NAMES.length) {
    return "Academic calendar requires First Semester, Second Semester, and Midyear terms";
  }

  const termNames = new Set(terms.map((term) => term.name));
  const missingTermName = ACADEMIC_TERM_NAMES.find((name) => !termNames.has(name));

  if (missingTermName) {
    return "Academic calendar requires First Semester, Second Semester, and Midyear terms";
  }

  if (termNames.size !== terms.length) {
    return "Academic term names must be unique within an academic calendar";
  }

  for (const term of terms) {
    if (!ACADEMIC_TERM_NAMES.includes(term.name)) {
      return "Academic term name is invalid";
    }

    const dateError = validateTermDateInput(term);
    if (dateError) return `${term.name}: ${dateError}`;
  }

  for (let index = 0; index < terms.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < terms.length; nextIndex += 1) {
      if (rangesOverlap(terms[index], terms[nextIndex])) {
        return "Academic term dates must not overlap each other";
      }
    }
  }

  return null;
};

export async function createAcademicYear(
  input: AcademicCalendarInput,
): Promise<{ data?: { id: string }; error?: string }> {
  const yearError = validateAcademicYearInput(input);
  if (yearError) return { error: yearError };

  const termsError = validateCalendarTermsInput(input.terms);
  if (termsError) return { error: termsError };

  const supabase = await createClient();

  const { data: year, error } = await supabase
    .from("academic_year")
    .insert(normalizeAcademicYearInput(input))
    .select("id")
    .single();

  if (error) {
    return { error: mapDuplicateError("Academic year", "code", error) };
  }

  const insertedTermIds: string[] = [];

  for (const term of input.terms) {
    const termInput = {
      ...term,
      academic_year_id: year.id,
    };

    const availabilityError = await validateTermAvailability(termInput);
    if (availabilityError) {
      if (insertedTermIds.length > 0) {
        await supabase.from("academic_term").delete().in("id", insertedTermIds);
      }
      await supabase.from("academic_year").delete().eq("id", year.id);
      return { error: availabilityError };
    }

    const { data: createdTerm, error: termError } = await supabase
      .from("academic_term")
      .insert(normalizeTermInput(termInput))
      .select("id")
      .single();

    if (termError) {
      if (insertedTermIds.length > 0) {
        await supabase.from("academic_term").delete().in("id", insertedTermIds);
      }
      await supabase.from("academic_year").delete().eq("id", year.id);
      return { error: mapTermMutationError(termError) };
    }

    insertedTermIds.push(createdTerm.id);
  }

  revalidateAcademicYearsPaths(year.id);
  return { data: { id: year.id } };
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

type UpdateTermInput = TermInput & {
  id: string;
};

const normalizeTermInput = (input: TermInput) => ({
  academic_year_id: input.academic_year_id,
  name: input.name,
  start: input.start,
  end: input.end,
});

const validateTermAvailability = async (
  input: TermInput,
  excludeTermId?: string,
) => {
  const supabase = await createClient();

  let sameNameQuery = supabase
    .from("academic_term")
    .select("id", { count: "exact", head: true })
    .eq("academic_year_id", input.academic_year_id)
    .eq("name", input.name);

  if (excludeTermId) {
    sameNameQuery = sameNameQuery.neq("id", excludeTermId);
  }

  const { count: sameNameCount, error: sameNameError } = await sameNameQuery;

  if (sameNameError) {
    return sameNameError.message;
  }

  if ((sameNameCount ?? 0) > 0) {
    return "Academic term name is already used in this academic year";
  }

  let overlapQuery = supabase
    .from("academic_term")
    .select("id", { count: "exact", head: true })
    .lte("start", input.end)
    .gte("end", input.start);

  if (excludeTermId) {
    overlapQuery = overlapQuery.neq("id", excludeTermId);
  }

  const { count: overlapCount, error: overlapError } = await overlapQuery;

  if (overlapError) {
    return overlapError.message;
  }

  if ((overlapCount ?? 0) > 0) {
    return "Academic term dates overlap an existing academic term";
  }

  return null;
};

const mapTermMutationError = (error: { code?: string; message?: string }) => {
  if (error.code === "23P01") {
    return "Academic term dates overlap an existing academic term";
  }

  return mapDuplicateError("Term", "code within academic year", error);
};

export async function createTerm(
  input: TermInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.academic_year_id?.trim()) return { error: "Academic year is required" };
  if (!input.name) return { error: "Academic term name is required" };

  const dateError = validateTermDateInput(input);
  if (dateError) return { error: dateError };

  const availabilityError = await validateTermAvailability(input);
  if (availabilityError) return { error: availabilityError };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_term")
    .insert(normalizeTermInput(input))
    .select("id")
    .single();

  if (error) {
    return { error: mapTermMutationError(error) };
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

  const dateError = validateTermDateInput(input);
  if (dateError) return { error: dateError };

  const availabilityError = await validateTermAvailability(input, input.id);
  if (availabilityError) return { error: availabilityError };

  const supabase = await createClient();

  const { error } = await supabase
    .from("academic_term")
    .update(normalizeTermInput(input))
    .eq("id", input.id);

  if (error) {
    return { error: mapTermMutationError(error) };
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

export async function setDefaultAcademicTerm(
  termId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!termId?.trim()) return { error: "Academic term is required" };

  const supabase = await createClient();

  const { data: term, error: termError } = await supabase
    .from("academic_term")
    .select("id")
    .eq("id", termId)
    .maybeSingle();

  if (termError) return { error: termError.message };
  if (!term) return { error: "Academic term not found" };

  const { error } = await supabase.from("app_setting").upsert({
    key: "default_academic_term_id",
    academic_term_id: termId,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

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
