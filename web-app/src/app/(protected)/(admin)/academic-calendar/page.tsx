import { AcademicCalendarManagement } from "@/features/admin/components/academic-calendar/academic-calendar-management";
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

const AcademicCalendarPage = async ({
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

export default AcademicCalendarPage;
