import { UserOverviewReadModel } from "@/lib/user-overview";

export type UsersListItem = {
  id: string;
  email: string | null;
  employment_status: string | null;
  identity: UserOverviewReadModel["identity"];
};

export type UserDetail = {
  id: string;
  email: string | null;
  employment_status: string | null;
  identity: UserOverviewReadModel["identity"];
  rank: UserOverviewReadModel["rank"];
  designations: UserOverviewReadModel["designations"];
  degrees: UserOverviewReadModel["degrees"];
  account_type: UserOverviewReadModel["accountType"];
  email_confirmed_at: UserOverviewReadModel["emailConfirmedAt"];
  account_created_at: UserOverviewReadModel["accountCreatedAt"];
  last_sign_in_at: UserOverviewReadModel["lastSignInAt"];
  term: UserOverviewReadModel["term"];
  classes: UserOverviewReadModel["classes"];
  actual_teaching_load: UserOverviewReadModel["actualTeachingLoad"];
  designation_load: UserOverviewReadModel["designationLoad"];
  total_working_load: UserOverviewReadModel["totalWorkingLoad"];
};
