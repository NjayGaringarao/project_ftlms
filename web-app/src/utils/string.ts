import { AcademicTerm } from "@/models";

export const formatAcademicTermLabel = (academicTerm: AcademicTerm): string => {
  return `${academicTerm.term_order} ${academicTerm.type} | AY ${academicTerm.academic_year_start}-${academicTerm.academic_year_end}`;
};
