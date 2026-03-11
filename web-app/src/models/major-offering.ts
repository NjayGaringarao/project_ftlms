import { Major } from "./major";
import { ProgramOffering } from "./program-offering";

export type MajorOffering = {
  id: string;
  code: string;
  program_offering_id: string;
  major_id: string;
};

export type ExtendedMajorOffering = MajorOffering & {
  program_offering: ProgramOffering;
  major: Major;
};
