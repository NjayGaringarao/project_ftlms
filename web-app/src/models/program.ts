import { College } from "./college";
import { User } from "./user";

export type Program = {
  id: string;
  college_id: string;
  chair_id: string;
  name: string;
  description: string;
};

export type ExtendedProgram = Program & {
  college: College;
  chair: User;
};
