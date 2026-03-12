import WorkingLoadMetrics from "@/components/user/working-load-metrics";
import DesignationInformationContent from "@/components/user/designation-information-content";
import PersonalInformation from "@/components/user/personal-information";
import EducationInformation from "@/components/user/education-information";
import EmploymentInformation from "@/components/user/employment-information";
import type { UserOverviewReadModel } from "@/lib/user-overview/types";

type FacultyOverviewPanelProps = {
  overview: UserOverviewReadModel;
  /** Override ATL from the term-specific class query (instead of current-term RPC). */
  termActualTeachingLoad?: number;
};

const FacultyOverviewPanel = ({
  overview,
  termActualTeachingLoad,
}: FacultyOverviewPanelProps) => {
  const designationLoad = overview.designationLoad;
  const actualTeachingLoad =
    termActualTeachingLoad ?? overview.actualTeachingLoad;
  const totalWorkingLoad = actualTeachingLoad + designationLoad;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <WorkingLoadMetrics
        designationLoad={designationLoad}
        actualTeachingLoad={actualTeachingLoad}
        totalWorkingLoad={totalWorkingLoad}
        size="Compact"
      />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
          Designation
        </h3>
        <DesignationInformationContent designations={overview.designations} size="Compact" />
      </div>

      <PersonalInformation identity={overview.identity} />
      <EducationInformation degrees={overview.degrees} />
      <EmploymentInformation
        employmentStatus={overview.employmentStatus}
        academicRank={overview.rank}
      />
    </div>
  );
};

export default FacultyOverviewPanel;
