import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ftlStatusVariantClass,
  getFtlStatusLabel,
} from "@/features/home/lib/ftl-status";
import AssignedClassesCard from "@/features/profile/components/me/overview/assigned-classes-card";
import { getCurrentUserOverview } from "@/features/profile/lib/user-overview";
import WorkingLoadMetrics from "@/features/shared/components/user/working-load-metrics";
import { CalendarDays, FileCheck2, UserRound } from "lucide-react";
import ShortcutCard from "../shortcut-card";

const FacultyDashboard = async () => {
  const overview = await getCurrentUserOverview();

  if (!overview) {
    return (
      <div className="p-6">
        <p className="text-sm text-foreground/60">
          Unable to load your profile data. Please try again later.
        </p>
      </div>
    );
  }

  const statusInfo = getFtlStatusLabel(overview.ftlStatus, overview.ftlStep);

  return (
    <div className="p-6 flex flex-col gap-4">
      <WorkingLoadMetrics
        designationLoad={overview.designationLoad}
        actualTeachingLoad={overview.actualTeachingLoad}
        totalWorkingLoad={overview.totalWorkingLoad}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileCheck2 className="w-4 h-4" />
              Faculty Teaching Load Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusInfo ? (
              <span
                className={`inline-block text-sm rounded px-2 py-1 ${ftlStatusVariantClass[statusInfo.variant]}`}
              >
                {statusInfo.label}
              </span>
            ) : (
              <p className="text-sm text-foreground/60">
                No teaching load submitted for the current term yet.
              </p>
            )}
            {overview.term && (
              <p className="text-xs text-foreground/60 mt-2">
                {overview.term.name} ({overview.term.code})
              </p>
            )}
          </CardContent>
        </Card>

        <ShortcutCard
          href="/me/schedule"
          label="My Schedule"
          description="View your weekly class schedule"
          icon={CalendarDays}
        />
        <ShortcutCard
          href="/me"
          label="My Overview"
          description="Profile, designations, and load details"
          icon={UserRound}
        />
      </div>

      <AssignedClassesCard
        term={overview.term}
        classes={overview.classes}
        ftlStatus={overview.ftlStatus}
        ftlStep={overview.ftlStep}
      />
    </div>
  );
};

export default FacultyDashboard;
