import { SectionsManagement } from "@/features/sections/components/sections-management";
import { TopBarNav } from "@/features/app-shell/components/topbar-nav";
import { getSectionById, getSectionsList } from "@/features/admin/lib/sections";
import { getCampusesList } from "@/features/admin/lib/campuses";
import { getProgramOfferingsList } from "@/features/admin/lib/program-offerings";
import {
  getDefaultAcademicTerm,
  getTermById,
  getTermsList,
} from "@/features/admin/lib/terms";
import { getFacultyListByTerm } from "@/features/course-loading/lib/queries";
import TermSwitcher from "@/features/shared/components/pickers/term-switcher";

type SectionsPageProps = {
  searchParams: Promise<{
    academic_term_id?: string | string[];
    id?: string | string[];
    new?: string | string[];
  }>;
};

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const SectionsPage = async ({ searchParams }: SectionsPageProps) => {
  const resolvedSearchParams = await searchParams;
  const academicTermId = getSingleParam(resolvedSearchParams.academic_term_id);
  const selectedId = getSingleParam(resolvedSearchParams.id) ?? null;
  const isCreating = getSingleParam(resolvedSearchParams.new) === "1";

  const [terms, defaultTerm, queriedTerm, sections, campuses, programOfferings] =
    await Promise.all([
      getTermsList(),
      getDefaultAcademicTerm(),
      academicTermId ? getTermById(academicTermId) : null,
      getSectionsList(),
      getCampusesList(),
      getProgramOfferingsList(),
    ]);

  const academicTerm = queriedTerm ?? defaultTerm ?? terms[0] ?? null;
  const faculty = academicTerm
    ? await getFacultyListByTerm(academicTerm.id, { includeEmpty: true })
    : [];
  const selectedSection = selectedId ? await getSectionById(selectedId) : null;
  const scopedSelectedSection =
    selectedSection?.academic_term_id === academicTerm?.id ? selectedSection : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBarNav title="Sections" icon="sections" items={[]}>
        <TermSwitcher
          terms={terms}
          selectedTermId={academicTerm?.id}
          routeConfig={{
            mode: "query",
            paramName: "academic_term_id",
            resetParamsOnSelect: ["id", "new"],
          }}
          description="Filter sections by academic term."
          emptyLabel="No academic terms found."
          buttonClassName="bg-background/95 text-foreground justify-between"
          buttonSize="default"
          showSubtitle={false}
        />
      </TopBarNav>

      {academicTerm ? (
        <SectionsManagement
          sections={sections}
          campuses={campuses}
          programOfferings={programOfferings}
          faculty={faculty}
          academicTerm={academicTerm}
          selectedSection={scopedSelectedSection}
          selectedId={selectedId}
          isCreating={isCreating}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-3xl rounded-lg border border-dashed p-6">
            <h1 className="text-lg font-semibold">Section Management</h1>
            <p className="mt-2 text-sm text-foreground/70">
              Set a default academic term to begin managing sections.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionsPage;
