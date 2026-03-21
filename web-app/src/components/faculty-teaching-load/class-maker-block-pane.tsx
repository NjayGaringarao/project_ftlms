"use client";

import type { FacultyListItem } from "@/lib/course-loading/types";
import { PickerList } from "./picker-list";

type ClassMakerBlockPaneProps = {
  facultyOptions: FacultyListItem[];
  selectedFacultyId: string;
  toggleFaculty: (id: string) => void;
};

const ClassMakerBlockPane = ({
  facultyOptions,
  selectedFacultyId,
  toggleFaculty,
}: ClassMakerBlockPaneProps) => {
  return (
    <PickerList
      title="Faculty"
      items={facultyOptions}
      getId={(f) => f.id}
      getLabel={(f) => f.name}
      getSubLabel={(f) => f.latest_degree_title ?? "No degree on file"}
      getAnnotation={(f) => (
        <span className="rounded-md bg-foreground/10 px-1 py-1 text-xs text-foreground">
          TWL: {f.total_working_load.toFixed(2)}
        </span>
      )}
      selected={new Set(selectedFacultyId ? [selectedFacultyId] : [])}
      onToggle={toggleFaculty}
      placeholder="Search faculty..."
    />
  );
};

export default ClassMakerBlockPane;
