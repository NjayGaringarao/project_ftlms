"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotebookTabs } from "lucide-react";
import { Course } from "@/models";
import { deleteCourse } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import DangerZone from "./danger-zone";
import DeleteConfirmModal from "./delete-confirm-modal";

type CourseViewProps = {
  course: Course;
};

export const CourseView = ({ course }: CourseViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteCourse(course.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push("/courses");
  };

  return (
    <AdminPanel
      title="Course Information"
      icon={NotebookTabs}
      onClose={() => router.push("/courses")}
      onEdit={() => router.push(`/courses/${course.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <NotebookTabs className="w-5 h-5" />
            <h3 className="text-base font-semibold">Course Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Code</p>
              <p className="font-medium">{course.code}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Title</p>
              <p className="font-medium">{course.title}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Lecture Hour</p>
              <p className="font-medium">{course.lecture_hour ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Laboratory Hour</p>
              <p className="font-medium">{course.laboratory_hour ?? 0}</p>
            </div>
          </div>
        </div>

        <DangerZone
          description="Deleting this course removes dependent course offerings and scheduled class links."
          buttonLabel="Delete Course"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
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
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};
