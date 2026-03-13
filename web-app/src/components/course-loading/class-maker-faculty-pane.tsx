"use client";

import type { CourseLoadingBlockListItem } from "@/lib/course-loading/types";
import { PickerList } from "./picker-list";

type ClassMakerFacultyPaneProps = {
  selectedCampusId: string;
  filteredBlocks: CourseLoadingBlockListItem[];
  selectedBlockIds: Set<string>;
  toggleBlock: (id: string) => void;
  programOfferingFilter: string;
  onProgramOfferingFilterChange: (value: string) => void;
  yearLevelFilter: string;
  onYearLevelFilterChange: (value: string) => void;
  programOfferingOptions: string[];
  yearLevelOptions: number[];
};

const ClassMakerFacultyPane = ({
  selectedCampusId,
  filteredBlocks,
  selectedBlockIds,
  toggleBlock,
  programOfferingFilter,
  onProgramOfferingFilterChange,
  yearLevelFilter,
  onYearLevelFilterChange,
  programOfferingOptions,
  yearLevelOptions,
}: ClassMakerFacultyPaneProps) => {
  if (!selectedCampusId) {
    return (
      <div className="flex items-center justify-center rounded-md border p-8 text-sm text-foreground/50">
        Select a campus first to view blocks.
      </div>
    );
  }

  return (
    <PickerList
      title="Block(s)"
      items={filteredBlocks}
      getId={(b) => b.id}
      getLabel={(b) => b.code}
      getSubLabel={(b) =>
        `${b.program_offering_code} · Year Level ${b.year_level}`
      }
      selected={selectedBlockIds}
      onToggle={toggleBlock}
      placeholder="Search blocks..."
      pickerComponents={
        <div className="flex gap-2 pt-2">
          <select
            value={programOfferingFilter}
            onChange={(e) => onProgramOfferingFilterChange(e.target.value)}
            className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="">All Programs</option>
            {programOfferingOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <select
            value={yearLevelFilter}
            onChange={(e) => onYearLevelFilterChange(e.target.value)}
            className="w-32 rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="">All Year Level</option>
            {yearLevelOptions.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
      }
    />
  );
};

export default ClassMakerFacultyPane;
