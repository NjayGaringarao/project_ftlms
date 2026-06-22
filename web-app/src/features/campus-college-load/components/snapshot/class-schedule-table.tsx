import { YearLevelSectionGroups } from "@/features/campus-college-load/components/snapshot/year-level-section-groups";
import type {
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotSection,
} from "@/features/shared/types/models";

export const ClassScheduleTable = ({
  classes,
  sections,
  legacy,
  revisionId,
  academicTermId,
}: {
  classes: CampusCollegeLoadSnapshotClass[];
  sections: CampusCollegeLoadSnapshotSection[];
  legacy: boolean;
  revisionId: string;
  academicTermId: string;
}) => {
  if (legacy) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
        Class schedule data is not available for this older revision.
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold mb-2">Class Schedule</h3>
      <YearLevelSectionGroups
        classes={classes}
        sections={sections}
        revisionId={revisionId}
        academicTermId={academicTermId}
      />
    </div>
  );
};
