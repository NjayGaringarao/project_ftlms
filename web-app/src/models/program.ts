import { Department } from "./department";

export type Program = {
  id: string;
  department_id: string;
  name: string;
  code: string;
  description: string | null;
};

export type ExtendedProgram = Program & {
  department: Department;
};
