"use server";

import { Semester } from "@/models/semester";
import { createClient } from "@/utils/supabase/server";

export type SemesterListItem = Pick<
  Semester,
  "id" | "academic_year" | "term" | "start" | "end"
>;

export const getSemestersList = async (): Promise<SemesterListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("semester")
    .select("id, academic_year, term, start, end")
    .order("start", { ascending: false });

  if (error) {
    console.error("lib.university.semesters.getSemestersList ::", error);
    return [];
  }

  return (data ?? []) as SemesterListItem[];
};

export const getSemesterById = async (
  semesterId: string,
): Promise<Semester | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("semester")
    .select("id, academic_year, term, start, end")
    .eq("id", semesterId)
    .maybeSingle();

  if (error) {
    console.error("lib.university.semesters.getSemesterById ::", error);
    return null;
  }

  return (data ?? null) as Semester | null;
};
