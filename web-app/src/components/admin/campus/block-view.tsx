"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Blocks } from "lucide-react";
import AdminPanel from "../admin-panel";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";
import { deleteBlock } from "@/lib/admin/actions";
import { BlockListItem } from "@/lib/admin/blocks";

type BlockViewProps = {
  block: BlockListItem;
  basePath?: string;
};

export const BlockView = ({ block, basePath = "/blocks" }: BlockViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteBlock(block.id);

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
      title="Block Information"
      icon={Blocks}
      onClose={() => router.push(basePath)}
      onEdit={() => router.push(`${basePath}/${block.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Blocks className="w-5 h-5" />
            <h3 className="text-base font-semibold">Block Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Year Level</p>
              <p className="font-medium">{block.year_level}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Section</p>
              <p className="font-medium">{block.section}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Student Count</p>
              <p className="font-medium">{block.student_count ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Major</p>
              <p className="font-medium">
                {block.major_p_c?.major?.name ?? "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Program</p>
              <p className="font-medium">
                {block.major_p_c?.program_campus?.program?.name ?? "Unknown"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-foreground/60">Curriculum</p>
              <p className="font-medium">
                {block.curriculum
                  ? `${block.curriculum.title} (${block.curriculum.series_year})`
                  : "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Campus</p>
              <p className="font-medium">
                {block.major_p_c?.program_campus?.campus?.name ?? "Unknown"}
              </p>
            </div>
          </div>
        </div>

        <DangerZone
          description="Deleting this block removes the assigned section from related class links."
          buttonLabel="Delete Block"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Block"
          description={
            <p>
              Are you sure you want to delete{" "}
              <strong>
                Year {block.year_level} - {block.section}
              </strong>
              ?
            </p>
          }
          confirmLabel="Delete Block"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};
