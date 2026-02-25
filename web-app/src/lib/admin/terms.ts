"use server";

import { Term } from "@/models/term";
import { createClient } from "@/utils/supabase/server";

export type TermListItem = Pick<
  Term,
  | "id"
  | "academic_year_start"
  | "academic_year_end"
  | "code"
  | "term_order"
  | "type"
  | "start"
  | "end"
>;

export const getTermsList = async (): Promise<TermListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_term")
    .select(
      "id, academic_year_start, academic_year_end, code, term_order, type, start, end",
    )
    .order("academic_year_start", { ascending: false })
    .order("academic_year_end", { ascending: false })
    .order("type", { ascending: true })
    .order("term_order", { ascending: true });

  if (error) {
    console.error("lib.admin.terms.getTermsList ::", error);
    return [];
  }

  return (data ?? []) as TermListItem[];
};

export const getTermById = async (termId: string): Promise<Term | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_term")
    .select(
      "id, academic_year_start, academic_year_end, code, term_order, type, start, end",
    )
    .eq("id", termId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.terms.getTermById ::", error);
    return null;
  }

  return (data ?? null) as Term | null;
};
