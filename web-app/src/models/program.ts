import { College } from "./college";

export type Program = {
  id: string;
  code: string;
  college_id: string;
  name: string;
  description: string | null;
};

export type ExtendedProgram = Program & {
  college: College;
};
