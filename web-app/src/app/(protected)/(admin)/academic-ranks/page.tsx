import { RanksManagement } from "@/features/admin/components/academic-rank/ranks-management";
import { getAdminPanelQueryState } from "@/features/admin/lib/management-query";
import { getRankById, getUniversityRanksList } from "@/features/admin/lib/ranks";

type AcademicRanksPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    new?: string | string[];
  }>;
};

const AcademicRanksPage = async ({ searchParams }: AcademicRanksPageProps) => {
  const queryState = getAdminPanelQueryState(await searchParams);
  const [ranks, selectedRank] = await Promise.all([
    getUniversityRanksList(),
    queryState.selectedId ? getRankById(queryState.selectedId) : null,
  ]);

  return (
    <RanksManagement
      ranks={ranks}
      selectedRank={selectedRank}
      selectedId={queryState.selectedId}
      isCreating={queryState.isCreating}
    />
  );
};

export default AcademicRanksPage;
