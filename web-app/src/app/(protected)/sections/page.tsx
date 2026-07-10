import { Suspense } from "react";
import { SectionsManagement } from "@/features/sections/components/sections-management";
import { TopBarNav } from "@/features/app-shell/components/topbar-nav";
import { getSectionById, getSectionsList } from "@/features/admin/lib/sections";
import { getCampusesList } from "@/features/admin/lib/campuses";
import { getProgramOfferingsList } from "@/features/admin/lib/program-offerings";
import {
  getDefaultAcademicTermCached,
  getTermByIdCached,
  getTermsListCached,
} from "@/features/admin/lib/terms-cached";
import { getFacultyListByTerm } from "@/features/course-loading/lib/queries";
import { ListDetailSkeleton } from "@/features/shared/components/skeletons/list-detail-skeleton";
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

const SectionsContent = async ({ searchParams }: SectionsPageProps) => {
  const resolvedSearchParams = await searchParams;
  const academicTermId = getSingleParam(resolvedSearchParams.academic_term_id);
  const selectedId = getSingleParam(resolvedSearchParams.id) ?? null;
  const isCreating = getSingleParam(resolvedSearchParams.new) === "1";

  const [
    terms,
    defaultTerm,
    queriedTerm,
    sections,
    campuses,
    programOfferings,
    selectedSection,
    // When the term is in the URL, the heavy faculty fetch can join the batch;
    // otherwise it waits for the resolved term below.
    eagerFaculty,
  ] = await Promise.all([
    getTermsListCached(),
    getDefaultAcademicTermCached(),
    academicTermId ? getTermByIdCached(academicTermId) : null,
    getSectionsList(),
    getCampusesList(),
    getProgramOfferingsList(),
    selectedId ? getSectionById(selectedId) : null,
    academicTermId
      ? getFacultyListByTerm(academicTermId, { includeEmpty: true })
      : null,
  ]);

  const academicTerm = queriedTerm ?? defaultTerm ?? terms[0] ?? null;
  const faculty =
    academicTermId && academicTerm?.id === academicTermId
      ? (eagerFaculty ?? [])
      : academicTerm
        ? await getFacultyListByTerm(academicTerm.id, { includeEmpty: true })
        : [];
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

const SectionsPage = ({ searchParams }: SectionsPageProps) => (
  <Suspense fallback={<ListDetailSkeleton title="Sections" icon="sections" />}>
    <SectionsContent searchParams={searchParams} />
  </Suspense>
);

export default SectionsPage;
