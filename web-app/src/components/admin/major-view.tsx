"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import AdminPanel from "./admin-panel";
import DangerZone from "./danger-zone";
import DeleteConfirmModal from "./delete-confirm-modal";
import { MajorListItem } from "@/lib/admin/majors";
import { deleteMajor } from "@/lib/admin/actions";

type MajorViewProps = {
  major: MajorListItem;
};

export const MajorView = ({ major }: MajorViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteMajor(major.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push("/majors");
  };

  return (
    <AdminPanel
      title="Major Information"
      icon={Layers}
      onClose={() => router.push("/majors")}
      onEdit={() => router.push(`/majors/${major.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Layers className="w-5 h-5" />
            <h3 className="text-base font-semibold">Major Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Code</p>
              <p className="font-medium">{major.code}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Name</p>
              <p className="font-medium">{major.name}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Program</p>
              <p className="font-medium">{major.program?.name ?? "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Department</p>
              <p className="font-medium">
                {major.program?.department?.name ?? "Unknown"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-foreground/60">Description</p>
              <p className="font-medium">
                {major.description || "No description"}
              </p>
            </div>
          </div>
        </div>

        <DangerZone
          description="Deleting this major also removes linked major offerings and dependent blocks."
          buttonLabel="Delete Major"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Major"
          description={
            <p>
              Are you sure you want to delete <strong>{major.name}</strong>?
            </p>
          }
          confirmLabel="Delete Major"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};
