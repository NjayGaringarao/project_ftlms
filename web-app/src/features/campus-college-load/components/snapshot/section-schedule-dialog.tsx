"use client";

import { AppDialog } from "@/components/ui/app-dialog";
import { SectionScheduleTable } from "@/features/campus-college-load/components/snapshot/section-schedule-table";
import { SectionScheduleExportTrigger } from "@/features/document-export/components/section-schedule-export-trigger";
import type { CampusCollegeLoadSnapshotClass } from "@/features/shared/types/models";

export const SectionScheduleDialog = ({
  open,
  onOpenChange,
  sectionCode,
  classes,
  revisionId,
  sectionId,
  academicTermId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionCode: string;
  classes: CampusCollegeLoadSnapshotClass[];
  revisionId: string;
  sectionId: string;
  academicTermId: string;
}) => (
  <AppDialog
    open={open}
    onOpenChange={onOpenChange}
    title={sectionCode}
    variant="floating-large"
    contentClassName="p-4"
    headerActions={
      <SectionScheduleExportTrigger
        revisionId={revisionId}
        sectionId={sectionId}
        academicTermId={academicTermId}
      />
    }
  >
    <SectionScheduleTable classes={classes} />
  </AppDialog>
);
