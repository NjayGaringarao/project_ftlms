import { YearsManagement } from "@/features/admin/components/academic-year/years-management";
import {
  getAcademicYearById,
  getAcademicYearsList,
} from "@/features/admin/lib/academic-years";
import { getAdminPanelQueryState } from "@/features/admin/lib/management-query";
import { getTermsByAcademicYearId } from "@/features/admin/lib/terms";

type AcademicYearsPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    new?: string | string[];
  }>;
};

const AcademicYearsPage = async ({ searchParams }: AcademicYearsPageProps) => {
  const queryState = getAdminPanelQueryState(await searchParams);
  const [years, selectedYear, selectedTerms] = await Promise.all([
    getAcademicYearsList(),
    queryState.selectedId ? getAcademicYearById(queryState.selectedId) : null,
    queryState.selectedId ? getTermsByAcademicYearId(queryState.selectedId) : [],
  ]);

  return (
    <YearsManagement
      years={years}
      selectedYear={selectedYear}
      selectedTerms={selectedTerms}
      selectedId={queryState.selectedId}
      isCreating={queryState.isCreating}
    />
  );
};

export default AcademicYearsPage;
