import { Suspense } from "react";
import { UsersManagement } from "@/features/admin/components/users/users-management";
import { ListDetailSkeleton } from "@/features/shared/components/skeletons/list-detail-skeleton";
import { getCampusesList } from "@/features/admin/lib/campuses";
import { getCollegesList } from "@/features/admin/lib/colleges";
import { getAdminPanelQueryState } from "@/features/admin/lib/management-query";
import { getProgramCampusOfferings } from "@/features/admin/lib/programs";
import { getRanks, getUserById, getUsersList } from "@/features/admin/lib/users/users";
import { createClient } from "@/utils/supabase/server";

type UsersPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    new?: string | string[];
  }>;
};

const UsersContent = async ({ searchParams }: UsersPageProps) => {
  const queryState = getAdminPanelQueryState(await searchParams);
  const supabase = await createClient();
  const [
    authUserResult,
    users,
    selectedUser,
    ranks,
    campuses,
    colleges,
    programOfferings,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getUsersList(),
    queryState.selectedId ? getUserById(queryState.selectedId) : null,
    getRanks(),
    getCampusesList(),
    getCollegesList(),
    getProgramCampusOfferings(),
  ]);

  return (
    <UsersManagement
      users={users}
      selectedUser={selectedUser}
      ranks={ranks}
      campuses={campuses}
      colleges={colleges}
      programOfferings={programOfferings}
      selectedId={queryState.selectedId}
      isCreating={queryState.isCreating}
      currentUserId={authUserResult.data.user?.id ?? null}
    />
  );
};

const UsersPage = ({ searchParams }: UsersPageProps) => (
  <Suspense fallback={<ListDetailSkeleton />}>
    <UsersContent searchParams={searchParams} />
  </Suspense>
);

export default UsersPage;
