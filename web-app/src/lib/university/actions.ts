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
  revalidatePath("/university/departments");
  revalidatePath("/university/departments/create");

  if (id) {
    revalidatePath(`/university/departments/${id}`);
    revalidatePath(`/university/departments/${id}/edit`);
  }
};

const revalidateCampusesPaths = (id?: string) => {
  revalidatePath("/university/campuses");
  revalidatePath("/university/campuses/create");

  if (id) {
    revalidatePath(`/university/campuses/${id}`);
    revalidatePath(`/university/campuses/${id}/edit`);
  }
};

const revalidateSemestersPaths = (id?: string) => {
  revalidatePath("/university/semesters");
  revalidatePath("/university/semesters/create");

  if (id) {
    revalidatePath(`/university/semesters/${id}`);
    revalidatePath(`/university/semesters/${id}/edit`);
  }
};

const revalidateRanksPaths = (id?: string) => {
  revalidatePath("/university/ranks");
  revalidatePath("/university/ranks/create");

  if (id) {
    revalidatePath(`/university/ranks/${id}`);
    revalidatePath(`/university/ranks/${id}/edit`);
  }
};

type DepartmentInput = {
  code: string;
  name: string;
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
  director_id?: string | null;
  address?: string | null;
  zip_code?: string | null;
};

type UpdateCampusInput = CampusInput & {
  id: string;
};

const normalizeCampusInput = (input: CampusInput) => ({
  name: normalizeName(input.name),
  director_id: input.director_id?.trim() || null,
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

type SemesterInput = {
  academic_year: string;
  term: string;
  start: string;
  end: string;
};

type UpdateSemesterInput = SemesterInput & {
  id: string;
};

const normalizeSemesterInput = (input: SemesterInput) => ({
  academic_year: normalizeName(input.academic_year),
  term: normalizeName(input.term),
  start: input.start,
  end: input.end,
});

export async function createSemester(
  input: SemesterInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.academic_year?.trim())
    return { error: "Academic year is required" };
  if (!input.term?.trim()) return { error: "Term is required" };
  if (!input.start?.trim()) return { error: "Start date is required" };
  if (!input.end?.trim()) return { error: "End date is required" };

  if (new Date(input.start) > new Date(input.end)) {
    return { error: "Start date must be before end date" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("semester")
    .insert(normalizeSemesterInput(input))
    .select("id")
    .single();

  if (error) {
    return {
      error: mapDuplicateError("Semester", "academic year and term", error),
    };
  }

  revalidateSemestersPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateSemester(
  input: UpdateSemesterInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Semester ID is required" };
  if (!input.academic_year?.trim())
    return { error: "Academic year is required" };
  if (!input.term?.trim()) return { error: "Term is required" };
  if (!input.start?.trim()) return { error: "Start date is required" };
  if (!input.end?.trim()) return { error: "End date is required" };

  if (new Date(input.start) > new Date(input.end)) {
    return { error: "Start date must be before end date" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("semester")
    .update(normalizeSemesterInput(input))
    .eq("id", input.id);

  if (error) {
    return {
      error: mapDuplicateError("Semester", "academic year and term", error),
    };
  }

  revalidateSemestersPaths(input.id);
  return { data: true };
}

export async function deleteSemester(
  semesterId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!semesterId?.trim()) return { error: "Semester ID is required" };

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("schedule")
    .select("id", { count: "exact", head: true })
    .eq("semester_id", semesterId);

  if (countError) {
    return { error: countError.message };
  }

  if ((count ?? 0) > 0) {
    return {
      error:
        "Cannot delete semester while schedules are attached. Remove or reassign schedules first.",
    };
  }

  const { error } = await supabase
    .from("semester")
    .delete()
    .eq("id", semesterId);

  if (error) {
    return { error: error.message };
  }

  revalidateSemestersPaths();
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
    .from("rank")
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
    .from("rank")
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

  const { error } = await supabase.from("rank").delete().eq("id", rankId);

  if (error) {
    return { error: error.message };
  }

  revalidateRanksPaths();
  return { data: true };
}
