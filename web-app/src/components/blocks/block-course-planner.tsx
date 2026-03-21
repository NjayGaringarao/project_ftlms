"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowBigUp, ArrowUp, NotebookTabs, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/components/ui/app-dialog";
import { PickerList } from "@/components/faculty-teaching-load/picker-list";
import type { CourseListItem } from "@/lib/admin/courses";
import type { BlockClassRow } from "@/lib/course-loading/types";
import { addCourseToBlock, removeCourseFromBlock } from "@/lib/blocks/course-planner";
import { getClassesByBlockAndTerm } from "@/lib/course-loading/queries";

type BlockCoursePlannerProps = {
  blockId: string;
  academicTermId: string | null;
};

const BlockCoursePlanner = ({
  blockId,
  academicTermId,
}: BlockCoursePlannerProps) => {
  const [rows, setRows] = useState<BlockClassRow[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    const [courseModule, classRows] = await Promise.all([
      import("@/lib/admin/courses"),
      academicTermId
        ? getClassesByBlockAndTerm(blockId, academicTermId)
        : Promise.resolve([]),
    ]);

    const courseList = await courseModule.getCoursesList();
    setCourses(courseList);
    setRows(classRows);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [blockId, academicTermId]);

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
        const result = await addCourseToBlock(blockId, courseId);
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
      const result = await removeCourseFromBlock(blockId, courseId);
      if (result.error) {
        setError(result.error);
        return;
      }
      await load();
    });
  };

  const totalUnits : number = useMemo(
    () => rows.reduce((sum, row) => sum + (row.unit || 0), 0),
    [rows],
  );

  return (
    <div>
      <div className="flex flex-row w-full items-center pb-2 border-b">
        <div className="flex-1 flex gap-2">
          <NotebookTabs className="w-5 h-5" />
          <h3 className="text-base font-semibold">Course Utilization</h3>
          <div title={totalUnits > 21 ? "Units for this block is overload" : ""} className="text-xs flex flex-row items-center bg-foreground/10 text-foreground/80 rounded-md px-2 py-0.5">

          <span>Total Units: {totalUnits.toFixed(2)}</span>
          {
            totalUnits >= 21 && (
              <ArrowUp className="ml-1 w-3 h-3 text-red-500" />
            )
          }
        </div>
          </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      { rows.length === 0 ? (
        <p className="text-sm text-foreground/60">No courses assigned yet.</p>
      ) : (
        <div className="overflow-hidden rounded-md border mt-4">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b bg-foreground/10">
              <tr className="text-left text-xs text-foreground">
                <th className="px-3 py-2">Course Code</th>
                <th className="px-3 py-2">Instructor</th>
                <th className="px-3 py-2">Laboratory (h)</th>
                <th className="px-3 py-2">Lecture (h)</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Merge(s)</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.id || "unassigned"}-${row.course_id}`} className="border-t">
                  <td title={row.course_title} className="px-3 py-2 font-medium">{row.course_code}</td>
                  <td className="px-3 py-2 text-foreground/70">
                    {row.faculty_name ?? "Unassigned"}
                  </td>
                  <td className="px-3 py-2">{row.laboratory_hours}</td>
                  <td className="px-3 py-2">{row.lecture_hours}</td>
                  <td className="px-3 py-2 font-medium">{row.unit}</td>
                  <td className="px-3 py-2 text-foreground/60 text-xs">
                    {row.merged_with.length > 0
                      ? row.merged_with.map((m) => m.block_code).join(", ")
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(row.course_id)}
                      disabled={Boolean(row.id) || isPending}
                      title={
                        row.id
                          ? "Remove the class assignment before deleting this course."
                          : "Remove course"
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
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
        title="Add Course to Block"
        description="Pick one or more courses to add to this block."
        contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
      >
        <div className="flex flex-col gap-3 overflow-hidden">
          <PickerList
            title="Course"
            items={availableCourses}
            getId={(c) => c.id}
            getLabel={(c) => c.code}
            getSubLabel={(c) => c.title}
            selected={selectedCourseIds}
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

export default BlockCoursePlanner;
