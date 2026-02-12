import { User } from "./user";

export type Degree = {
  id: string;
  user_id: string;
  level: string;
  name: string;
  year_earned: number | null;
};

export type ExtendedDegree = Degree & {
  user: User;
};
