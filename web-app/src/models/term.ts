export type AcademicTerm = {
  id: string;
  academic_year: string;
  term_code: string;
  sequence: number;
  start: string | null;
  end: string | null;
};

export type Term = AcademicTerm;
