import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ftlStatusVariantClass,
  getFtlStatusLabel,
} from "@/features/home/lib/ftl-status";
import { OverviewClassLoad } from "@/features/profile/lib/user-overview";
import { AcademicTerm } from "@/features/shared/types/models/academic_term";
import type {
  CampusCollegeLoadStatus,
  CampusCollegeLoadStep,
} from "@/features/shared/types/models/campus_college_load";

type AssignedClassesCardProps = {
  term: AcademicTerm | null;
  classes: OverviewClassLoad[];
  ftlStatus: CampusCollegeLoadStatus | null;
  ftlStep: CampusCollegeLoadStep | null;
};

const toFixedLoad = (value: number) => value.toFixed(2);

const AssignedClassesCard = ({
  term,
  classes,
  ftlStatus,
  ftlStep,
}: AssignedClassesCardProps) => {
  const statusInfo = getFtlStatusLabel(ftlStatus, ftlStep);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            Currently Assigned Classes
          </CardTitle>
          {statusInfo && (
            <span
              className={`text-xs rounded px-1.5 py-0.5 ${ftlStatusVariantClass[statusInfo.variant]}`}
            >
              {statusInfo.label}
            </span>
          )}
        </div>
        {term && (
          <p className="text-sm text-foreground/60">
            {term.name} ({term.code})
          </p>
        )}
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <p className="text-sm text-foreground/60">
            No classes assigned for the current term.
          </p>
        ) : (
          <div className="space-y-3">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className="border border-border rounded-lg p-3 flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{classItem.course_code}</p>
                    <p className="text-sm text-foreground/70">
                      {classItem.course_title}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    Load: {toFixedLoad(classItem.load)}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-foreground/70">
                  <p>Section: {classItem.section_code}</p>
                  <p>Campus: {classItem.campus_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignedClassesCard;
