"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import AdminPanel from "../admin-panel";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";
import { ProgramMajorsInline } from "./program-majors-inline";
import { deleteProgram } from "@/features/admin/lib/actions";
import { ExtendedProgram } from "@/features/shared/types/models";

type ProgramViewProps = {
  program: ExtendedProgram;
  basePath?: string;
};

export const ProgramView = ({
  program,
  basePath = "/programs",
}: ProgramViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteProgram(program.id);

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
      title="Program Information"
      icon={BookOpen}
      onClose={() => router.push(basePath)}
      onEdit={() => router.push(`${basePath}/${program.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-base font-semibold">Program Profile</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-foreground/60">Code</p>
              <p className="font-medium">{program.code}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Name</p>
              <p className="font-medium">{program.name}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">College</p>
              <p className="font-medium">
                {program.college?.name ?? "Unknown"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-foreground/60">Description</p>
              <p className="font-medium">
                {program.description || "No description"}
              </p>
            </div>
          </div>

          <ProgramMajorsInline program={program} />
        </div>

        <DangerZone
          description="Deleting this program also removes its majors and program offerings."
          buttonLabel="Delete Program"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Program"
          description={
            <p>
              Are you sure you want to delete <strong>{program.name}</strong>?
            </p>
          }
          confirmLabel="Delete Program"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};
