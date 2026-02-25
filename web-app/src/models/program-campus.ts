import { Campus } from "./campus";
import { ExtendedProgram } from "./program";

export type ProgramCampus = {
  id: string;
  campus_id: string;
  program_id: string;
};

export type ExtendedProgramCampus = ProgramCampus & {
  campus: Campus;
  program: ExtendedProgram;
};
