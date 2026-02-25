import { MajorPC } from "./major-p-c";

export type Block = {
  id: string;
  major_p_c_id: string;
  year_level: number;
  section: string;
  student_count: number | null;
};

export type ExtendedBlock = Block & {
  major_p_c: MajorPC;
};
