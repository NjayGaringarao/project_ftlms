"use server";

import { Department } from "@/models/department";
import { createClient } from "@/utils/supabase/server";

export type DepartmentListItem = Pick<
  Department,
  "id" | "code" | "name" | "type" | "description"
>;

export const getDepartmentsList = async (): Promise<DepartmentListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("department")
    .select("id, code, name, type, description")
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.university.departments.getDepartmentsList ::", error);
    return [];
  }

  return (data ?? []) as DepartmentListItem[];
};

export const getDepartmentById = async (
  departmentId: string,
): Promise<Department | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("department")
    .select("id, code, name, type, description")
    .eq("id", departmentId)
    .maybeSingle();

  if (error) {
    console.error("lib.university.departments.getDepartmentById ::", error);
    return null;
  }

  return (data ?? null) as Department | null;
};
