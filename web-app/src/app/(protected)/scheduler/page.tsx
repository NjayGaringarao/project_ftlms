import SmallDisplayOverlay from "@/components/ui/small-display-overlay";
import { TopBarNav } from "@/features/app-shell/components/topbar-nav";
import {
  getDefaultAcademicTerm,
  getTermById,
  getTermsList,
} from "@/features/admin/lib/terms";
import ScheduleMapper from "@/features/scheduler/components/schedule-mapper";
import TermSwitcher from "@/features/shared/components/pickers/term-switcher";

type SchedulerPageProps = {
  searchParams: Promise<{
    academic_term_id?: string | string[];
  }>;
};

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const SchedulerPage = async ({ searchParams }: SchedulerPageProps) => {
  const resolvedSearchParams = await searchParams;
  const academicTermId = getSingleParam(resolvedSearchParams.academic_term_id);

  const [terms, defaultTerm, queriedTerm] = await Promise.all([
    getTermsList(),
    getDefaultAcademicTerm(),
    academicTermId ? getTermById(academicTermId) : null,
  ]);
  const selectedTerm = queriedTerm ?? defaultTerm ?? terms[0] ?? null;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <TopBarNav title="Scheduler" items={[]}>
        <TermSwitcher
          terms={terms}
          selectedTermId={selectedTerm?.id}
          routeConfig={{
            mode: "query",
            paramName: "academic_term_id",
            resetParamsOnSelect: [
              "facultyId",
              "sectionId",
              "roomId",
              "courseUtilizationId",
            ],
          }}
          refreshOnSelect
        />
      </TopBarNav>

      {selectedTerm ? (
        <div className="flex h-full w-full overflow-hidden p-4">
          <div className="min-w-0 flex-1 overflow-hidden">
            <ScheduleMapper academic_term_id={selectedTerm.id} />
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-lg border border-dashed p-6 text-center">
            <h1 className="text-lg font-semibold">Scheduler</h1>
            <p className="mt-2 text-sm text-foreground/70">
              Set a default academic term before using scheduler.
            </p>
          </div>
        </div>
      )}

      <div className="absolute z-100 flex h-full w-full flex-col items-center justify-center bg-background px-16 lg:hidden">
        <SmallDisplayOverlay />
      </div>
    </div>
  );
};

export default SchedulerPage;
