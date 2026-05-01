import { CampusesManagement } from "@/features/admin/components/campus/campuses-management";
import { getCampusById, getCampusesList } from "@/features/admin/lib/campuses";
import { getAdminPanelQueryState } from "@/features/admin/lib/management-query";
import { getProgramOfferingsByCampus } from "@/features/admin/lib/program-offerings";
import { getPrograms } from "@/features/admin/lib/programs";
import { getRoomsByCampus } from "@/features/admin/lib/rooms";

type CampusesPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    new?: string | string[];
  }>;
};

const CampusesPage = async ({ searchParams }: CampusesPageProps) => {
  const queryState = getAdminPanelQueryState(await searchParams);
  const [campuses, selectedCampus, rooms, offerings, programs] =
    await Promise.all([
      getCampusesList(),
      queryState.selectedId ? getCampusById(queryState.selectedId) : null,
      queryState.selectedId ? getRoomsByCampus(queryState.selectedId) : [],
      queryState.selectedId
        ? getProgramOfferingsByCampus(queryState.selectedId)
        : [],
      getPrograms(),
    ]);

  return (
    <CampusesManagement
      campuses={campuses}
      selectedCampus={selectedCampus}
      rooms={rooms}
      offerings={offerings}
      programs={programs}
      selectedId={queryState.selectedId}
      isCreating={queryState.isCreating}
    />
  );
};

export default CampusesPage;
