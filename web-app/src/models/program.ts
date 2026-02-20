import { College } from "./college";
import { User } from "./user";

export type Program = {
  id: string;
  college_id: string | null;
  chair_id: string | null;
  name: string;
  description: string | null;
};

export type ExtendedProgram = Program & {
  college: College | null;
  chair: User | null;
};
