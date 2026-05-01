"use client";

import { useState } from "react";
import { Calendar, Trash2 } from "lucide-react";
import { TermListItem } from "@/features/admin/lib/terms";
import { deleteTerm } from "@/features/admin/lib/actions";
import { Button } from "@/components/ui/button";
import DeleteConfirmModal from "../delete-confirm-modal";

type TermItemProps = {
  term: TermListItem;
  showRemove?: boolean;
  onRemoved?: () => void;
};

export const TermItem = ({
  term,
  showRemove = false,
  onRemoved,
}: TermItemProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    onRemoved?.();
  };

  return (
    <>
      <div className="shadow rounded-lg flex flex-row items-center">
        <div className="p-3">
          <Calendar className="w-8 h-8 text-foreground/60" />
        </div>

        <div className="p-3 flex-1">
          <p className="text-sm font-semibold">{term.name}</p>
          <p className="text-xs text-foreground/70">
            {new Date(term.start).toLocaleDateString()} –{" "}
            {new Date(term.end).toLocaleDateString()}
          </p>
        </div>

        {showRemove && (
          <div className="p-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Academic Term"
        description={
          <p>
            Are you sure you want to delete <strong>{term.name}</strong>?
          </p>
        }
        confirmLabel="Delete Term"
        isDeleting={isDeleting}
        error={deleteError}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </>
  );
};
