import { User } from "./user";

export type Designation = {
  id: string;
  user_id: string;
  position: string;
  department: string;
  load: number;
};

export type ExtendedDesignation = Designation & {
  user: User;
};
