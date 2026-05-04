import { BlocksManagement } from "@/features/blocks/components/blocks-management";
import { TopBarNav } from "@/features/app-shell/components/topbar-nav";
import { getBlockById, getBlocksList } from "@/features/admin/lib/blocks";
import { getCampusesList } from "@/features/admin/lib/campuses";
import { getProgramOfferingsList } from "@/features/admin/lib/program-offerings";
import {
  getDefaultAcademicTerm,
  getTermById,
  getTermsList,
} from "@/features/admin/lib/terms";
import TermSwitcher from "@/features/shared/components/pickers/term-switcher";

type BlocksPageProps = {
  searchParams: Promise<{
    academic_term_id?: string | string[];
    id?: string | string[];
    new?: string | string[];
  }>;
};

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const BlocksPage = async ({ searchParams }: BlocksPageProps) => {
  const resolvedSearchParams = await searchParams;
  const academicTermId = getSingleParam(resolvedSearchParams.academic_term_id);
  const selectedId = getSingleParam(resolvedSearchParams.id) ?? null;
  const isCreating = getSingleParam(resolvedSearchParams.new) === "1";

  const [terms, defaultTerm, queriedTerm, blocks, campuses, programOfferings] =
    await Promise.all([
      getTermsList(),
      getDefaultAcademicTerm(),
      academicTermId ? getTermById(academicTermId) : null,
      getBlocksList(),
      getCampusesList(),
      getProgramOfferingsList(),
    ]);

  const academicTerm = queriedTerm ?? defaultTerm ?? terms[0] ?? null;
  const selectedBlock = selectedId ? await getBlockById(selectedId) : null;
  const scopedSelectedBlock =
    selectedBlock?.academic_term_id === academicTerm?.id ? selectedBlock : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBarNav title="Blocks" icon="blocks" items={[]}>
        <TermSwitcher
          terms={terms}
          selectedTermId={academicTerm?.id}
          routeConfig={{
            mode: "query",
            paramName: "academic_term_id",
            resetParamsOnSelect: ["id", "new"],
          }}
          description="Filter blocks by academic term."
          emptyLabel="No academic terms found."
          buttonClassName="bg-background/95 text-foreground justify-between"
          buttonSize="default"
          showSubtitle={false}
        />
      </TopBarNav>

      {academicTerm ? (
        <BlocksManagement
          blocks={blocks}
          campuses={campuses}
          programOfferings={programOfferings}
          academicTerm={academicTerm}
          selectedBlock={scopedSelectedBlock}
          selectedId={selectedId}
          isCreating={isCreating}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-3xl rounded-lg border border-dashed p-6">
            <h1 className="text-lg font-semibold">Block Management</h1>
            <p className="mt-2 text-sm text-foreground/70">
              Set a default academic term to begin managing blocks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlocksPage;
