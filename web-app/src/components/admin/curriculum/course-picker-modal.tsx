"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CourseListItem } from "@/lib/admin/courses";

type CoursePickerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: CourseListItem[];
  linkedCourseIds: string[];
  query: string;
  onQueryChange: (value: string) => void;
  isLoading: boolean;
  error?: string;
  onSubmit: (courseIds: string[]) => void;
};

export const CoursePickerModal = ({
  open,
  onOpenChange,
  courses,
  linkedCourseIds,
  query,
  onQueryChange,
  isLoading,
  error,
  onSubmit,
}: CoursePickerModalProps) => {
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const linkedIdSet = useMemo(
    () => new Set(linkedCourseIds),
    [linkedCourseIds],
  );

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return courses.filter((course) => {
      if (linkedIdSet.has(course.id)) return false;

      if (!normalizedQuery) return true;

      return (
        course.code.toLowerCase().includes(normalizedQuery) ||
        course.title.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [courses, linkedIdSet, query]);

  const toggleSelection = (courseId: string) => {
    setSelectedCourseIds((current) =>
      current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId],
    );
  };

  const handleSubmit = () => {
    const selectableCourseIds = selectedCourseIds.filter(
      (courseId) => !linkedIdSet.has(courseId),
    );

    if (selectableCourseIds.length === 0) return;
    onSubmit(selectableCourseIds);
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSelectedCourseIds([]);
          onQueryChange("");
        }
        onOpenChange(nextOpen);
      }}
      title="Select Courses"
      description="Select one or more courses to link to this curriculum term."
      contentClassName="max-w-3xl"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
          <Input
            placeholder="Search by course code or title"
            className="pl-9"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {filteredCourses.length === 0 && (
            <div className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
              No courses match your search.
            </div>
          )}

          {filteredCourses.map((course) => {
            const isChecked = selectedCourseIds.includes(course.id);

            return (
              <label
                key={course.id}
                className="flex cursor-pointer items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{course.code}</p>
                  <p className="text-xs text-foreground/70">{course.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelection(course.id)}
                    disabled={isLoading}
                    className="mt-0.5 h-4 w-4"
                  />
                </div>
              </label>
            );
          })}
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-900">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || selectedCourseIds.length === 0}
          >
            {isLoading
              ? "Adding..."
              : `Add Selected (${selectedCourseIds.length})`}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
};
