import AssignedClassesCard from "@/features/profile/components/me/overview/assigned-classes-card";
import DesignationListCard from "@/features/profile/components/me/overview/designation-list-card";
import UserSummaryCard from "@/features/profile/components/me/overview/user-summary-card";
import WorkingLoadMetrics from "@/features/shared/components/user/working-load-metrics";
import { getCurrentUserOverview } from "@/features/profile/lib/user-overview";
import { cn } from "@/utils/style";

import { redirect } from "next/navigation";

const MePage = async () => {
  const userOverview = await getCurrentUserOverview();

  if (!userOverview) {
    redirect("/auth/login");
  }

  return (
    <div
      className={cn(
        "bg-background h-full w-full p-6 overflow-y-auto",
        "flex flex-col gap-4",
        "xl:grid xl:grid-cols-2 2xl:grid-cols-3",
      )}
    >
      <UserSummaryCard userOverview={userOverview} />

      <div className="2xl:col-span-2 space-y-4">
        <WorkingLoadMetrics
          designationLoad={userOverview.designationLoad}
          actualTeachingLoad={userOverview.actualTeachingLoad}
          totalWorkingLoad={userOverview.totalWorkingLoad}
        />

        <DesignationListCard designations={userOverview.designations} />

        <AssignedClassesCard
          term={userOverview.term}
          classes={userOverview.classes}
        />
      </div>
    </div>
  );
};

export default MePage;
