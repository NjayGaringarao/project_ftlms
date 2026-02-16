import { User } from "./user";

export type Degree = {
  id: string;
  user_id: string;
  academic_level: string; // Bachelor's, Master's, PhD, etc.
  degree_type: string; // Arts, Science, Engineering, etc.
  field_of_study: string; // Computer Science, Business Administration, etc.
  year_graduated: number | null; // Null if still studying or year not provided
  institution: string; // President Ramon Magsaysay State University, etc.
  country_code: string; // PH, US, etc.
  created_at: string;
  updated_at: string;
};

export type ExtendedDegree = Degree & {
  user: User;
};
