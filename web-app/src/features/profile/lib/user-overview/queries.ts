"use server";

import { getCurrentUser } from "@/features/auth/lib/utils";
import { getUserDataById, getUserDataList } from "@/features/profile/lib/user-data/queries";
import type { UserDataOptions } from "@/features/profile/lib/user-data/types";
import type {
  UserOverviewListItem,
  UserOverviewReadModel,
} from "@/features/profile/lib/user-overview/types";

const fullOverviewOptions: UserDataOptions = {
  includeDegrees: true,
  includeDesignations: true,
  includeClasses: true,
  includeLoads: true,
  useSnapshotLoads: true,
};

export const getUserOverviewById = async (
  userId: string,
): Promise<UserOverviewReadModel | null> =>
  getUserDataById(userId, fullOverviewOptions);

export const getCurrentUserOverview = async (
  academicTermId?: string,
): Promise<UserOverviewReadModel | null> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;
  return getUserDataById(currentUser.id, {
    ...fullOverviewOptions,
    academicTermId,
  });
};

export const getUserOverviewList = async (): Promise<
  UserOverviewListItem[]
> => {
  const rows = await getUserDataList();
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    identity: row.identity,
    employmentStatus: row.employmentStatus,
    campus: row.campus,
    college: row.college,
  }));
};
