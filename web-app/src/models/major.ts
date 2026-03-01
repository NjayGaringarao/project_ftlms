import { ExtendedProgram } from "./program";

export type Major = {
  id: string;
  program_id: string;
  code: string;
  name: string;
  description: string | null;
};

export type ExtendedMajor = Major & {
  program: ExtendedProgram;
};
