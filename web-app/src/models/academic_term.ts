import { AcademicYear } from "./academic_year";

export type AcademicTermName = "FIRST SEMESTER" | "SECOND SEMESTER" | "MIDYEAR";

export type AcademicTerm = {
  id: string;
  code: string;
  academic_year_id: string;
  name: AcademicTermName;
  start: string;
  end: string;
};

export type ExtendedAcademicTerm = AcademicTerm & {
  academic_year: AcademicYear;
}