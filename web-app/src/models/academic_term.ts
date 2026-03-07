export type AcademicTermType = "SEMESTER" | "TRIMESTER" | "QUARTER";

export type AcademicTermOrder = "FIRST" | "SECOND" | "THIRD" | "FOURTH";

export type AcademicTerm = {
  id: string;
  code: string;
  academic_year_start: number;
  academic_year_end: number;
  term_order: AcademicTermOrder;
  type: AcademicTermType;
  start: string;
  end: string;
};
