"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Trophy } from "lucide-react";
import { Rank } from "@/models/academic_rank";
import { deleteRank } from "@/lib/admin/actions";
import AdminPanel from "../admin-panel";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";

type RankViewProps = {
  rank: Rank;
};

export const RankView = ({ rank }: RankViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteRank(rank.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push("/academic-ranks");
  };

  return (
    <AdminPanel
      title="Rank Information"
      icon={Info}
      onClose={() => router.push("/academic-ranks")}
      onEdit={() => router.push(`/academic-ranks/${rank.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Trophy className="w-5 h-5" />
            <h3 className="text-base font-semibold">Rank Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Rank Number</p>
              <p className="font-medium">{rank.number}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Title</p>
              <p className="font-medium">{rank.title}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-foreground/60">Description</p>
              <p className="font-medium">
                {rank.description || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        <DangerZone
          description="Deleting this rank unassigns it from linked users."
          buttonLabel="Delete Rank"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Rank"
          description={
            <p>
              Are you sure you want to delete <strong>{rank.title}</strong>?
              This action cannot be undone.
            </p>
          }
          confirmLabel="Delete Rank"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};
