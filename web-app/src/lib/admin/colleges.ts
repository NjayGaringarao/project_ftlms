"use server";

import { College } from "@/models/college";
import { createClient } from "@/utils/supabase/server";

export type CollegeListItem = Pick<
  College,
  "id" | "code" | "name" | "description"
>;

export const getCollegesList = async (): Promise<CollegeListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("college")
    .select("id, code, name, description")
    .order("name", { ascending: true });

  if (error) {
    console.error("lib.admin.colleges.getCollegesList ::", error);
    return [];
  }

  return (data ?? []) as CollegeListItem[];
};

export const getCollegeById = async (
  collegeId: string,
): Promise<College | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("college")
    .select("id, code, name, description")
    .eq("id", collegeId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.colleges.getCollegeById ::", error);
    return null;
  }

  return (data ?? null) as College | null;
};
