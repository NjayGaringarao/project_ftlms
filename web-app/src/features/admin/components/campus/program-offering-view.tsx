"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Network } from "lucide-react";
import AdminPanel from "../admin-panel";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";
import { ProgramOfferingMajorOfferingsInline } from "./program-offering-major-offerings-inline";
import { ProgramOfferingListItem } from "@/features/admin/lib/program-offerings";
import { deleteProgramOffering } from "@/features/admin/lib/actions";

type ProgramOfferingViewProps = {
  offering: ProgramOfferingListItem;
  basePath?: string;
};

export const ProgramOfferingView = ({
  offering,
  basePath = "/program-offerings",
}: ProgramOfferingViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteProgramOffering(offering.id);

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
      title="Program Offering Information"
      icon={Info}
      onClose={() => router.push(basePath)}
      onEdit={() => router.push(`${basePath}/${offering.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Network className="w-5 h-5" />
            <h3 className="text-base font-semibold">
              Program Offering Profile
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Program</p>
              <p className="font-medium">
                {offering.program?.name ?? "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Program Code</p>
              <p className="font-medium">{offering.program?.code ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Campus</p>
              <p className="font-medium">
                {offering.campus?.name ?? "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">College</p>
              <p className="font-medium">
                {offering.program?.college?.name ?? "Unknown"}
              </p>
            </div>
          </div>

          <ProgramOfferingMajorOfferingsInline offering={offering} />
        </div>

        <DangerZone
          description="Deleting this program offering also removes linked major offerings, blocks, and dependent records."
          buttonLabel="Delete Program Offering"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Program Offering"
          description={
            <p>
              Are you sure you want to delete program offering for{" "}
              <strong>{offering.program?.name}</strong> at{" "}
              <strong>{offering.campus?.name}</strong>?
            </p>
          }
          confirmLabel="Delete Program Offering"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};
