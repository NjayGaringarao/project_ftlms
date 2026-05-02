import { AcademicTermName } from "@/features/shared/types/models";

export const ACADEMIC_TERM_NAMES: AcademicTermName[] = [
  "FIRST SEMESTER",
  "SECOND SEMESTER",
  "MIDYEAR",
];

export const getAcademicYearLabel = (
  academicYearStart: number,
  academicYearEnd: number,
) => `${academicYearStart}-${academicYearEnd}`;

export const getAcademicTermNameLabel = (name: AcademicTermName) => name;

export const getAcademicTermDisplayLabel = (term: {
  name: AcademicTermName;
  academic_year: {
    start_year: number;
    end_year: number;
  };
}) =>
  `${getAcademicTermNameLabel(term.name)}, A.Y. ${getAcademicYearLabel(term.academic_year.start_year, term.academic_year.end_year)}`;
