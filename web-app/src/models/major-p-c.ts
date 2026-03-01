import { Major } from "./major";
import { ExtendedProgramOffering } from "./program-campus";

export type MajorOffering = {
  id: string;
  program_offering_id: string;
  major_id: string;
};

export type ExtendedMajorOffering = MajorOffering & {
  program_offering: ExtendedProgramOffering;
  major: Major;
};

export type MajorPC = MajorOffering;
export type ExtendedMajorPC = ExtendedMajorOffering;
