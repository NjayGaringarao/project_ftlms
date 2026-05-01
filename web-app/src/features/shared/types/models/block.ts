import { MajorOffering } from "./major-offering";

export type Block = {
  id: string;
  code: string;
  major_offering_id: string;
  academic_term_id: string;
  year_level: number;
  section: string;
  student_count: number | null;
};

export type ExtendedBlock = Block & {
  major_offering: MajorOffering;
};
