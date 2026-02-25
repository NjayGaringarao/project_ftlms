"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminPanel from "./admin-panel";
import DangerZone from "./danger-zone";
import DeleteConfirmModal from "./delete-confirm-modal";
import { deleteProgram } from "@/lib/admin/actions";
import { ExtendedProgram } from "@/models";

type ProgramViewProps = {
  program: ExtendedProgram;
  basePath?: string;
  majorsPath?: string;
};

export const ProgramView = ({
  program,
  basePath = "/programs",
  majorsPath,
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Code</p>
              <p className="font-medium">{program.code}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Name</p>
              <p className="font-medium">{program.name}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Department</p>
              <p className="font-medium">
                {program.department?.name ?? "Unknown"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-foreground/60">Description</p>
              <p className="font-medium">
                {program.description || "No description"}
              </p>
            </div>
          </div>

          {majorsPath && (
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-semibold">Program Entities</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(majorsPath)}
                >
                  Majors
                </Button>
              </div>
            </div>
          )}
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
