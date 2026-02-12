import { Program } from "./program";

export type Block = {
  id: string;
  program_id: string;
  year_level: number;
  section: string;
};

export type ExtendedBlock = Block & {
  program: Program;
};
