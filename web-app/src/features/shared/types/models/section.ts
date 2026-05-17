import { MajorOffering } from "./major-offering";

export type Section = {
  id: string;
  code: string;
  major_offering_id: string;
  academic_term_id: string;
  year_level: number;
  name: string;
  classification: "regular" | "irregular";
  student_count: number | null;
};

export type ExtendedSection = Section & {
  major_offering: MajorOffering;
};
