import { Class } from "./class";
import { User } from "./user";

export type UserClass = {
  id: string;
  user_id: string;
  class_id: string;
  created_at?: string | null;
};

export type ExtendedUserClass = UserClass & {
  user: User;
  class: Class;
};
