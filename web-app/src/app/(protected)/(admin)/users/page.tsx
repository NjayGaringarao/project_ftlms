import { UsersManagement } from "@/features/admin/components/users/users-management";
import { getCampusesList } from "@/features/admin/lib/campuses";
import { getCollegesList } from "@/features/admin/lib/colleges";
import { getAdminPanelQueryState } from "@/features/admin/lib/management-query";
import { getRanks, getUserById, getUsersList } from "@/features/admin/lib/users/users";

type UsersPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    new?: string | string[];
  }>;
};

const UsersPage = async ({ searchParams }: UsersPageProps) => {
  const queryState = getAdminPanelQueryState(await searchParams);
  const [users, selectedUser, ranks, campuses, colleges] = await Promise.all([
    getUsersList(),
    queryState.selectedId ? getUserById(queryState.selectedId) : null,
    getRanks(),
    getCampusesList(),
    getCollegesList(),
  ]);

  return (
    <UsersManagement
      users={users}
      selectedUser={selectedUser}
      ranks={ranks}
      campuses={campuses}
      colleges={colleges}
      selectedId={queryState.selectedId}
      isCreating={queryState.isCreating}
    />
  );
};

export default UsersPage;
