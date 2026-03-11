"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Info } from "lucide-react";
import { AcademicYear } from "@/models/academic_year";
import { TermListItem } from "@/lib/admin/terms";
import { deleteAcademicYear } from "@/lib/admin/actions";
import { TermsListView } from "./terms-list-view";
import AdminPanel from "../admin-panel";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";

type YearViewProps = {
  year: AcademicYear;
  terms: TermListItem[];
};

export const YearView = ({ year, terms }: YearViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteAcademicYear(year.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push("/academic-years");
  };

  return (
    <AdminPanel
      title="Academic Year Information"
      icon={Info}
      onClose={() => router.push("/academic-years")}
      onEdit={() => router.push(`/academic-years/${year.id}/edit`)}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <CalendarRange className="w-5 h-5" />
          <h3 className="text-base font-semibold">Academic Year Profile</h3>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Code</p>
              <p className="font-medium">{year.code}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Year Range</p>
              <p className="font-medium">
                {year.start_year} - {year.end_year}
              </p>
            </div>
          </div>
        </div>

        <TermsListView terms={terms} />
      </div>

      <DangerZone
        description="You can only delete an academic year when no terms are attached. Manage terms in edit mode."
        buttonLabel="Delete Academic Year"
        onDeleteClick={() => setShowDeleteConfirm(true)}
        disabled={isDeleting || terms.length > 0}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Academic Year"
        description={
          <p>
            Are you sure you want to delete <strong>{year.code}</strong>?
          </p>
        }
        warning="If terms exist, deletion will be rejected."
        confirmLabel="Delete Academic Year"
        isDeleting={isDeleting}
        error={deleteError}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </AdminPanel>
  );
};
