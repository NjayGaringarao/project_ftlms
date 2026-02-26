"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AddTile } from "@/components/ui/add-tile";
import FormStatusBanner from "../form-status-banner";
import DeleteConfirmModal from "../delete-confirm-modal";
import {
  getMajorOfferingsByProgramOffering,
  MajorOfferingListItem,
} from "@/lib/admin/major-offerings";
import { getMajorsByProgram, MajorListItem } from "@/lib/admin/majors";
import { createMajorOffering, deleteMajorOffering } from "@/lib/admin/actions";
import { ProgramOfferingListItem } from "@/lib/admin/program-offerings";

type ProgramOfferingMajorOfferingsInlineProps = {
  offering: ProgramOfferingListItem;
};

export const ProgramOfferingMajorOfferingsInline = ({
  offering,
}: ProgramOfferingMajorOfferingsInlineProps) => {
  const [majorOfferings, setMajorOfferings] = useState<MajorOfferingListItem[]>(
    [],
  );
  const [majors, setMajors] = useState<MajorListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [majorIdToAdd, setMajorIdToAdd] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [majorOfferingToDelete, setMajorOfferingToDelete] =
    useState<MajorOfferingListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    const [existingOfferings, availableMajors] = await Promise.all([
      getMajorOfferingsByProgramOffering(offering.id),
      getMajorsByProgram(offering.program_id),
    ]);
    setMajorOfferings(existingOfferings);
    setMajors(availableMajors);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [offering.id, offering.program_id]);

  const addableMajors = useMemo(() => {
    const linkedMajorIds = new Set(majorOfferings.map((item) => item.major_id));
    return majors.filter((major) => !linkedMajorIds.has(major.id));
  }, [majorOfferings, majors]);

  const handleAdd = async () => {
    if (!majorIdToAdd) {
      setError("Major is required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    const { error: createError } = await createMajorOffering({
      program_campus_id: offering.id,
      major_id: majorIdToAdd,
    });

    setIsSubmitting(false);

    if (createError) {
      setError(createError);
      return;
    }

    await loadData();
    setMajorIdToAdd("");
    setIsAddingOpen(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  const handleDelete = async () => {
    if (!majorOfferingToDelete) return;

    setIsDeleting(true);
    setDeleteError("");

    const { error: removeError } = await deleteMajorOffering(
      majorOfferingToDelete.id,
    );

    setIsDeleting(false);

    if (removeError) {
      setDeleteError(removeError);
      return;
    }

    setMajorOfferingToDelete(null);
    await loadData();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <div className="space-y-3 pt-2 border-t">
      <h4 className="text-sm font-semibold">Major Offerings</h4>

      <FormStatusBanner
        variant="compact"
        success={success ? { title: "Major offerings updated" } : undefined}
        error={error}
      />

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-xs text-foreground/70">
            Loading major offerings...
          </div>
        ) : majorOfferings.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-xs text-foreground/70">
            No major offerings linked yet.
          </div>
        ) : (
          majorOfferings.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {item.major?.name ?? "Unknown"}
                </p>
                <p className="text-xs text-foreground/70">
                  {item.major?.code ?? "N/A"}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleteError("");
                  setMajorOfferingToDelete(item);
                }}
              >
                Remove
              </Button>
            </div>
          ))
        )}
      </div>

      {!isAddingOpen ? (
        <AddTile
          title="Add Major Offering"
          description="Link another major to this program offering."
          onClick={() => {
            setError("");
            setIsAddingOpen(true);
          }}
          disabled={isLoading || addableMajors.length === 0}
        />
      ) : (
        <div className="rounded-md border p-3 space-y-3">
          <div>
            <Label className="text-xs" htmlFor="inline-major-id">
              Major *
            </Label>
            <select
              id="inline-major-id"
              className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              value={majorIdToAdd}
              onChange={(event) => {
                setMajorIdToAdd(event.target.value);
                setError("");
              }}
              disabled={isSubmitting}
            >
              <option value="">Select major...</option>
              {addableMajors.map((major) => (
                <option key={major.id} value={major.id}>
                  {major.name} ({major.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMajorIdToAdd("");
                setError("");
                setIsAddingOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isSubmitting || addableMajors.length === 0}
            >
              {isSubmitting ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!majorOfferingToDelete}
        title="Remove Major Offering"
        description={
          <p>
            Remove{" "}
            <strong>
              {majorOfferingToDelete?.major?.name ?? "this major"}
            </strong>{" "}
            from this program offering?
          </p>
        }
        warning="Removing this link will also remove dependent blocks and unlink class assignments tied to those blocks."
        confirmLabel="Remove"
        isDeleting={isDeleting}
        error={deleteError}
        onCancel={() => setMajorOfferingToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
