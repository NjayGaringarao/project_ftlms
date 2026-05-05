import { CollegesManagement } from "@/features/admin/components/college/colleges-management";
import { getCollegeById, getCollegesList } from "@/features/admin/lib/colleges";
import { getMajorsByCollege } from "@/features/admin/lib/majors";
import { getAdminPanelQueryState } from "@/features/admin/lib/management-query";
import { getProgramsByCollege } from "@/features/admin/lib/programs";

type CollegesPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    new?: string | string[];
  }>;
};

const CollegesPage = async ({ searchParams }: CollegesPageProps) => {
  const queryState = getAdminPanelQueryState(await searchParams);
  const [colleges, selectedCollege, programs, majors] = await Promise.all([
    getCollegesList(),
    queryState.selectedId ? getCollegeById(queryState.selectedId) : null,
    queryState.selectedId ? getProgramsByCollege(queryState.selectedId) : [],
    queryState.selectedId ? getMajorsByCollege(queryState.selectedId) : [],
  ]);

  return (
    <CollegesManagement
      colleges={colleges}
      selectedCollege={selectedCollege}
      programs={programs}
      majors={majors}
      selectedId={queryState.selectedId}
      isCreating={queryState.isCreating}
    />
  );
};

export default CollegesPage;
