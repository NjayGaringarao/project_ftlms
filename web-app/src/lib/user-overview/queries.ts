"use server";

import { getCurrentUser } from "@/lib/auth/utils";
import { getUserDataById, getUserDataList } from "@/lib/user-data/queries";
import type { UserDataOptions } from "@/lib/user-data/types";
import type {
  UserOverviewListItem,
  UserOverviewReadModel,
} from "@/lib/user-overview/types";

const fullOverviewOptions: UserDataOptions = {
  includeDegrees: true,
  includeDesignations: true,
  includeClasses: true,
  includeLoads: true,
};

export const getUserOverviewById = async (
  userId: string,
): Promise<UserOverviewReadModel | null> =>
  getUserDataById(userId, fullOverviewOptions);

export const getCurrentUserOverview =
  async (): Promise<UserOverviewReadModel | null> => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;
    return getUserDataById(currentUser.id, fullOverviewOptions);
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
