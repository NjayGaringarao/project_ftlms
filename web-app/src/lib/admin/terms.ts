"use server";

import { ExtendedAcademicTerm } from "@/models/academic_term";
import { createClient } from "@/utils/supabase/server";

export type TermListItem = ExtendedAcademicTerm;

type RawTermRow = {
  id: string;
  code: string;
  academic_year_id: string;
  name: ExtendedAcademicTerm["name"];
  start: string;
  end: string;
  academic_year:
    | {
        id: string;
        code: string;
        start_year: number;
        end_year: number;
      }
    | Array<{
        id: string;
        code: string;
        start_year: number;
        end_year: number;
      }>;
};

const normalizeTerm = (value: RawTermRow): ExtendedAcademicTerm => {
  const yearValue = Array.isArray(value.academic_year)
    ? value.academic_year[0]
    : value.academic_year;

  return {
    id: value.id,
    code: value.code,
    academic_year_id: value.academic_year_id,
    name: value.name,
    start: value.start,
    end: value.end,
    academic_year: {
      id: yearValue?.id,
      code: yearValue?.code,
      start_year: yearValue?.start_year,
      end_year: yearValue?.end_year,
    },
  };
};

export const getTermsList = async (): Promise<TermListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_term")
    .select(
      "id, code, academic_year_id, name, start, end, academic_year:academic_year_id (id, code, start_year, end_year)",
    )
    .order("end", { ascending: false });

  if (error) {
    console.error("lib.admin.terms.getTermsList ::", error);
    return [];
  }

  return (data ?? []).map(normalizeTerm);
};

export const getTermById = async (
  termId: string,
): Promise<ExtendedAcademicTerm | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_term")
    .select(
      "id, code, academic_year_id, name, start, end, academic_year:academic_year_id (id, code, start_year, end_year)",
    )
    .eq("id", termId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.terms.getTermById ::", error);
    return null;
  }

  if (!data) return null;

  return normalizeTerm(data);
};

export const getTermsByAcademicYearId = async (
  academicYearId: string,
): Promise<TermListItem[]> => {
  const terms = await getTermsList();
  return terms.filter((term) => term.academic_year_id === academicYearId);
};

export const getDefaultAcademicTerm = async (): Promise<TermListItem | null> => {
  const terms = await getTermsList();
  return terms[0] ?? null;
};
