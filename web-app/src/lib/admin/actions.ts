"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type MutationError = {
  code?: string;
  message?: string;
};

const normalizeCode = (value: string) => value.trim().toUpperCase();
const normalizeName = (value: string) => value.trim();
const normalizeDescription = (value?: string | null) => value?.trim() || null;

const mapDuplicateError = (
  entity: string,
  fieldLabel: string,
  error: MutationError,
) => {
  if (error.code === "23505") {
    return `${entity} ${fieldLabel} already exists`;
  }

  return error.message ?? "Unexpected error";
};

const mapDepartmentMutationError = (error: MutationError) => {
  if (error.code === "23505") {
    const message = error.message?.toLowerCase() ?? "";
    if (message.includes("code")) {
      return "Department code already exists";
    }
    if (message.includes("name")) {
      return "Department name already exists";
    }
    return "Department already exists";
  }

  return error.message ?? "Unexpected error";
};

const revalidateDepartmentsPaths = (id?: string) => {
  revalidatePath("/departments");
  revalidatePath("/departments/create");

  if (id) {
    revalidatePath(`/departments/${id}`);
    revalidatePath(`/departments/${id}/edit`);
  }
};

const revalidateCampusesPaths = (id?: string) => {
  revalidatePath("/campuses");
  revalidatePath("/campuses/create");

  if (id) {
    revalidatePath(`/campuses/${id}`);
    revalidatePath(`/campuses/${id}/edit`);
  }
};

const revalidateTermsPaths = (id?: string) => {
  revalidatePath("/academic-terms");
  revalidatePath("/academic-terms/create");

  if (id) {
    revalidatePath(`/academic-terms/${id}`);
    revalidatePath(`/academic-terms/${id}/edit`);
  }
};

const revalidateRanksPaths = (id?: string) => {
  revalidatePath("/academic-ranks");
  revalidatePath("/academic-ranks/create");

  if (id) {
    revalidatePath(`/academic-ranks/${id}`);
    revalidatePath(`/academic-ranks/${id}/edit`);
  }
};

const revalidateCoursesPaths = (id?: string) => {
  revalidatePath("/courses");
  revalidatePath("/courses/create");

  if (id) {
    revalidatePath(`/courses/${id}`);
    revalidatePath(`/courses/${id}/edit`);
  }
};

const revalidateProgramsPaths = (id?: string) => {
  revalidatePath("/programs");
  revalidatePath("/programs/create");

  if (id) {
    revalidatePath(`/programs/${id}`);
    revalidatePath(`/programs/${id}/edit`);
  }
};

const revalidateProgramOfferingsPaths = (id?: string) => {
  revalidatePath("/program-offerings");
  revalidatePath("/program-offerings/create");

  if (id) {
    revalidatePath(`/program-offerings/${id}`);
    revalidatePath(`/program-offerings/${id}/edit`);
  }
};

const revalidateMajorsPaths = (id?: string) => {
  revalidatePath("/majors");
  revalidatePath("/majors/create");

  if (id) {
    revalidatePath(`/majors/${id}`);
    revalidatePath(`/majors/${id}/edit`);
  }
};

const revalidateMajorOfferingsPaths = (id?: string) => {
  revalidatePath("/major-offerings");
  revalidatePath("/major-offerings/create");

  if (id) {
    revalidatePath(`/major-offerings/${id}`);
    revalidatePath(`/major-offerings/${id}/edit`);
  }
};

const revalidateCourseOfferingsPaths = (id?: string) => {
  revalidatePath("/course-offerings");
  revalidatePath("/course-offerings/create");

  if (id) {
    revalidatePath(`/course-offerings/${id}`);
    revalidatePath(`/course-offerings/${id}/edit`);
  }
};

const revalidateBlocksPaths = (id?: string) => {
  revalidatePath("/blocks");
  revalidatePath("/blocks/create");

  if (id) {
    revalidatePath(`/blocks/${id}`);
    revalidatePath(`/blocks/${id}/edit`);
  }
};

const revalidateDepartmentProgramsPaths = (
  departmentId: string,
  programId?: string,
) => {
  const basePath = `/departments/${departmentId}/programs`;
  revalidatePath(basePath);
  revalidatePath(`${basePath}/create`);

  if (programId) {
    revalidatePath(`${basePath}/${programId}`);
    revalidatePath(`${basePath}/${programId}/edit`);
    revalidatePath(`${basePath}/${programId}/majors`);
    revalidatePath(`${basePath}/${programId}/majors/create`);
  }
};

const revalidateProgramMajorsPaths = (
  departmentId: string,
  programId: string,
  majorId?: string,
) => {
  const basePath = `/departments/${departmentId}/programs/${programId}/majors`;
  revalidatePath(basePath);
  revalidatePath(`${basePath}/create`);

  if (majorId) {
    revalidatePath(`${basePath}/${majorId}`);
    revalidatePath(`${basePath}/${majorId}/edit`);
  }
};

const revalidateCampusProgramMajorOfferingsPaths = (
  campusId: string,
  programOfferingId: string,
  majorOfferingId?: string,
) => {
  const basePath = `/campuses/${campusId}/program-offerings/${programOfferingId}/major-offerings`;
  revalidatePath(basePath);
  revalidatePath(`${basePath}/create`);

  if (majorOfferingId) {
    revalidatePath(`${basePath}/${majorOfferingId}`);
    revalidatePath(`${basePath}/${majorOfferingId}/edit`);
  }
};

type DepartmentInput = {
  code: string;
  name: string;
  type:
    | "ACADEMIC"
    | "ADMINISTRATIVE"
    | "STUDENT_SERVICES"
    | "EXTENSION_SERVICES";
  description?: string | null;
};

type UpdateDepartmentInput = DepartmentInput & {
  id: string;
};

export async function createDepartment(
  input: DepartmentInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.code?.trim()) return { error: "Department code is required" };
  if (!input.name?.trim()) return { error: "Department name is required" };

  const supabase = await createClient();

  const payload = {
    code: normalizeCode(input.code),
    name: normalizeName(input.name),
    type: input.type,
    description: normalizeDescription(input.description),
  };

  const { data, error } = await supabase
    .from("department")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return { error: mapDepartmentMutationError(error) };
  }

  revalidateDepartmentsPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateDepartment(
  input: UpdateDepartmentInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Department ID is required" };
  if (!input.code?.trim()) return { error: "Department code is required" };
  if (!input.name?.trim()) return { error: "Department name is required" };

  const supabase = await createClient();

  const payload = {
    code: normalizeCode(input.code),
    name: normalizeName(input.name),
    type: input.type,
    description: normalizeDescription(input.description),
  };

  const { error } = await supabase
    .from("department")
    .update(payload)
    .eq("id", input.id);

  if (error) {
    return { error: mapDepartmentMutationError(error) };
  }

  revalidateDepartmentsPaths(input.id);
  return { data: true };
}

export async function deleteDepartment(
  departmentId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!departmentId?.trim()) return { error: "Department ID is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("department")
    .delete()
    .eq("id", departmentId);

  if (error) {
    return { error: mapDepartmentMutationError(error) };
  }

  revalidateDepartmentsPaths();
  return { data: true };
}

type CampusInput = {
  name: string;
  address?: string | null;
  zip_code?: string | null;
};

type UpdateCampusInput = CampusInput & {
  id: string;
};

const normalizeCampusInput = (input: CampusInput) => ({
  name: normalizeName(input.name),
  address: normalizeDescription(input.address),
  zip_code: normalizeDescription(input.zip_code),
});

export async function createCampus(
  input: CampusInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.name?.trim()) return { error: "Campus name is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campus")
    .insert(normalizeCampusInput(input))
    .select("id")
    .single();

  if (error) {
    return { error: mapDuplicateError("Campus", "name", error) };
  }

  revalidateCampusesPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateCampus(
  input: UpdateCampusInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Campus ID is required" };
  if (!input.name?.trim()) return { error: "Campus name is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("campus")
    .update(normalizeCampusInput(input))
    .eq("id", input.id);

  if (error) {
    return { error: mapDuplicateError("Campus", "name", error) };
  }

  revalidateCampusesPaths(input.id);
  return { data: true };
}

export async function deleteCampus(
  campusId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!campusId?.trim()) return { error: "Campus ID is required" };

  const supabase = await createClient();

  const { error } = await supabase.from("campus").delete().eq("id", campusId);

  if (error) {
    return { error: error.message };
  }

  revalidateCampusesPaths();
  return { data: true };
}

type TermInput = {
  academic_year: string;
  term_code: string;
  sequence: number;
  start: string;
  end: string;
};

type UpdateTermInput = TermInput & {
  id: string;
};

const normalizeTermInput = (input: TermInput) => ({
  academic_year: normalizeName(input.academic_year),
  term_code: normalizeName(input.term_code),
  sequence: input.sequence,
  start: input.start,
  end: input.end,
});

export async function createTerm(
  input: TermInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.academic_year?.trim())
    return { error: "Academic year is required" };
  if (!input.term_code?.trim()) return { error: "Term code is required" };
  if (!Number.isFinite(input.sequence))
    return { error: "Term sequence is required" };
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
      error: mapDuplicateError("Term", "academic year and term code", error),
    };
  }

  revalidateTermsPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateTerm(
  input: UpdateTermInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Term ID is required" };
  if (!input.academic_year?.trim())
    return { error: "Academic year is required" };
  if (!input.term_code?.trim()) return { error: "Term code is required" };
  if (!Number.isFinite(input.sequence))
    return { error: "Term sequence is required" };
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
      error: mapDuplicateError("Term", "academic year and term code", error),
    };
  }

  revalidateTermsPaths(input.id);
  return { data: true };
}

export async function deleteTerm(
  termId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!termId?.trim()) return { error: "Term ID is required" };

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("schedule")
    .select("id", { count: "exact", head: true })
    .eq("academic_term_id", termId);

  if (countError) {
    return { error: countError.message };
  }

  if ((count ?? 0) > 0) {
    return {
      error:
        "Cannot delete term while schedules are attached. Remove or reassign schedules first.",
    };
  }

  const { error } = await supabase
    .from("academic_term")
    .delete()
    .eq("id", termId);

  if (error) {
    return { error: error.message };
  }

  revalidateTermsPaths();
  return { data: true };
}

type RankInput = {
  number: number;
  title: string;
  description?: string | null;
};

type UpdateRankInput = RankInput & {
  id: string;
};

const normalizeRankInput = (input: RankInput) => ({
  number: input.number,
  title: normalizeName(input.title),
  description: normalizeDescription(input.description),
});

export async function createRank(
  input: RankInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!Number.isFinite(input.number))
    return { error: "Rank number is required" };
  if (!input.title?.trim()) return { error: "Rank title is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_rank")
    .insert(normalizeRankInput(input))
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const message = error.message?.toLowerCase() ?? "";
      if (message.includes("number")) {
        return { error: "Rank number already exists" };
      }
      if (message.includes("title")) {
        return { error: "Rank title already exists" };
      }
      return { error: "Rank already exists" };
    }

    return { error: error.message };
  }

  revalidateRanksPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateRank(
  input: UpdateRankInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Rank ID is required" };
  if (!Number.isFinite(input.number))
    return { error: "Rank number is required" };
  if (!input.title?.trim()) return { error: "Rank title is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("academic_rank")
    .update(normalizeRankInput(input))
    .eq("id", input.id);

  if (error) {
    if (error.code === "23505") {
      const message = error.message?.toLowerCase() ?? "";
      if (message.includes("number")) {
        return { error: "Rank number already exists" };
      }
      if (message.includes("title")) {
        return { error: "Rank title already exists" };
      }
      return { error: "Rank already exists" };
    }

    return { error: error.message };
  }

  revalidateRanksPaths(input.id);
  return { data: true };
}

export async function deleteRank(
  rankId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!rankId?.trim()) return { error: "Rank ID is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("academic_rank")
    .delete()
    .eq("id", rankId);

  if (error) {
    return { error: error.message };
  }

  revalidateRanksPaths();
  return { data: true };
}

type CourseInput = {
  code: string;
  title: string;
  lecture_hour?: number | null;
  laboratory_hour?: number | null;
};

type UpdateCourseInput = CourseInput & {
  id: string;
};

const normalizeCourseInput = (input: CourseInput) => ({
  code: normalizeCode(input.code),
  title: normalizeName(input.title),
  lecture_hour: input.lecture_hour ?? 0,
  laboratory_hour: input.laboratory_hour ?? 0,
});

const mapCourseMutationError = (error: MutationError) => {
  if (error.code === "23505") {
    const message = error.message?.toLowerCase() ?? "";
    if (message.includes("code")) {
      return "Course code already exists";
    }
    return "Course already exists";
  }

  return error.message ?? "Unexpected error";
};

export async function createCourse(
  input: CourseInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.code?.trim()) return { error: "Course code is required" };
  if (!input.title?.trim()) return { error: "Course title is required" };
  if (
    input.lecture_hour !== undefined &&
    input.lecture_hour !== null &&
    (!Number.isFinite(input.lecture_hour) || input.lecture_hour < 0)
  ) {
    return { error: "Lecture hour must be zero or greater" };
  }
  if (
    input.laboratory_hour !== undefined &&
    input.laboratory_hour !== null &&
    (!Number.isFinite(input.laboratory_hour) || input.laboratory_hour < 0)
  ) {
    return { error: "Laboratory hour must be zero or greater" };
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
  revalidateCourseOfferingsPaths();
  return { data: { id: data.id } };
}

export async function updateCourse(
  input: UpdateCourseInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Course ID is required" };
  if (!input.code?.trim()) return { error: "Course code is required" };
  if (!input.title?.trim()) return { error: "Course title is required" };
  if (
    input.lecture_hour !== undefined &&
    input.lecture_hour !== null &&
    (!Number.isFinite(input.lecture_hour) || input.lecture_hour < 0)
  ) {
    return { error: "Lecture hour must be zero or greater" };
  }
  if (
    input.laboratory_hour !== undefined &&
    input.laboratory_hour !== null &&
    (!Number.isFinite(input.laboratory_hour) || input.laboratory_hour < 0)
  ) {
    return { error: "Laboratory hour must be zero or greater" };
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
  revalidateCourseOfferingsPaths();
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
  revalidateCourseOfferingsPaths();
  return { data: true };
}

type ProgramInput = {
  department_id: string;
  code: string;
  name: string;
  description?: string | null;
};

type UpdateProgramInput = ProgramInput & {
  id: string;
};

const normalizeProgramInput = (input: ProgramInput) => ({
  department_id: input.department_id.trim(),
  code: normalizeCode(input.code),
  name: normalizeName(input.name),
  description: normalizeDescription(input.description),
});

export async function createProgram(
  input: ProgramInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.department_id?.trim()) return { error: "Department is required" };
  if (!input.code?.trim()) return { error: "Program code is required" };
  if (!input.name?.trim()) return { error: "Program name is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("program")
    .insert(normalizeProgramInput(input))
    .select("id")
    .single();

  if (error) {
    return { error: mapDuplicateError("Program", "code", error) };
  }

  revalidateProgramsPaths(data.id);
  revalidateDepartmentProgramsPaths(input.department_id, data.id);
  return { data: { id: data.id } };
}

export async function updateProgram(
  input: UpdateProgramInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Program ID is required" };
  if (!input.department_id?.trim()) return { error: "Department is required" };
  if (!input.code?.trim()) return { error: "Program code is required" };
  if (!input.name?.trim()) return { error: "Program name is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("program")
    .update(normalizeProgramInput(input))
    .eq("id", input.id);

  if (error) {
    return { error: mapDuplicateError("Program", "code", error) };
  }

  revalidateProgramsPaths(input.id);
  revalidateDepartmentProgramsPaths(input.department_id, input.id);
  return { data: true };
}

export async function deleteProgram(
  programId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!programId?.trim()) return { error: "Program ID is required" };

  const supabase = await createClient();

  const { data: existingProgram } = await supabase
    .from("program")
    .select("id, department_id")
    .eq("id", programId)
    .maybeSingle();

  const { error } = await supabase.from("program").delete().eq("id", programId);

  if (error) {
    return { error: error.message };
  }

  revalidateProgramsPaths();
  if (existingProgram?.department_id) {
    revalidateDepartmentProgramsPaths(existingProgram.department_id);
  }
  revalidateMajorsPaths();
  revalidateProgramOfferingsPaths();
  return { data: true };
}

type ProgramOfferingInput = {
  campus_id: string;
  program_id: string;
};

type UpdateProgramOfferingInput = ProgramOfferingInput & {
  id: string;
};

export async function createProgramOffering(
  input: ProgramOfferingInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.campus_id?.trim()) return { error: "Campus is required" };
  if (!input.program_id?.trim()) return { error: "Program is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("program_campus")
    .insert({
      campus_id: input.campus_id.trim(),
      program_id: input.program_id.trim(),
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: mapDuplicateError(
        "Program offering",
        "for this campus and program",
        error,
      ),
    };
  }

  revalidateProgramOfferingsPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateProgramOffering(
  input: UpdateProgramOfferingInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Program offering ID is required" };
  if (!input.campus_id?.trim()) return { error: "Campus is required" };
  if (!input.program_id?.trim()) return { error: "Program is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("program_campus")
    .update({
      campus_id: input.campus_id.trim(),
      program_id: input.program_id.trim(),
    })
    .eq("id", input.id);

  if (error) {
    return {
      error: mapDuplicateError(
        "Program offering",
        "for this campus and program",
        error,
      ),
    };
  }

  revalidateProgramOfferingsPaths(input.id);
  return { data: true };
}

export async function deleteProgramOffering(
  offeringId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!offeringId?.trim()) return { error: "Program offering ID is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("program_campus")
    .delete()
    .eq("id", offeringId);

  if (error) {
    return { error: error.message };
  }

  revalidateProgramOfferingsPaths();
  revalidateMajorOfferingsPaths();
  return { data: true };
}

type MajorInput = {
  program_id: string;
  code: string;
  name: string;
  description?: string | null;
};

type UpdateMajorInput = MajorInput & {
  id: string;
};

const normalizeMajorInput = (input: MajorInput) => ({
  program_id: input.program_id.trim(),
  code: normalizeCode(input.code),
  name: normalizeName(input.name),
  description: normalizeDescription(input.description),
});

export async function createMajor(
  input: MajorInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.program_id?.trim()) return { error: "Program is required" };
  if (!input.code?.trim()) return { error: "Major code is required" };
  if (!input.name?.trim()) return { error: "Major name is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("major")
    .insert(normalizeMajorInput(input))
    .select("id")
    .single();

  if (error) {
    return { error: mapDuplicateError("Major", "code in this program", error) };
  }

  revalidateMajorsPaths(data.id);
  const { data: parentProgram } = await supabase
    .from("program")
    .select("id, department_id")
    .eq("id", input.program_id)
    .maybeSingle();
  if (parentProgram?.department_id) {
    revalidateProgramMajorsPaths(
      parentProgram.department_id,
      input.program_id,
      data.id,
    );
  }
  return { data: { id: data.id } };
}

export async function updateMajor(
  input: UpdateMajorInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Major ID is required" };
  if (!input.program_id?.trim()) return { error: "Program is required" };
  if (!input.code?.trim()) return { error: "Major code is required" };
  if (!input.name?.trim()) return { error: "Major name is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("major")
    .update(normalizeMajorInput(input))
    .eq("id", input.id);

  if (error) {
    return { error: mapDuplicateError("Major", "code in this program", error) };
  }

  revalidateMajorsPaths(input.id);
  const { data: parentProgram } = await supabase
    .from("program")
    .select("id, department_id")
    .eq("id", input.program_id)
    .maybeSingle();
  if (parentProgram?.department_id) {
    revalidateProgramMajorsPaths(
      parentProgram.department_id,
      input.program_id,
      input.id,
    );
  }
  return { data: true };
}

export async function deleteMajor(
  majorId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!majorId?.trim()) return { error: "Major ID is required" };

  const supabase = await createClient();

  const { data: existingMajor } = await supabase
    .from("major")
    .select("id, program_id")
    .eq("id", majorId)
    .maybeSingle();

  let departmentId: string | undefined;
  if (existingMajor?.program_id) {
    const { data: parentProgram } = await supabase
      .from("program")
      .select("department_id")
      .eq("id", existingMajor.program_id)
      .maybeSingle();
    departmentId = parentProgram?.department_id;
  }

  const { error } = await supabase.from("major").delete().eq("id", majorId);

  if (error) {
    return { error: error.message };
  }

  revalidateMajorsPaths();
  if (departmentId && existingMajor?.program_id) {
    revalidateProgramMajorsPaths(departmentId, existingMajor.program_id);
  }
  revalidateMajorOfferingsPaths();
  return { data: true };
}

type MajorOfferingInput = {
  program_campus_id: string;
  major_id: string;
};

type UpdateMajorOfferingInput = MajorOfferingInput & {
  id: string;
};

export async function createMajorOffering(
  input: MajorOfferingInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.program_campus_id?.trim()) {
    return { error: "Program offering is required" };
  }
  if (!input.major_id?.trim()) return { error: "Major is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("major_p_c")
    .insert({
      program_campus_id: input.program_campus_id.trim(),
      major_id: input.major_id.trim(),
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: mapDuplicateError(
        "Major offering",
        "for this program offering and major",
        error,
      ),
    };
  }

  const { data: parentOffering } = await supabase
    .from("program_campus")
    .select("id, campus_id")
    .eq("id", input.program_campus_id)
    .maybeSingle();

  revalidateMajorOfferingsPaths(data.id);
  if (parentOffering?.campus_id) {
    revalidateCampusProgramMajorOfferingsPaths(
      parentOffering.campus_id,
      input.program_campus_id,
      data.id,
    );
  }
  return { data: { id: data.id } };
}

export async function updateMajorOffering(
  input: UpdateMajorOfferingInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Major offering ID is required" };
  if (!input.program_campus_id?.trim()) {
    return { error: "Program offering is required" };
  }
  if (!input.major_id?.trim()) return { error: "Major is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("major_p_c")
    .update({
      program_campus_id: input.program_campus_id.trim(),
      major_id: input.major_id.trim(),
    })
    .eq("id", input.id);

  if (error) {
    return {
      error: mapDuplicateError(
        "Major offering",
        "for this program offering and major",
        error,
      ),
    };
  }

  const { data: parentOffering } = await supabase
    .from("program_campus")
    .select("id, campus_id")
    .eq("id", input.program_campus_id)
    .maybeSingle();

  revalidateMajorOfferingsPaths(input.id);
  if (parentOffering?.campus_id) {
    revalidateCampusProgramMajorOfferingsPaths(
      parentOffering.campus_id,
      input.program_campus_id,
      input.id,
    );
  }
  return { data: true };
}

export async function deleteMajorOffering(
  majorOfferingId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!majorOfferingId?.trim())
    return { error: "Major offering ID is required" };

  const supabase = await createClient();

  const { data: existingMajorOffering } = await supabase
    .from("major_p_c")
    .select("id, program_campus_id")
    .eq("id", majorOfferingId)
    .maybeSingle();

  let campusId: string | undefined;
  if (existingMajorOffering?.program_campus_id) {
    const { data: parentOffering } = await supabase
      .from("program_campus")
      .select("campus_id")
      .eq("id", existingMajorOffering.program_campus_id)
      .maybeSingle();
    campusId = parentOffering?.campus_id;
  }

  const { error } = await supabase
    .from("major_p_c")
    .delete()
    .eq("id", majorOfferingId);

  if (error) {
    return { error: error.message };
  }

  revalidateMajorOfferingsPaths();
  if (campusId && existingMajorOffering?.program_campus_id) {
    revalidateCampusProgramMajorOfferingsPaths(
      campusId,
      existingMajorOffering.program_campus_id,
    );
  }
  return { data: true };
}

type CourseOfferingInput = {
  campus_id: string;
  course_id: string;
  academic_term_id: string;
};

type UpdateCourseOfferingInput = CourseOfferingInput & {
  id: string;
};

export async function createCourseOffering(
  input: CourseOfferingInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.campus_id?.trim()) return { error: "Campus is required" };
  if (!input.course_id?.trim()) return { error: "Course is required" };
  if (!input.academic_term_id?.trim())
    return { error: "Academic term is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_campus_at")
    .insert({
      campus_id: input.campus_id.trim(),
      course_id: input.course_id.trim(),
      academic_term_id: input.academic_term_id.trim(),
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: mapDuplicateError(
        "Course offering",
        "for this campus, course, and term",
        error,
      ),
    };
  }

  revalidateCourseOfferingsPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateCourseOffering(
  input: UpdateCourseOfferingInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Course offering ID is required" };
  if (!input.campus_id?.trim()) return { error: "Campus is required" };
  if (!input.course_id?.trim()) return { error: "Course is required" };
  if (!input.academic_term_id?.trim())
    return { error: "Academic term is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("course_campus_at")
    .update({
      campus_id: input.campus_id.trim(),
      course_id: input.course_id.trim(),
      academic_term_id: input.academic_term_id.trim(),
    })
    .eq("id", input.id);

  if (error) {
    return {
      error: mapDuplicateError(
        "Course offering",
        "for this campus, course, and term",
        error,
      ),
    };
  }

  revalidateCourseOfferingsPaths(input.id);
  return { data: true };
}

export async function deleteCourseOffering(
  courseOfferingId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!courseOfferingId?.trim())
    return { error: "Course offering ID is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("course_campus_at")
    .delete()
    .eq("id", courseOfferingId);

  if (error) {
    return { error: error.message };
  }

  revalidateCourseOfferingsPaths();
  return { data: true };
}

type BlockInput = {
  major_p_c_id: string;
  year_level: number;
  section: string;
  student_count?: number | null;
};

type UpdateBlockInput = BlockInput & {
  id: string;
};

const normalizeBlockInput = (input: BlockInput) => ({
  major_p_c_id: input.major_p_c_id.trim(),
  year_level: input.year_level,
  section: normalizeCode(input.section),
  student_count: input.student_count ?? null,
});

export async function createBlock(
  input: BlockInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.major_p_c_id?.trim())
    return { error: "Major offering is required" };
  if (!Number.isFinite(input.year_level) || input.year_level <= 0) {
    return { error: "Year level must be greater than zero" };
  }
  if (!input.section?.trim()) return { error: "Section is required" };
  if (
    input.student_count !== undefined &&
    input.student_count !== null &&
    (!Number.isFinite(input.student_count) || input.student_count < 0)
  ) {
    return { error: "Student count must be zero or greater" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("block")
    .insert(normalizeBlockInput(input))
    .select("id")
    .single();

  if (error) {
    return {
      error: mapDuplicateError(
        "Block",
        "for this major offering, year level, and section",
        error,
      ),
    };
  }

  revalidateBlocksPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateBlock(
  input: UpdateBlockInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Block ID is required" };
  if (!input.major_p_c_id?.trim())
    return { error: "Major offering is required" };
  if (!Number.isFinite(input.year_level) || input.year_level <= 0) {
    return { error: "Year level must be greater than zero" };
  }
  if (!input.section?.trim()) return { error: "Section is required" };
  if (
    input.student_count !== undefined &&
    input.student_count !== null &&
    (!Number.isFinite(input.student_count) || input.student_count < 0)
  ) {
    return { error: "Student count must be zero or greater" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("block")
    .update(normalizeBlockInput(input))
    .eq("id", input.id);

  if (error) {
    return {
      error: mapDuplicateError(
        "Block",
        "for this major offering, year level, and section",
        error,
      ),
    };
  }

  revalidateBlocksPaths(input.id);
  return { data: true };
}

export async function deleteBlock(
  blockId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!blockId?.trim()) return { error: "Block ID is required" };

  const supabase = await createClient();

  const { error } = await supabase.from("block").delete().eq("id", blockId);

  if (error) {
    return { error: error.message };
  }

  revalidateBlocksPaths();
  return { data: true };
}
