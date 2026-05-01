import { User } from "./user";

export type AcademicLevelType =
  | "Bachelor's Degree"
  | "Master's Degree"
  | "Doctorate Degree";

export type Degree = {
  id: string;
  user_id: string;
  academic_level: AcademicLevelType;
  title: string;
  year_graduated: number | null;
  institution: string;
  country_code: string;
  created_at: string;
  updated_at: string;
};

export type ExtendedDegree = Degree & {
  user: User;
};
