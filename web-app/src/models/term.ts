export type AcademicTermType = "SEMESTER" | "TRIMESTER" | "QUARTER";

export type AcademicTermOrder = "FIRST" | "SECOND" | "THIRD" | "FOURTH";

export type AcademicTerm = {
  id: string;
  academic_year_start: number;
  academic_year_end: number;
  code: string;
  term_order: AcademicTermOrder;
  type: AcademicTermType;
  start: string | null;
  end: string | null;
};

export type Term = AcademicTerm;
