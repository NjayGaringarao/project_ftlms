import { CampusesManagement } from "@/features/admin/components/campus/campuses-management";
import { getCampusById, getCampusesList } from "@/features/admin/lib/campuses";
import { getMajorOfferingsByCampus } from "@/features/admin/lib/major-offerings";
import { getMajorsList } from "@/features/admin/lib/majors";
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
  const [campuses, selectedCampus, rooms, offerings, programs, majors, majorOfferings] =
    await Promise.all([
      getCampusesList(),
      queryState.selectedId ? getCampusById(queryState.selectedId) : null,
      queryState.selectedId ? getRoomsByCampus(queryState.selectedId) : [],
      queryState.selectedId
        ? getProgramOfferingsByCampus(queryState.selectedId)
        : [],
      getPrograms(),
      getMajorsList(),
      queryState.selectedId ? getMajorOfferingsByCampus(queryState.selectedId) : [],
    ]);

  return (
    <CampusesManagement
      campuses={campuses}
      selectedCampus={selectedCampus}
      rooms={rooms}
      offerings={offerings}
      programs={programs}
      majors={majors}
      majorOfferings={majorOfferings}
      selectedId={queryState.selectedId}
      isCreating={queryState.isCreating}
    />
  );
};

export default CampusesPage;
