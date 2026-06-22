"use client";

import { useState } from "react";
import { Blocks, ChevronDown, ChevronRight, GraduationCap } from "lucide-react";
import ListItemSmall from "@/components/ui/list-item-small";
import { SectionScheduleDialog } from "@/features/campus-college-load/components/snapshot/section-schedule-dialog";
import { SectionScheduleExportTrigger } from "@/features/document-export/components/section-schedule-export-trigger";
import { computeSectionUnits } from "@/features/campus-college-load/utils/section-units";
import { formatOrdinalYearLevel } from "@/features/campus-college-load/utils/ordinal";
import type {
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotSection,
} from "@/features/shared/types/models";
import { cn } from "@/utils/style";

const DEFAULT_YEAR_LEVELS = [1, 2, 3, 4];

type SectionWithClasses = CampusCollegeLoadSnapshotSection & {
  classes: CampusCollegeLoadSnapshotClass[];
};

type YearLevelGroup = {
  yearLevel: number | null;
  sections: SectionWithClasses[];
};

const groupByYearLevel = (
  sections: CampusCollegeLoadSnapshotSection[],
  classes: CampusCollegeLoadSnapshotClass[],
): YearLevelGroup[] => {
  const yearLevelKeys = new Set<number | null>(DEFAULT_YEAR_LEVELS);
  sections.forEach((section) => yearLevelKeys.add(section.year_level));

  const sectionsWithClasses: SectionWithClasses[] = sections.map((section) => ({
    ...section,
    classes: classes.filter(
      (classRow) => classRow.section_id === section.section_id,
    ),
  }));

  const groups = Array.from(yearLevelKeys)
    .sort((left, right) => {
      if (left === null) return 1;
      if (right === null) return -1;
      return left - right;
    })
    .map((yearLevel) => ({
      yearLevel,
      sections: sectionsWithClasses
        .filter((section) => section.year_level === yearLevel)
        .sort((left, right) =>
          left.section_code.localeCompare(right.section_code),
        ),
    }));

  // Drop the "Unassigned Year Level" bucket unless data actually has one.
  return groups.filter(
    (group) => group.yearLevel !== null || group.sections.length > 0,
  );
};

const YearLevelGroupPanel = ({
  group,
  revisionId,
  academicTermId,
  onSelectSection,
}: {
  group: YearLevelGroup;
  revisionId: string;
  academicTermId: string;
  onSelectSection: (section: SectionWithClasses) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="border-b flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          {formatOrdinalYearLevel(group.yearLevel)}
          <span className="text-xs font-normal text-foreground/50">
            {group.sections.length} section
            {group.sections.length === 1 ? "" : "s"}
          </span>
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {open ? (
        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3",
            "gap-2 p-2",
          )}
        >
          {group.sections.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
              No Section to Show
            </div>
          ) : (
            group.sections.map((section) => {
              const { totalUnits, isOverloaded } = computeSectionUnits(
                section.classes,
              );
              return (
                <ListItemSmall
                  key={section.section_id}
                  title={section.section_code}
                  subtitle={[
                    `${totalUnits} Units${isOverloaded ? " (Overloaded)" : ""}`,
                  ]}
                  icon={<Blocks className="h-7 w-7 text-background" />}
                  annotations={
                    <SectionScheduleExportTrigger
                      revisionId={revisionId}
                      sectionId={section.section_id}
                      academicTermId={academicTermId}
                    />
                  }
                  onClick={() => onSelectSection(section)}
                />
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
};

export const YearLevelSectionGroups = ({
  sections,
  classes,
  revisionId,
  academicTermId,
}: {
  sections: CampusCollegeLoadSnapshotSection[];
  classes: CampusCollegeLoadSnapshotClass[];
  revisionId: string;
  academicTermId: string;
}) => {
  const [selectedSection, setSelectedSection] =
    useState<SectionWithClasses | null>(null);
  const groups = groupByYearLevel(sections, classes);

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <YearLevelGroupPanel
          key={group.yearLevel ?? "unassigned"}
          group={group}
          revisionId={revisionId}
          academicTermId={academicTermId}
          onSelectSection={setSelectedSection}
        />
      ))}

      {selectedSection ? (
        <SectionScheduleDialog
          open={Boolean(selectedSection)}
          onOpenChange={(open) => {
            if (!open) setSelectedSection(null);
          }}
          sectionCode={selectedSection.section_code}
          classes={selectedSection.classes}
          revisionId={revisionId}
          sectionId={selectedSection.section_id}
          academicTermId={academicTermId}
        />
      ) : null}
    </div>
  );
};
