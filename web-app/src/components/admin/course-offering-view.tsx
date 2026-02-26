"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, Info } from "lucide-react";
import AdminPanel from "./admin-panel";
import DangerZone from "./danger-zone";
import DeleteConfirmModal from "./delete-confirm-modal";
import { CourseOfferingListItem } from "@/lib/admin/course-offerings";
import { deleteCourseOffering } from "@/lib/admin/actions";
import { getAcademicTermDisplayLabel } from "@/lib/admin/academic-terms";

type CourseOfferingViewProps = {
  offering: CourseOfferingListItem;
  basePath?: string;
};

export const CourseOfferingView = ({
  offering,
  basePath = "/course-offerings",
}: CourseOfferingViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteCourseOffering(offering.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push(basePath);
  };

  return (
    <AdminPanel
      title="Course Offering Information"
      icon={Info}
      onClose={() => router.push(basePath)}
      onEdit={() => router.push(`${basePath}/${offering.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <CalendarCheck2 className="w-5 h-5" />
            <h3 className="text-base font-semibold">Course Offering Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Course</p>
              <p className="font-medium">
                {offering.course?.title ?? "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Code</p>
              <p className="font-medium">{offering.course.code ?? "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Academic Term</p>
              <p className="font-medium">
                {offering.term
                  ? getAcademicTermDisplayLabel(offering.term)
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Term Code</p>
              <p className="font-medium">{offering.term?.code ?? "N/A"}</p>
            </div>
          </div>
        </div>

        <DangerZone
          description="Deleting this course offering removes it from class scheduling for the selected term."
          buttonLabel="Delete Course Offering"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Course Offering"
          description={
            <p>
              Are you sure you want to delete{" "}
              <strong>{offering.course?.title}</strong> offering at{" "}
              <strong>{offering.campus?.name}</strong>?
            </p>
          }
          confirmLabel="Delete Course Offering"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};
