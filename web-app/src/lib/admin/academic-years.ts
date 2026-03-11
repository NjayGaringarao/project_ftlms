"use server";

import { AcademicYear } from "@/models/academic_year";
import { createClient } from "@/utils/supabase/server";

export type AcademicYearListItem = Pick<
  AcademicYear,
  "id" | "code" | "start_year" | "end_year"
>;

export const getAcademicYearsList = async (): Promise<AcademicYearListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_year")
    .select("id, code, start_year, end_year")
    .order("start_year", { ascending: false })
    .order("end_year", { ascending: false });

  if (error) {
    console.error("lib.admin.academic-years.getAcademicYearsList ::", error);
    return [];
  }

  return (data ?? []) as AcademicYearListItem[];
};

export const getAcademicYearById = async (
  yearId: string,
): Promise<AcademicYear | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_year")
    .select("id, code, start_year, end_year")
    .eq("id", yearId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.academic-years.getAcademicYearById ::", error);
    return null;
  }

  return (data ?? null) as AcademicYear | null;
};
