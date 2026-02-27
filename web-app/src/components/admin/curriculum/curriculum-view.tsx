"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, BookCopy } from "lucide-react";
import AdminPanel from "../admin-panel";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";
import { CurriculumListItem } from "@/lib/admin/curriculums";
import { deleteCurriculum } from "@/lib/admin/actions";

type CurriculumViewProps = {
  curriculum: CurriculumListItem;
  basePath: string;
};

export const CurriculumView = ({
  curriculum,
  basePath = "/curriculums",
}: CurriculumViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteCurriculum(curriculum.id);

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
      title="Curriculum Information"
      icon={Info}
      onClose={() => router.push(basePath)}
      onEdit={() => router.push(`${basePath}/${curriculum.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <BookCopy className="w-5 h-5" />
            <h3 className="text-base font-semibold">Curriculum Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className="text-xs text-foreground/60">Title</p>
              <p className="font-medium">{curriculum.title}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Series Year</p>
              <p className="font-medium">{curriculum.series_year}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Revised Year</p>
              <p className="font-medium">
                {curriculum.revised_year ?? "Not revised"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-foreground/60">Major</p>
              <p className="font-medium">
                {curriculum.major?.program?.code
                  ? `${curriculum.major.program.code} - `
                  : ""}
                {curriculum.major?.name ?? "Unknown"}
                {curriculum.major?.code ? ` (${curriculum.major.code})` : ""}
              </p>
            </div>
          </div>
        </div>

        <DangerZone
          description="Deleting this curriculum removes linked curriculum terms and linked curriculum courses."
          buttonLabel="Delete Curriculum"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Curriculum"
          description={
            <p>
              Are you sure you want to delete{" "}
              <strong>{curriculum.title}</strong>?
            </p>
          }
          confirmLabel="Delete Curriculum"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};
