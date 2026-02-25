"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";
import AdminPanel from "./admin-panel";
import DangerZone from "./danger-zone";
import DeleteConfirmModal from "./delete-confirm-modal";
import { MajorOfferingListItem } from "@/lib/admin/major-offerings";
import { deleteMajorOffering } from "@/lib/admin/actions";

type MajorOfferingViewProps = {
  offering: MajorOfferingListItem;
};

export const MajorOfferingView = ({ offering }: MajorOfferingViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteMajorOffering(offering.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push("/major-offerings");
  };

  return (
    <AdminPanel
      title="Major Offering Information"
      icon={Link2}
      onClose={() => router.push("/major-offerings")}
      onEdit={() => router.push(`/major-offerings/${offering.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Link2 className="w-5 h-5" />
            <h3 className="text-base font-semibold">Major Offering Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Major</p>
              <p className="font-medium">{offering.major?.name ?? "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Major Code</p>
              <p className="font-medium">{offering.major?.code ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Program</p>
              <p className="font-medium">
                {offering.program_campus?.program?.name ?? "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Campus</p>
              <p className="font-medium">
                {offering.program_campus?.campus?.name ?? "Unknown"}
              </p>
            </div>
          </div>
        </div>

        <DangerZone
          description="Deleting this major offering detaches it from blocks and related teaching structures."
          buttonLabel="Delete Major Offering"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Major Offering"
          description={
            <p>
              Are you sure you want to delete this major offering for{" "}
              <strong>{offering.major?.name}</strong>?
            </p>
          }
          confirmLabel="Delete Major Offering"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};
