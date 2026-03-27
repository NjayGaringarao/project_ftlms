"use server";

import { createClient } from "@/utils/supabase/server";
import {
  mapCollegeMutationError,
  normalizeCode,
  normalizeDescription,
  normalizeName,
  revalidateCollegesPaths,
} from "./shared";

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
  if (!input.code?.trim()) return { error: "College code is required" };
  if (!input.name?.trim()) return { error: "College name is required" };

  const supabase = await createClient();

  const payload = {
    code: normalizeCode(input.code),
    name: normalizeName(input.name),
    description: normalizeDescription(input.description),
  };

  const { data, error } = await supabase
    .from("college")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return { error: mapCollegeMutationError(error) };
  }

  revalidateCollegesPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateDepartment(
  input: UpdateDepartmentInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "College ID is required" };
  if (!input.code?.trim()) return { error: "College code is required" };
  if (!input.name?.trim()) return { error: "College name is required" };

  const supabase = await createClient();

  const payload = {
    code: normalizeCode(input.code),
    name: normalizeName(input.name),
    description: normalizeDescription(input.description),
  };

  const { error } = await supabase
    .from("college")
    .update(payload)
    .eq("id", input.id);

  if (error) {
    return { error: mapCollegeMutationError(error) };
  }

  revalidateCollegesPaths(input.id);
  return { data: true };
}

export async function deleteDepartment(
  departmentId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!departmentId?.trim()) return { error: "College ID is required" };

  const supabase = await createClient();

  const { error } = await supabase.from("college").delete().eq("id", departmentId);

  if (error) {
    return { error: mapCollegeMutationError(error) };
  }

  revalidateCollegesPaths();
  return { data: true };
}
