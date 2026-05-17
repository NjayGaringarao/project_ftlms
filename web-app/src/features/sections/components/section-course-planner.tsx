"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  BookOpen,
  ClipboardClock,
  MoreHorizontal,
  NotebookTabs,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/components/ui/app-dialog";
import { MultiPickerList } from "@/features/shared/components/pickers/multi-picker-list";
import type { CourseListItem } from "@/features/admin/lib/courses";
import type { SectionClassRow } from "@/features/faculty-teaching-load/lib/course-loading/types";
import {
  addCourseToSection,
  removeCourseFromSection,
} from "@/features/sections/lib/course-planner";
import { getClassesBySectionAndTerm } from "@/features/faculty-teaching-load/lib/course-loading/queries";
import { numberToHourDuration } from "@/utils/time";
import { Popover } from "radix-ui";
import { cn } from "@/utils/style";

type SectionCoursePlannerProps = {
  sectionId: string;
  academicTermId: string | null;
};

const SectionCoursePlanner = ({
  sectionId,
  academicTermId,
}: SectionCoursePlannerProps) => {
  const [rows, setRows] = useState<SectionClassRow[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const load = useCallback(async () => {
    const [courseModule, classRows] = await Promise.all([
      import("@/features/admin/lib/courses"),
      academicTermId
        ? getClassesBySectionAndTerm(sectionId, academicTermId)
        : Promise.resolve([]),
    ]);

    const courseList = await courseModule.getCoursesList();
    setCourses(courseList);
    setRows(classRows);
  }, [academicTermId, sectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const existingCourseIds = useMemo(
    () => new Set(rows.map((row) => row.course_id)),
    [rows],
  );

  const availableCourses = useMemo(
    () => courses.filter((course) => !existingCourseIds.has(course.id)),
    [courses, existingCourseIds],
  );

  const handleAdd = () => {
    if (selectedCourseIds.size === 0) {
      setError("Select at least one course to add.");
      return;
    }
    setError("");
    startTransition(async () => {
      for (const courseId of selectedCourseIds) {
        const result = await addCourseToSection(
          sectionId,
          courseId,
          academicTermId,
        );
        if (result.error) {
          setError(result.error);
          return;
        }
      }
      setSelectedCourseIds(new Set());
      setOpen(false);
      await load();
    });
  };

  const handleRemove = (courseId: string) => {
    setError("");
    startTransition(async () => {
      const result = await removeCourseFromSection(
        sectionId,
        courseId,
        academicTermId,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      await load();
    });
  };

  const handleManageSchedule = (row: SectionClassRow) => {
    if (!academicTermId) {
      setError("Academic term is required to manage schedule.");
      return;
    }

    const params = new URLSearchParams();
    params.set("academic_term_id", academicTermId);
    params.set("sectionId", sectionId);
    if (row.course_utilization_id) {
      params.set("courseUtilizationId", row.course_utilization_id);
    }
    if (row.faculty_id) {
      params.set("facultyId", row.faculty_id);
    }

    router.push(`/scheduler?${params.toString()}`);
  };

  const totalUnits: number = useMemo(
    () => rows.reduce((sum, row) => sum + (row.unit || 0), 0),
    [rows],
  );

  return (
    <div>
      <div className="flex flex-row w-full items-center pb-2 border-b">
        <div className="flex-1 flex gap-2">
          <NotebookTabs className="w-5 h-5" />
          <h3 className="text-base font-semibold">Course Utilization</h3>
          <div
            title={totalUnits > 21 ? "Units for this section is overload" : ""}
            className="text-xs flex flex-row items-center bg-foreground/10 text-foreground/80 rounded-md px-2 py-0.5"
          >
            <span>Total Units: {totalUnits.toFixed(2)}</span>
            {totalUnits >= 21 && (
              <ArrowUp className="ml-1 w-3 h-3 text-red-500" />
            )}
          </div>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-foreground/60">No courses assigned yet.</p>
      ) : (
        <div className="overflow-hidden rounded-md border mt-4">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b bg-foreground/10">
              <tr className="text-left text-xs text-foreground">
                <th className="px-3 py-2">Course Code</th>
                <th className="px-3 py-2">Instructor</th>
                <th className="px-3 py-2">Lecture</th>
                <th className="px-3 py-2">Laboratory</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Merge(s)</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.id || "unassigned"}-${row.course_id}`}
                  className="border-t"
                >
                  <td
                    title={row.course_title}
                    className="px-3 py-2 font-medium"
                  >
                    {row.course_code}
                  </td>
                  <td className="px-3 py-2 text-foreground/70">
                    {row.faculty_name ?? "Unassigned"}
                  </td>
                  <td
                    title="Unscheduled over total Lecture Hours"
                    className="px-3 py-2"
                  >
                    {numberToHourDuration(row.unscheduled_lecture_hours)} /{" "}
                    {numberToHourDuration(row.lecture_hours)}
                  </td>
                  <td
                    title="Unscheduled over total Laboratory Hours"
                    className="px-3 py-2"
                  >
                    {numberToHourDuration(row.unscheduled_laboratory_hours)} /{" "}
                    {numberToHourDuration(row.laboratory_hours)}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {row.unit.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-foreground/60 text-xs">
                    {row.merged_with.length > 0
                      ? row.merged_with.map((m) => m.section_code).join(", ")
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Popover.Root>
                      <Popover.Trigger>
                     
                          <MoreHorizontal className="h-4 w-4" />
                       
                      </Popover.Trigger>
                      <Popover.Anchor />
                      <Popover.Portal>
                        <Popover.Content>
                          <div className="flex flex-col bg-background rounded-md overflow-hidden shadow-md border">
                            
                            <button
                              className="flex items-center gap-2 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:hover:bg-transparent border-b"
                              onClick={() => handleManageSchedule(row)}
                              disabled={!academicTermId || isPending}
                              title={
                                !academicTermId
                                  ? "Academic term is required to manage schedule."
                                  : "Manage schedule"
                              }
                            >
                              <ClipboardClock className="h-4 w-4" /> Manage Schedule
                            </button>
                            <button
                              className={cn("flex items-center gap-2 px-3 py-2 text-sm hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-50")}
                              onClick={() => handleRemove(row.course_id)}
                              disabled={row.has_sessions || isPending}
                              title={
                                row.has_sessions
                                  ? "Cannot remove — class has scheduled sessions."
                                  : "Remove course"
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" /> Remove Course
                            </button>

                          </div>
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}

      <AppDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSelectedCourseIds(new Set());
            setError("");
          }
        }}
        title="Add Course to Section"
        description="Pick one or more courses to add to this section."
        variant="floating-medium"
        contentClassName="flex max-h-[85vh] p-4 flex-col overflow-hidden"
      >
        <div className="flex flex-col gap-3 overflow-hidden">
          <MultiPickerList

            items={availableCourses}
            getId={(c) => c.id}
            getTitle={(c) => c.code}
            getSubtitle={(c) => [c.title]}
            getSearchText={(c) => `${c.code} ${c.title}`}
            selectedIds={selectedCourseIds}
            onToggle={(id) =>
              setSelectedCourseIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) {
                  next.delete(id);
                } else {
                  next.add(id);
                }
                return next;
              })
            }
            placeholder="Search courses..."
            icon={<BookOpen className="h-5 w-5 text-background/80" />}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={selectedCourseIds.size === 0 || isPending}
            >
              Add Course{selectedCourseIds.size > 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </AppDialog>
    </div>
  );
};

export default SectionCoursePlanner;
