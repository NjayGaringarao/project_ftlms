import { Major } from "./major";
import { ProgramCampus } from "./program-campus";

export type MajorPC = {
  id: string;
  program_campus_id: string;
  major_id: string;
};

export type ExtendedMajorPC = MajorPC & {
  program_campus: ProgramCampus;
  major: Major;
};
