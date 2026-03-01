import { Campus } from "./campus";
import { ExtendedProgram } from "./program";

export type ProgramOffering = {
  id: string;
  campus_id: string;
  program_id: string;
};

export type ExtendedProgramOffering = ProgramOffering & {
  campus: Campus;
  program: ExtendedProgram;
};

export type ProgramCampus = ProgramOffering;
export type ExtendedProgramCampus = ExtendedProgramOffering;
