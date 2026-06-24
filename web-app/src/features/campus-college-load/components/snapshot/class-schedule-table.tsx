import { Button } from "@/components/ui/button";
import { YearLevelSectionGroups } from "@/features/campus-college-load/components/snapshot/year-level-section-groups";
import type {
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotSection,
} from "@/features/shared/types/models";
import { Popover } from "radix-ui";
import { Download, FileText, Printer } from "lucide-react";

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
           <div className="w-full flex flex-row gap-2 items-center justify-between">
        <h3 className="font-semibold text-foreground">Faculty Load</h3>
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button
              variant="outline"
               
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </Popover.Trigger>
          <Popover.Content className="rounded-md border bg-white p-2 shadow-md" sideOffset={6} align="end">
            <div className="flex flex-col">
              <Button
                variant="ghost"
                className="w-full flex flex-row gap-2 items-center justify-start"
                >
                  <FileText className="h-4 w-4" />
                  Export as PDF
                </Button>
                <Button
                variant="ghost"
                className="w-full flex flex-row gap-2 items-center justify-start"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
            </div>
            <Popover.Arrow />
          </Popover.Content>
        </Popover.Root>
      </div>
      <YearLevelSectionGroups
        classes={classes}
        sections={sections}
        revisionId={revisionId}
        academicTermId={academicTermId}
      />
    </div>
  );
};

