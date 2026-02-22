import { Campus } from "./campus";
import { Department } from "./department";
import { User } from "./user";

export type Program = {
  id: string;
  department_id: string | null;
  campus_id: string | null;
  chair_id: string | null;
  name: string;
  code: string;
  description: string | null;
};

export type ExtendedProgram = Program & {
  department: Department | null;
  campus: Campus | null;
  chair: User | null;
};
