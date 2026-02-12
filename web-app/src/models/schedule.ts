import { Semester } from "./semester";
import { User } from "./user";

export type Schedule = {
  id: string;
  user_id: string;
  semester_id: string;
  updated_at: string | null;
};

export type ExtendedSchedule = Schedule & {
  user: User;
  semester: Semester;
};
