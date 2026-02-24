"use server";

import { Term } from "@/models/term";
import { createClient } from "@/utils/supabase/server";

export type TermListItem = Pick<
  Term,
  "id" | "academic_year" | "term_code" | "sequence" | "start" | "end"
>;

export const getTermsList = async (): Promise<TermListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_term")
    .select("id, academic_year, term_code, sequence, start, end")
    .order("start", { ascending: false });

  if (error) {
    console.error("lib.university.terms.getTermsList ::", error);
    return [];
  }

  return (data ?? []) as TermListItem[];
};

export const getTermById = async (termId: string): Promise<Term | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_term")
    .select("id, academic_year, term_code, sequence, start, end")
    .eq("id", termId)
    .maybeSingle();

  if (error) {
    console.error("lib.university.terms.getTermById ::", error);
    return null;
  }

  return (data ?? null) as Term | null;
};
