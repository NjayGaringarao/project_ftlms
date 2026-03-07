"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { College } from "@/models/college";
import { deleteDepartment } from "@/lib/admin/actions";
import AdminPanel from "../admin-panel";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";

type DepartmentViewProps = {
  college: College;
};

export const CollegeView = ({ college }: DepartmentViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteDepartment(college.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push("/colleges");
  };

  return (
    <AdminPanel
      title="College Information"
      icon={Info}
      onClose={() => router.push("/colleges")}
      onEdit={() => router.push(`/colleges/${college.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Building2 className="w-5 h-5" />
            <h3 className="text-base font-semibold">College Profile</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-foreground/60 mt-0.5" />
              <div>
                <p className="text-xs text-foreground/60">Code</p>
                <p className="font-medium">{college.code}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-foreground/60 mt-0.5" />
              <div>
                <p className="text-xs text-foreground/60">Name</p>
                <p className="font-medium">{college.name}</p>
              </div>
            </div>

            <div className="md:col-span-2 flex items-start gap-3">
              <FileText className="w-5 h-5 text-foreground/60 mt-0.5" />
              <div>
                <p className="text-xs text-foreground/60">Description</p>
                <p className="font-medium">
                  {college.description || "No description provided"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-semibold">College Entities</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/colleges/${college.id}/programs`)}
              >
                Programs
              </Button>
            </div>
          </div>
        </div>

        <DangerZone
          description={
            "Deleting this college removes its programs, majors, and related offerings across campuses."
          }
          buttonLabel="Delete College"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete College"
          description={
            <p>
              Are you sure you want to delete <strong>{college.name}</strong>?
              This action cannot be undone.
            </p>
          }
          warning={
            "All related program definitions, majors, and offering links under this college will also be deleted."
          }
          confirmLabel="Delete College"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};

export const DepartmentView = ({ department }: { department: College }) => (
  <CollegeView college={department} />
);
