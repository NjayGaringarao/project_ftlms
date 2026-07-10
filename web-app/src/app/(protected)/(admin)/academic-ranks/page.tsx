import { Suspense } from "react";
import { RanksManagement } from "@/features/admin/components/academic-rank/ranks-management";
import { ListDetailSkeleton } from "@/features/shared/components/skeletons/list-detail-skeleton";
import { getAdminPanelQueryState } from "@/features/admin/lib/management-query";
import { getRankById, getUniversityRanksList } from "@/features/admin/lib/ranks";

type AcademicRanksPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    new?: string | string[];
  }>;
};

const AcademicRanksContent = async ({ searchParams }: AcademicRanksPageProps) => {
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

const AcademicRanksPage = ({ searchParams }: AcademicRanksPageProps) => (
  <Suspense fallback={<ListDetailSkeleton />}>
    <AcademicRanksContent searchParams={searchParams} />
  </Suspense>
);

export default AcademicRanksPage;
