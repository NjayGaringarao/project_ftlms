"use client";

import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { ManagementContainer } from "@/components/layout/management-container";
import { AdminManagementList } from "@/features/admin/components/management/admin-management-list";
import { ManagementPlaceholder } from "@/features/admin/components/management/management-placeholder";
import { useAdminManagementNavigation } from "@/features/admin/hooks/use-admin-management-navigation";
import type { CourseListItem } from "@/features/admin/lib/courses";
import { createCourse, deleteCourse, updateCourse } from "@/features/admin/lib/actions";
import FormStatusBanner from "../form-status-banner";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCreatedRecordId } from "@/features/admin/lib/action-result-helpers";

type CourseFormState = {
  code: string;
  title: string;
  lectureUnit: string;
  laboratoryUnit: string;
};

type CoursesManagementProps = {
  courses: CourseListItem[];
  selectedCourse: CourseListItem | null;
  selectedId: string | null;
  isCreating: boolean;
};

const emptyForm: CourseFormState = {
  code: "",
  title: "",
  lectureUnit: "0",
  laboratoryUnit: "0",
};

const toForm = (course: CourseListItem | null): CourseFormState =>
  course
    ? {
        code: course.code,
        title: course.title,
        lectureUnit: String(course.lecture_unit ?? 0),
        laboratoryUnit: String(course.laboratory_unit ?? 0),
      }
    : emptyForm;

export function CoursesManagement({
  courses,
  selectedCourse,
  selectedId,
  isCreating,
}: CoursesManagementProps) {
  const nav = useAdminManagementNavigation();
  const [query, setQuery] = useState("");

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((course) =>
      [course.code, course.title].join(" ").toLowerCase().includes(q),
    );
  }, [courses, query]);

  const panelOpen = isCreating || Boolean(selectedId);

  return (
    <ManagementContainer
      list={
        <AdminManagementList
          query={query}
          onQueryChange={setQuery}
          selectedId={selectedId}
          createLabel="Create Course"
          searchPlaceholder="Search courses"
          emptyMessage="No courses match your search."
          onCreate={nav.openCreate}
          onSelect={nav.openItem}
          items={filteredCourses.map((course) => ({
            id: course.id,
            title: `[${course.code}] ${course.title}`,
            subtitle: [
              
              `Lec ${course.lecture_unit ?? 0} | Lab ${
                course.laboratory_unit ?? 0
              }`,
            ],
            icon: <BookOpen className="h-5 w-5" />,
          }))}
        />
      }
      panel={{
        open: panelOpen,
        title: isCreating
          ? "Create Course"
          : selectedCourse?.title ?? "Course not found",
        description: isCreating ? "Add a course." : "Edit course details.",
        content: (
          <CoursePanel
            key={isCreating ? "new" : selectedCourse?.id ?? "missing"}
            course={selectedCourse}
            isCreating={isCreating}
            onClose={nav.closePanel}
            onCreated={nav.replaceWithItem}
            onRefresh={nav.refresh}
          />
        ),
        onOpenChange: (open) => {
          if (!open) nav.closePanel();
        },
      }}
      panelPlaceholder={
        <ManagementPlaceholder
          title="Select a course"
          description="Course details and editable fields will appear here."
        />
      }
    />
  );
}

function CoursePanel({
  course,
  isCreating,
  onClose,
  onCreated,
  onRefresh,
}: {
  course: CourseListItem | null;
  isCreating: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  onRefresh: () => void;
}) {
  const initial = toForm(course);
  const [formData, setFormData] = useState<CourseFormState>(initial);
  const [savedFormData, setSavedFormData] = useState<CourseFormState>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasFormChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedFormData),
    [formData, savedFormData],
  );

  const handleSave = async () => {
    const lecture = Number(formData.lectureUnit);
    const laboratory = Number(formData.laboratoryUnit);
    if (!Number.isFinite(lecture) || lecture < 0) {
      setError("Lecture unit must be zero or greater");
      return;
    }
    if (!Number.isFinite(laboratory) || laboratory < 0) {
      setError("Laboratory unit must be zero or greater");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    const result = isCreating
      ? await createCourse({
          code: formData.code,
          title: formData.title,
          lecture_unit: lecture,
          laboratory_unit: laboratory,
        })
      : course
        ? await updateCourse({
            id: course.id,
            code: formData.code,
            title: formData.title,
            lecture_unit: lecture,
            laboratory_unit: laboratory,
          })
        : { error: "Course not found" };
    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const nextSaved = {
      code: formData.code.trim().toUpperCase(),
      title: formData.title.trim(),
      lectureUnit: String(lecture),
      laboratoryUnit: String(laboratory),
    };
    setSavedFormData(nextSaved);
    setFormData(nextSaved);
    setSuccess(isCreating ? "Course created successfully" : "Course updated successfully");
    onRefresh();
    const createdId = "data" in result ? getCreatedRecordId(result.data) : null;
    if (isCreating && createdId) onCreated(createdId);
  };

  const handleDelete = async () => {
    if (!course) return;
    setIsSaving(true);
    setError("");
    const result = await deleteCourse(course.id);
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowDeleteConfirm(false);
    onRefresh();
    onClose();
  };

  if (!isCreating && !course) {
    return <p className="text-sm text-foreground/70">Select another course from the list.</p>;
  }

  return (
    <div className="space-y-4">
      <FormStatusBanner
        variant="compact"
        success={success ? { title: success } : undefined}
        error={error}
      />
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs" htmlFor="course-code">
              Course Code *
            </Label>
            <Input
              id="course-code"
              value={formData.code}
              onChange={(event) =>
                setFormData((current) => ({ ...current, code: event.target.value }))
              }
              onBlur={(event) =>
                setFormData((current) => ({
                  ...current,
                  code: event.target.value.trim().toUpperCase(),
                }))
              }
              disabled={isSaving || !isCreating}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="course-title">
              Course Title *
            </Label>
            <Input
              id="course-title"
              value={formData.title}
              onChange={(event) =>
                setFormData((current) => ({ ...current, title: event.target.value }))
              }
              onBlur={(event) =>
                setFormData((current) => ({
                  ...current,
                  title: event.target.value.trim(),
                }))
              }
              disabled={isSaving}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="lecture-unit">
              Lecture Unit
            </Label>
            <Input
              id="lecture-unit"
              type="number"
              min="0"
              step="0.25"
              value={formData.lectureUnit}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  lectureUnit: event.target.value,
                }))
              }
              disabled={isSaving}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="laboratory-unit">
              Laboratory Unit
            </Label>
            <Input
              id="laboratory-unit"
              type="number"
              min="0"
              step="0.25"
              value={formData.laboratoryUnit}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  laboratoryUnit: event.target.value,
                }))
              }
              disabled={isSaving}
            />
          </div>
        </div>
        {hasFormChanges ? (
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData(isCreating ? emptyForm : savedFormData);
                setError("");
                setSuccess("");
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : isCreating
                  ? "Create Course"
                  : "Save Changes"}
            </Button>
          </div>
        ) : null}
      </div>
      {!isCreating && course ? (
        <>
          <DangerZone
            description="Deleting this course removes it from future course loading options."
            buttonLabel="Delete Course"
            onDeleteClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving}
          />
          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            title="Delete Course"
            description={
              <p>
                Are you sure you want to delete <strong>{course.title}</strong>?
              </p>
            }
            confirmLabel="Delete Course"
            isDeleting={isSaving}
            error={error}
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
          />
        </>
      ) : null}
    </div>
  );
}
