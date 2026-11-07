import {
  getDefaultAcademicTermCached,
  getTermsListCached,
} from "@/features/admin/lib/terms-cached";
import AssignedClassesCard from "@/features/profile/components/me/overview/assigned-classes-card";
import DesignationListCard from "@/features/profile/components/me/overview/designation-list-card";
import UserSummaryCard from "@/features/profile/components/me/overview/user-summary-card";
import TermSwitcher from "@/features/shared/components/pickers/term-switcher";
import WorkingLoadMetrics from "@/features/shared/components/user/working-load-metrics";
import { getCurrentUserOverview } from "@/features/profile/lib/user-overview";
import { cn } from "@/utils/style";

import { redirect } from "next/navigation";

type MePageProps = {
  searchParams: Promise<{
    academic_term_id?: string | string[];
  }>;
};

const MePage = async ({ searchParams }: MePageProps) => {
  const { academic_term_id: termParam } = await searchParams;
  const requestedTermId = Array.isArray(termParam) ? termParam[0] : termParam;
  const [terms, defaultTerm] = await Promise.all([
    getTermsListCached(),
    getDefaultAcademicTermCached(),
  ]);
  const selectedTerm =
    terms.find((term) => term.id === requestedTermId) ??
    defaultTerm ??
    terms[0] ??
    null;
  const userOverview = await getCurrentUserOverview(selectedTerm?.id);

  if (!userOverview) {
    redirect("/auth/login");
  }

  return (
    <div
      className={cn(
        "bg-background h-full w-full p-4 overflow-y-auto",
        "flex flex-col gap-4",
        "xl:grid xl:grid-cols-2 2xl:grid-cols-3",
      )}
    >
      <UserSummaryCard userOverview={userOverview} />

      <div className="2xl:col-span-2 flex flex-col gap-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-black">Academic Term</h2>
          <TermSwitcher
            terms={terms}
            selectedTermId={selectedTerm?.id}
            routeConfig={{ mode: "query", paramName: "academic_term_id" }}
            buttonClassName="w-full min-w-0 bg-background sm:w-auto sm:max-w-full"
          />
        </div>

        <WorkingLoadMetrics
          designationLoad={userOverview.designationLoad}
          actualTeachingLoad={userOverview.actualTeachingLoad}
          totalWorkingLoad={userOverview.totalWorkingLoad}
          isAvailable={userOverview.ftlStatus !== null}
          size="Large"
        />

        <DesignationListCard designations={userOverview.designations} />

        <AssignedClassesCard
          term={userOverview.term}
          classes={userOverview.classes}
          ftlStatus={userOverview.ftlStatus}
          ftlStep={userOverview.ftlStep}
        />
      </div>
    </div>
  );
};

export default MePage;
