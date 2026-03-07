import { Program } from "./program";

export type Major = {
  id: string;
  code: string;
  program_id: string;
  name: string;
  description: string | null;
};

export type ExtendedMajor = Major & {
  program: Program;
};
