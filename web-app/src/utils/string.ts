import { ExtendedAcademicTerm } from "@/features/shared/types/models";

export const formatAcademicTermLabel = (
  academicTerm: ExtendedAcademicTerm,
): string => {
  return `${academicTerm.name} | AY ${academicTerm.academic_year.start_year}-${academicTerm.academic_year.end_year}`;
};
