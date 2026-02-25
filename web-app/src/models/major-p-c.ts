import { Major } from "./major";
import { ExtendedProgramCampus, ProgramCampus } from "./program-campus";

export type MajorPC = {
  id: string;
  program_campus_id: string;
  major_id: string;
};

export type ExtendedMajorPC = MajorPC & {
  program_campus: ExtendedProgramCampus;
  major: Major;
};
