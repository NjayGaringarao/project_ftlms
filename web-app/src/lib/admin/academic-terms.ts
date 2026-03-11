import { AcademicTermName, ExtendedAcademicTerm } from "@/models";

export const ACADEMIC_TERM_NAMES: AcademicTermName[] = [
  "FIRST SEMESTER",
  "SECOND SEMESTER",
  "MIDYEAR",
];

const TERM_NAME_SHORT_LABELS: Record<AcademicTermName, string> = {
  "FIRST SEMESTER": "FIRST SEM",
  "SECOND SEMESTER": "SECOND SEM",
  MIDYEAR: "MIDYEAR",
};

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

export const generateAcademicTermCode = (term: {
  name: AcademicTermName;
  academic_year_code: string;
}) =>
  `${TERM_NAME_SHORT_LABELS[term.name]} - AY ${term.academic_year_code}`;

export const sortAcademicTermsDesc = (terms: ExtendedAcademicTerm[]) =>
  [...terms].sort((left, right) => {
    if (left.academic_year.start_year !== right.academic_year.start_year) {
      return right.academic_year.start_year - left.academic_year.start_year;
    }

    if (left.academic_year.end_year !== right.academic_year.end_year) {
      return right.academic_year.end_year - left.academic_year.end_year;
    }

    if (left.name !== right.name) {
      return ACADEMIC_TERM_NAMES.indexOf(left.name) - ACADEMIC_TERM_NAMES.indexOf(right.name);
    }

    return left.start.localeCompare(right.start);
  });
