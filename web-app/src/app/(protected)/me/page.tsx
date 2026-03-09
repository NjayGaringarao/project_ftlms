import AssignedClassesCard from "@/components/me/overview/assigned-classes-card";
import DesignationListCard from "@/components/me/overview/designation-list-card";
import UserSummaryCard from "@/components/me/overview/user-summary-card";
import WorkingLoadMetrics from "@/components/user/working-load-metrics";
import { getCurrentUserOverview } from "@/lib/user-overview";
import { cn } from "@/utils/style";

import { redirect } from "next/navigation";

const MePage = async () => {
  const overview = await getCurrentUserOverview();

  if (!overview) {
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
      <UserSummaryCard
        userId={overview.id}
        email={overview.email}
        emailConfirmedAt={overview.emailConfirmedAt}
        accountCreatedAt={overview.accountCreatedAt}
        lastSignInAt={overview.lastSignInAt}
        identity={overview.identity}
        employmentStatus={overview.employmentStatus}
        academicRank={overview.rank}
        accountType={overview.accountType}
        degrees={overview.degrees}
      />

      <div className="2xl:col-span-2 space-y-4">
        <WorkingLoadMetrics
          designationLoad={overview.designationLoad}
          actualTeachingLoad={overview.actualTeachingLoad}
          totalWorkingLoad={overview.totalWorkingLoad}
        />

        <DesignationListCard designations={overview.designations} />

        <AssignedClassesCard term={overview.term} classes={overview.classes} />
      </div>
    </div>
  );
};

export default MePage;
