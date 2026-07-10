import { Suspense } from "react";
import { AcademicCalendarManagement } from "@/features/admin/components/academic-calendar/academic-calendar-management";
import { ListDetailSkeleton } from "@/features/shared/components/skeletons/list-detail-skeleton";
import {
  getAcademicYearById,
  getAcademicYearsList,
} from "@/features/admin/lib/academic-years";
import { getAdminPanelQueryState } from "@/features/admin/lib/management-query";
import {
  getDefaultAcademicTerm,
  getTermsByAcademicYearId,
} from "@/features/admin/lib/terms";

type AcademicCalendarPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    new?: string | string[];
  }>;
};

const AcademicCalendarContent = async ({
  searchParams,
}: AcademicCalendarPageProps) => {
  const queryState = getAdminPanelQueryState(await searchParams);
  const [years, selectedYear, selectedTerms, defaultTerm] = await Promise.all([
    getAcademicYearsList(),
    queryState.selectedId ? getAcademicYearById(queryState.selectedId) : null,
    queryState.selectedId ? getTermsByAcademicYearId(queryState.selectedId) : [],
    getDefaultAcademicTerm(),
  ]);

  return (
    <AcademicCalendarManagement
      years={years}
      selectedYear={selectedYear}
      selectedTerms={selectedTerms}
      defaultTerm={defaultTerm}
      selectedId={queryState.selectedId}
      isCreating={queryState.isCreating}
    />
  );
};

const AcademicCalendarPage = ({ searchParams }: AcademicCalendarPageProps) => (
  <Suspense fallback={<ListDetailSkeleton />}>
    <AcademicCalendarContent searchParams={searchParams} />
  </Suspense>
);

export default AcademicCalendarPage;
