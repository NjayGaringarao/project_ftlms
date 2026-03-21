"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { createBlockCourses, createClass, updateClass } from "@/lib/course-loading/actions";
import type { CampusListItem } from "@/lib/admin/campuses";
import type { CourseListItem } from "@/lib/admin/courses";
import type {
  CourseLoadingBlockListItem,
  FacultyListItem,
} from "@/lib/course-loading/types";
import { PickerList } from "./picker-list";
import ClassMakerFacultyPane from "./class-maker-faculty-pane";
import ClassMakerBlockPane from "./class-maker-block-pane";

type ClassMakerProps = {
  academicTermId: string;
  mode: "Edit" | "Insert";
  facultyId?: string;
  blockId?: string;
  classId?: string;
  initialCampusId?: string;
  initialCourseId?: string;
  initialBlockIds?: string[];
  initialFacultyId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ─── ClassMaker component ────────────────────────────────

const ClassMaker = ({
  academicTermId,
  mode,
  facultyId,
  blockId,
  classId,
  initialCampusId,
  initialCourseId,
  initialBlockIds,
  initialFacultyId,
  open,
  onOpenChange,
}: ClassMakerProps) => {
  const isFacultyAware = Boolean(facultyId);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Data loaded from server
  const [campuses, setCampuses] = useState<CampusListItem[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [blocks, setBlocks] = useState<CourseLoadingBlockListItem[]>([]);
  const [facultyOptions, setFacultyOptions] = useState<FacultyListItem[]>([]);

  // Selections
  const [selectedCampusId, setSelectedCampusId] = useState(
    initialCampusId ?? "",
  );
  const [selectedCourseId, setSelectedCourseId] = useState(
    initialCourseId ?? "",
  );
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(
    new Set(initialBlockIds ?? []),
  );
  const [selectedFacultyId, setSelectedFacultyId] = useState(
    facultyId ?? initialFacultyId ?? "",
  );

  // Load data on mount
  useEffect(() => {
    const load = async () => {
      const [campusModule, courseModule, blockModule, facultyModule] =
        await Promise.all([
          import("@/lib/admin/campuses"),
          import("@/lib/admin/courses"),
          import("@/lib/course-loading/queries"),
          import("@/lib/course-loading/queries"),
        ]);

      const [campusData, courseData, blockData, facultyData] =
        await Promise.all([
          campusModule.getCampusesList(),
          courseModule.getCoursesList(),
          blockModule.getBlockListByTerm(academicTermId),
          facultyModule.getFacultyListByTerm(academicTermId),
        ]);

      setCampuses(campusData);
      setCourses(courseData);
      setBlocks(blockData);
      setFacultyOptions(facultyData);
    };
    load();
  }, [academicTermId]);

  useEffect(() => {
    if (selectedCampusId) return;

    const preferredBlockId = blockId ?? initialBlockIds?.[0];
    if (!preferredBlockId) return;

    const preferredBlock = blocks.find((b) => b.id === preferredBlockId);
    if (preferredBlock?.campus_id) {
      setSelectedCampusId(preferredBlock.campus_id);
    }
  }, [blockId, blocks, initialBlockIds, selectedCampusId]);

  // Block filters (faculty-aware mode)
  const [programOfferingFilter, setProgramOfferingFilter] = useState("");
  const [yearLevelFilter, setYearLevelFilter] = useState("");

  // Derive program_offering options from blocks filtered by campus
  const campusBlocks = useMemo(() => {
    if (!selectedCampusId) return [];
    return blocks.filter((b) => b.campus_id === selectedCampusId);
  }, [blocks, selectedCampusId]);

  const programOfferingOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of campusBlocks) {
      if (b.program_offering_code)
        map.set(b.program_offering_code, b.program_offering_code);
    }
    return Array.from(map.keys()).sort();
  }, [campusBlocks]);

  const yearLevelOptions = useMemo(() => {
    const set = new Set<number>();
    for (const b of campusBlocks) set.add(b.year_level);
    return Array.from(set).sort((a, b) => a - b);
  }, [campusBlocks]);

  // Final filtered blocks
  const filteredBlocks = useMemo(() => {
    let result = campusBlocks;
    if (programOfferingFilter) {
      result = result.filter(
        (b) => b.program_offering_code === programOfferingFilter,
      );
    }
    if (yearLevelFilter) {
      result = result.filter((b) => b.year_level === Number(yearLevelFilter));
    }
    return result;
  }, [campusBlocks, programOfferingFilter, yearLevelFilter]);

  const toggleBlock = (id: string) => {
    setSelectedBlockIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCourse = (id: string) => {
    setSelectedCourseId((prev) => (prev === id ? "" : id));
  };

  const toggleFaculty = (id: string) => {
    setSelectedFacultyId((prev) => (prev === id ? "" : id));
  };

  // Summary
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const resolvedFacultyId = facultyId ?? selectedFacultyId;
  const resolvedBlockIds = useMemo(() => {
    if (selectedBlockIds.size > 0) return Array.from(selectedBlockIds);
    if (!isFacultyAware && blockId) return [blockId];
    return [];
  }, [selectedBlockIds, isFacultyAware, blockId]);

  const canSubmit =
    selectedCourseId &&
    resolvedBlockIds.length > 0 &&
    !isPending &&
    (Boolean(resolvedFacultyId) || (!isFacultyAware && mode === "Insert") || mode === "Edit");

  const handleSubmit = () => {
    setError("");
    startTransition(async () => {
      if (mode === "Insert") {
        if (!resolvedFacultyId && !isFacultyAware) {
          const result = await createBlockCourses({
            academic_term_id: academicTermId,
            course_id: selectedCourseId,
            block_ids: resolvedBlockIds,
          });
          if (result.error) {
            setError(result.error);
            return;
          }
        } else {
          const result = await createClass({
            academic_term_id: academicTermId,
            faculty_id: resolvedFacultyId,
            course_id: selectedCourseId,
            block_ids: resolvedBlockIds,
          });
          if (result.error) {
            setError(result.error);
            return;
          }
        }
      } else if (classId) {
        const result = await updateClass({
          class_id: classId,
          academic_term_id: academicTermId,
          faculty_id: resolvedFacultyId || undefined,
          course_id: selectedCourseId,
          block_ids: resolvedBlockIds,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      }
      onOpenChange(false);
    });
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        mode === "Insert"
          ? isFacultyAware
            ? "Add Class"
            : "Add Course"
          : "Edit Class"
      }
      description={
        isFacultyAware
          ? "Select a campus, course, and block(s)."
          : "Select a campus, course, and optionally a faculty member."
      }
      contentClassName="flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden"
    >
      <div className="h-full flex flex-col gap-4 overflow-hidden">
        {/* Campus dropdown */}
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/70">
            Campus
          </label>
          <select
            value={selectedCampusId}
            onChange={(e) => {
              setSelectedCampusId(e.target.value);
              setSelectedBlockIds(new Set());
              setProgramOfferingFilter("");
              setYearLevelFilter("");
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {isFacultyAware ? (
              <option value="">Select a campus…</option>
            ) : (
              <option value="">All Campuses</option>
            )}
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* 2-column grid */}
        <div className="grid flex-1 grid-cols-2 gap-4 overflow-hidden">
          {/* Course picker */}

          <PickerList
            title="Course"
            items={courses}
            getId={(c) => c.id}
            getLabel={(c) => c.code}
            getSubLabel={(c) => c.title}
            selected={new Set(selectedCourseId ? [selectedCourseId] : [])}
            onToggle={toggleCourse}
            placeholder="Search courses…"
          />

          {/* Faculty-aware: Block(s) picker / Block-aware: Faculty picker */}
          <div className="flex flex-col gap-1 overflow-hidden">
            {isFacultyAware ? (
              <ClassMakerFacultyPane
                selectedCampusId={selectedCampusId}
                filteredBlocks={filteredBlocks}
                selectedBlockIds={selectedBlockIds}
                toggleBlock={toggleBlock}
                programOfferingFilter={programOfferingFilter}
                onProgramOfferingFilterChange={(value) => {
                  setProgramOfferingFilter(value);
                  setSelectedBlockIds(new Set());
                }}
                yearLevelFilter={yearLevelFilter}
                onYearLevelFilterChange={(value) => {
                  setYearLevelFilter(value);
                  setSelectedBlockIds(new Set());
                }}
                programOfferingOptions={programOfferingOptions}
                yearLevelOptions={yearLevelOptions}
              />
            ) : (
              <ClassMakerBlockPane
                facultyOptions={facultyOptions}
                selectedFacultyId={selectedFacultyId}
                toggleFaculty={toggleFaculty}
              />
            )}
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-800 w-full border border-red-600 bg-red-100 p-2 rounded-md">
            {error}
          </p>
        )}

        <div className="flex flex-row gap-4 items-center">
          {/* Summary */}
          <div className="flex-1 grid grid-cols-2 gap-4 rounded-md border bg-foreground/5 p-3 text-sm">
            <p>
              <strong>Course:</strong>{" "}
              {selectedCourse
                ? `${selectedCourse.code} — ${selectedCourse.title}`
                : "None selected"}
            </p>
            {isFacultyAware ? (
              <p>
                <strong>Blocks:</strong>{" "}
                {selectedBlockIds.size > 0
                  ? Array.from(selectedBlockIds)
                      .map(
                        (id) =>
                          filteredBlocks.find((b) => b.id === id)?.code ?? id,
                      )
                      .join(", ")
                  : "None selected"}
              </p>
            ) : (
              <p>
                <strong>Faculty:</strong>{" "}
                {selectedFacultyId
                  ? (facultyOptions.find((f) => f.id === selectedFacultyId)
                      ?.name ?? "Unknown")
                  : "Unassigned"}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
            {isPending
              ? "Saving…"
              : mode === "Insert"
                ? isFacultyAware
                  ? "Insert Class"
                  : "Insert Course"
                : "Update Class"}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
};

export default ClassMaker;
