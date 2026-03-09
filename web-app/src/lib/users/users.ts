"use server";

import { AcademicRank } from "@/models/academic_rank";
import { getUserOverviewById, getUserOverviewList } from "@/lib/user-overview";
import { createClient } from "@/utils/supabase/server";
import { UserOverviewReadModel } from "@/lib/user-overview";
import { UserDetail, UsersListItem } from "./types";

const mapOverviewToListItem = (
  overview: Awaited<ReturnType<typeof getUserOverviewList>>[number],
): UsersListItem => ({
  id: overview.id,
  email: overview.email,
  employment_status: overview.employmentStatus,
  identity: overview.identity,
});

const mapOverviewToUserDetail = (
  overview: UserOverviewReadModel,
): UserDetail => ({
  id: overview.id,
  email: overview.email,
  employment_status: overview.employmentStatus,
  identity: overview.identity,
  rank: overview.rank,
  designations: overview.designations,
  degrees: overview.degrees,
  account_type: overview.accountType,
  email_confirmed_at: overview.emailConfirmedAt,
  account_created_at: overview.accountCreatedAt,
  last_sign_in_at: overview.lastSignInAt,
  term: overview.term,
  classes: overview.classes,
  actual_teaching_load: overview.actualTeachingLoad,
  designation_load: overview.designationLoad,
  total_working_load: overview.totalWorkingLoad,
});

export const getUsersList = async (): Promise<UsersListItem[]> => {
  const list = await getUserOverviewList();
  return list.map(mapOverviewToListItem);
};

export const getUserById = async (
  userId: string,
): Promise<UserDetail | null> => {
  const overview = await getUserOverviewById(userId);
  if (!overview) return null;
  return mapOverviewToUserDetail(overview);
};

export const getRanks = async (): Promise<AcademicRank[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("academic_rank")
    .select("*")
    .order("code", { ascending: true });

  if (error) {
    console.error("lib.users.getRanks ::", error);
    return [];
  }

  return (data ?? []) as AcademicRank[];
};
