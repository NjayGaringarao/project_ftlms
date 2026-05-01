import { UserDataReadModel } from "@/features/profile/lib/user-data";

export type UsersListItem = {
  id: string;
  email: string | null;
  employment_status: string | null;
  identity: UserDataReadModel["identity"];
  campus: UserDataReadModel["campus"];
  college: UserDataReadModel["college"];
};

export type UserDetail = {
  id: string;
  email: string | null;
  employment_status: string | null;
  identity: UserDataReadModel["identity"];
  campus_id: UserDataReadModel["campus_id"];
  college_id: UserDataReadModel["college_id"];
  campus: UserDataReadModel["campus"];
  college: UserDataReadModel["college"];
  rank: UserDataReadModel["rank"];
  designations: UserDataReadModel["designations"];
  degrees: UserDataReadModel["degrees"];
  account_type: UserDataReadModel["accountType"];
  email_confirmed_at: UserDataReadModel["emailConfirmedAt"];
  account_created_at: UserDataReadModel["accountCreatedAt"];
  last_sign_in_at: UserDataReadModel["lastSignInAt"];
  term: UserDataReadModel["term"];
  classes: UserDataReadModel["classes"];
  actual_teaching_load: UserDataReadModel["actualTeachingLoad"];
  designation_load: UserDataReadModel["designationLoad"];
  total_working_load: UserDataReadModel["totalWorkingLoad"];
};
