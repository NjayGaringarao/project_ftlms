import { CardTitle, Card, CardHeader } from "@/components/ui/card";
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
import { WeightTilde, UserRoundGroup, Landmark } from "lucide-react";

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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <p className="text-base">Assigned Classes</p>
        {statusInfo && (
          <span
            className={`text-xs rounded px-1.5 py-0.5 ${ftlStatusVariantClass[statusInfo.variant]}`}
          >
            {statusInfo.label}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {classes.length === 0 ? (
          <p className="text-sm text-foreground/60">
            {ftlStatus
              ? "No classes assigned for this term."
              : "No teaching load snapshot is available for this term."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((classItem) => (
              <Card
                key={classItem.id}
                className="border border-border rounded-lg p-3 flex flex-col gap-2"
              >
                <CardHeader className="flex flex-wrap items-start justify-between gap-2 px-0 border-b">
                  <div className="flex flex-row gap-1">
                    <p className="font-semibold">[{classItem.course_code}]</p>
                    <p className="text-foreground/70">
                      {classItem.course_title}
                    </p>
                  </div>
                </CardHeader>

                <div className="grid grid-cols-3 gap-2 text-sm text-foreground/70 font-medium">
                  <div className="flex flex-row items-center gap-1">
                    <UserRoundGroup /> <p>{classItem.section_code}</p>
                  </div>
                  <div className="flex flex-row items-center gap-1">
                    <Landmark /> <p>{classItem.campus_name}</p>
                  </div>
                  <div className="flex flex-row items-center gap-1">
                    <WeightTilde /> <p>{toFixedLoad(classItem.load)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedClassesCard;
