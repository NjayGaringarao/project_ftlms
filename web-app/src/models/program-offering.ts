import { Campus } from "./campus";
import { Program } from "./program";

export type ProgramOffering = {
  id: string;
  campus_id: string;
  program_id: string;
};

export type ExtendedProgramOffering = ProgramOffering & {
  campus: Campus;
  program: Program;
};
