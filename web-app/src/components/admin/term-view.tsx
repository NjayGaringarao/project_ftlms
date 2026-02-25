"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Info } from "lucide-react";
import { Term } from "@/models/term";
import { deleteTerm } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import DangerZone from "./danger-zone";
import DeleteConfirmModal from "./delete-confirm-modal";
import {
  getAcademicTermDisplayLabel,
  getAcademicYearLabel,
  getTermOrderLabel,
  getTermTypeLabel,
} from "@/lib/admin/academic-terms";

type TermViewProps = {
  term: Term;
};

const formatDate = (value: string | null) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export const TermView = ({ term }: TermViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteTerm(term.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push("/academic-terms");
  };

  return (
    <AdminPanel
      title="Term Information"
      icon={Info}
      onClose={() => router.push("/academic-terms")}
      onEdit={() => router.push(`/academic-terms/${term.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Calendar className="w-5 h-5" />
            <h3 className="text-base font-semibold">Term Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground/60">Academic Year</p>
              <p className="font-medium">
                {getAcademicYearLabel(
                  term.academic_year_start,
                  term.academic_year_end,
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Term Type</p>
              <p className="font-medium">{getTermTypeLabel(term.type)}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Term Order</p>
              <p className="font-medium">
                {getTermOrderLabel(term.term_order)}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Code</p>
              <p className="font-medium">{term.code}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Start Date</p>
              <p className="font-medium">{formatDate(term.start)}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">End Date</p>
              <p className="font-medium">{formatDate(term.end)}</p>
            </div>
          </div>
        </div>

        <DangerZone
          description="Term deletion is blocked when schedules are still attached."
          buttonLabel="Delete Term"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Term"
          description={
            <p>
              Are you sure you want to delete
              <strong>{` ${getAcademicTermDisplayLabel(term)}`}</strong>?
            </p>
          }
          warning="If dependent schedules exist, this operation will be rejected."
          confirmLabel="Delete Term"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </>
    </AdminPanel>
  );
};
