"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/utils/style";
import { createClass, updateClass } from "@/lib/course-loading/actions";
import type { CampusListItem } from "@/lib/admin/campuses";
import type { CourseListItem } from "@/lib/admin/courses";
import type { CourseLoadingBlockListItem } from "@/lib/course-loading/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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

// ─── Searchable single/multi-select list ────────────────

type PickerListProps<T> = {
  items: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  getSubLabel?: (item: T) => string;
  selected: Set<string>;
  onToggle: (id: string) => void;
  placeholder?: string;
  multi?: boolean;
  pickerComponents?: React.ReactNode;
  title: string;
};

function PickerList<T>({
  items,
  getId,
  getLabel,
  getSubLabel,
  selected,
  onToggle,
  placeholder = "Search…",
  multi = false,
  pickerComponents,
  title,
}: PickerListProps<T>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => getLabel(item).toLowerCase().includes(q));
  }, [items, query, getLabel]);

  return (
    <Card className="h-full overflow-hidden px-4 py-2 gap-0">
      <CardHeader className="px-0 py-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="shrink-0 text-sm"
      />

      {pickerComponents}
      <CardContent className="flex flex-1 flex-col p-0 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="py-3 text-center text-sm text-foreground/60">
            No results.
          </p>
        )}
        {filtered.map((item) => {
          const id = getId(item);
          const isSelected = selected.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
                "hover:bg-foreground/5",
                isSelected && "bg-foreground/10 font-semibold",
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  isSelected
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/30",
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate">{getLabel(item)}</p>
                {getSubLabel && (
                  <p className="truncate text-foreground/60 text-xs">
                    {getSubLabel(item)}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

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
  const [facultyOptions, setFacultyOptions] = useState<
    { id: string; name: string }[]
  >([]);

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
          facultyModule.getAllFacultyForPicker(),
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

  const canSubmit =
    resolvedFacultyId &&
    selectedCourseId &&
    selectedBlockIds.size > 0 &&
    !isPending;

  const handleSubmit = () => {
    setError("");
    startTransition(async () => {
      if (mode === "Insert") {
        const result = await createClass({
          academic_term_id: academicTermId,
          faculty_id: resolvedFacultyId,
          course_id: selectedCourseId,
          block_ids: Array.from(selectedBlockIds),
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      } else if (classId) {
        const result = await updateClass({
          class_id: classId,
          academic_term_id: academicTermId,
          course_id: selectedCourseId,
          block_ids: Array.from(selectedBlockIds),
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
      title={mode === "Insert" ? "Add Class" : "Edit Class"}
      description={
        isFacultyAware
          ? "Select a campus, course, and block(s)."
          : "Select a campus, course, and faculty."
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
              <>
                {!selectedCampusId ? (
                  <div className="flex items-center justify-center rounded-md border p-8 text-sm text-foreground/50">
                    Select a campus first to view blocks.
                  </div>
                ) : (
                  <>
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
                      placeholder="Search blocks…"
                      multi
                      pickerComponents={
                        <div className="flex gap-2 pt-2">
                          <select
                            value={programOfferingFilter}
                            onChange={(e) => {
                              setProgramOfferingFilter(e.target.value);
                              setSelectedBlockIds(new Set());
                            }}
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
                            onChange={(e) => {
                              setYearLevelFilter(e.target.value);
                              setSelectedBlockIds(new Set());
                            }}
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
                  </>
                )}
              </>
            ) : (
              <>
                <PickerList
                  title="Faculty"
                  items={facultyOptions}
                  getId={(f) => f.id}
                  getLabel={(f) => f.name}
                  selected={
                    new Set(selectedFacultyId ? [selectedFacultyId] : [])
                  }
                  onToggle={toggleFaculty}
                  placeholder="Search faculty…"
                />
              </>
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
                  : "None selected"}
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
                ? "Insert Class"
                : "Update Class"}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
};

export default ClassMaker;
