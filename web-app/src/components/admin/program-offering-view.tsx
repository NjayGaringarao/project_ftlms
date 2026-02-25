"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminPanel from "./admin-panel";
import DangerZone from "./danger-zone";
import DeleteConfirmModal from "./delete-confirm-modal";
import { ProgramOfferingListItem } from "@/lib/admin/program-offerings";
import { deleteProgramOffering } from "@/lib/admin/actions";

type ProgramOfferingViewProps = {
  offering: ProgramOfferingListItem;
  basePath?: string;
  majorOfferingsPath?: string;
};

export const ProgramOfferingView = ({
  offering,
  basePath = "/program-offerings",
  majorOfferingsPath,
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
      icon={Network}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p className="text-xs text-foreground/60">Department</p>
              <p className="font-medium">
                {offering.program?.department?.name ?? "Unknown"}
              </p>
            </div>
          </div>

          {majorOfferingsPath && (
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-semibold">
                Program Offering Entities
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(majorOfferingsPath)}
                >
                  Major Offerings
                </Button>
              </div>
            </div>
          )}
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
