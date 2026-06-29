import { User } from "./user";

export type AcademicLevelType =
  | "Bachelor's Degree"
  | "Master's Degree"
  | "Doctorate Degree"
  | "Post Doctorate Degree";

export type Degree = {
  id: string;
  user_id: string;
  academic_level: AcademicLevelType;
  title: string;
  year_graduated: number | null;
  institution: string | null;
  country_code: string | null;
  created_at: string;
  updated_at: string;
};

export type ExtendedDegree = Degree & {
  user: User;
};
