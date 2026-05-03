"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { AddTile } from "@/components/ui/add-tile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { MajorOfferingListItem } from "@/features/admin/lib/major-offerings";
import type { MajorListItem } from "@/features/admin/lib/majors";
import type { ProgramOfferingListItem } from "@/features/admin/lib/program-offerings";
import type { ExtendedProgram } from "@/features/shared/types/models";
import {
  createMajorOffering,
  createProgramOffering,
  deleteMajorOffering,
} from "@/features/admin/lib/actions";
import DeleteConfirmModal from "../delete-confirm-modal";
import FormStatusBanner from "../form-status-banner";

type OfferingDialogProps = {
  open: boolean;
  offering: ProgramOfferingListItem | null;
  majorOfferings: MajorOfferingListItem[];
  campusId: string;
  programs: ExtendedProgram[];
  offeredProgramIds: string[];
  majors: MajorListItem[];
  onClose: () => void;
  onRefresh: () => void;
};

export function OfferingDialog({
  open,
  offering,
  majorOfferings,
  campusId,
  programs,
  offeredProgramIds,
  majors,
  onClose,
  onRefresh,
}: OfferingDialogProps) {
  const isCreating = !offering;
  const offeredProgramIdSet = useMemo(
    () => new Set(offeredProgramIds),
    [offeredProgramIds],
  );
  const availablePrograms = isCreating
    ? programs.filter((program) => !offeredProgramIdSet.has(program.id))
    : programs;
  const [programId, setProgramId] = useState(
    offering?.program_id ?? availablePrograms[0]?.id ?? "",
  );
  const [majorId, setMajorId] = useState("");
  const [isMajorOfferingDialogOpen, setIsMajorOfferingDialogOpen] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingMajorOffering, setIsAddingMajorOffering] = useState(false);
  const [majorOfferingToDelete, setMajorOfferingToDelete] =
    useState<MajorOfferingListItem | null>(null);
  const [isDeletingMajorOffering, setIsDeletingMajorOffering] = useState(false);
  const [error, setError] = useState("");
  const [majorOfferingError, setMajorOfferingError] = useState("");
  const existingMajorIds = useMemo(
    () => new Set(majorOfferings.map((majorOffering) => majorOffering.major_id)),
    [majorOfferings],
  );
  const availableMajors = majors.filter(
    (major) => major.program_id === programId && !existingMajorIds.has(major.id),
  );
  const selectedMajorId = availableMajors.some((major) => major.id === majorId)
    ? majorId
    : availableMajors[0]?.id || "";

  const save = async () => {
    setIsSaving(true);
    setError("");
    const result = await createProgramOffering({
      campus_id: campusId,
      program_id: programId,
    });
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onRefresh();
    onClose();
  };

  const addMajorOffering = async () => {
    if (!offering) return;
    setIsAddingMajorOffering(true);
    setMajorOfferingError("");
    const result = await createMajorOffering({
      program_offering_id: offering.id,
      major_id: selectedMajorId,
    });
    setIsAddingMajorOffering(false);
    if (result.error) {
      setMajorOfferingError(result.error);
      return;
    }
    setMajorId("");
    setIsMajorOfferingDialogOpen(false);
    onRefresh();
  };

  const removeMajorOffering = async () => {
    if (!majorOfferingToDelete) return;
    setIsDeletingMajorOffering(true);
    setMajorOfferingError("");
    const result = await deleteMajorOffering(majorOfferingToDelete.id);
    setIsDeletingMajorOffering(false);
    if (result.error) {
      setMajorOfferingError(result.error);
      return;
    }
    setMajorOfferingToDelete(null);
    onRefresh();
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={isCreating ? "Add Program Offering" : "Program Offering"}
      variant="floating-medium"
    >
      <div className="space-y-4 p-4">
        <FormStatusBanner variant="compact" error={error} />
        <div>
          <Label className="text-xs" htmlFor="program-offering-program">
            Program *
          </Label>
          <select
            id="program-offering-program"
            className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={programId}
            onChange={(event) => setProgramId(event.target.value)}
            disabled={isSaving || !isCreating}
          >
            {availablePrograms.map((program) => (
              <option key={program.id} value={program.id}>
                {program.code} - {program.name}
              </option>
            ))}
          </select>
        </div>
        {!isCreating ? (
          <div className="space-y-3 border-t pt-4">
            <FormStatusBanner variant="compact" error={majorOfferingError} />
            <div>
              <p className="text-sm font-semibold">Major Offerings</p>
              <p className="text-xs text-foreground/70">
                {majorOfferings.length} total
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <AddTile
                title="Add Major Offering"
                description="Assign a major to this program offering"
                onClick={() => {
                  setMajorOfferingError("");
                  setMajorId("");
                  setIsMajorOfferingDialogOpen(true);
                }}
                disabled={!availableMajors.length}
              />
              {majorOfferings.map((majorOffering) => (
                <div
                  key={majorOffering.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-background px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      [{majorOffering.major?.code}] {majorOffering.major?.name}
                    </p>
                    <p className="truncate text-xs text-foreground/70">
                      {majorOffering.major?.description ?? "No description"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setMajorOfferingError("");
                      setMajorOfferingToDelete(majorOffering);
                    }}
                    aria-label={`Delete ${
                      majorOffering.major?.name ?? "major offering"
                    }`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          {isCreating ? (
            <Button
              type="button"
              onClick={save}
              disabled={isSaving || !programId}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          ) : null}
        </div>
        <DeleteConfirmModal
          isOpen={majorOfferingToDelete !== null}
          title="Delete Major Offering"
          description={
            <p>
              Are you sure you want to delete{" "}
              <strong>
                {majorOfferingToDelete?.major?.name ?? "this major offering"}
              </strong>
              ?
            </p>
          }
          confirmLabel="Delete Major Offering"
          isDeleting={isDeletingMajorOffering}
          error={majorOfferingError}
          onCancel={() => {
            setMajorOfferingError("");
            setMajorOfferingToDelete(null);
          }}
          onConfirm={removeMajorOffering}
        />
        <AppDialog
          open={isMajorOfferingDialogOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setMajorOfferingError("");
              setIsMajorOfferingDialogOpen(false);
            }
          }}
          title="Add Major Offering"
        >
          <div className="space-y-4 p-4">
            <FormStatusBanner variant="compact" error={majorOfferingError} />
            <div>
              <Label className="text-xs" htmlFor="major-offering-major">
                Major *
              </Label>
              <select
                id="major-offering-major"
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={selectedMajorId}
                onChange={(event) => setMajorId(event.target.value)}
                disabled={isAddingMajorOffering || !availableMajors.length}
              >
                {availableMajors.map((major) => (
                  <option key={major.id} value={major.id}>
                    {major.code} - {major.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMajorOfferingError("");
                  setIsMajorOfferingDialogOpen(false);
                }}
                disabled={isAddingMajorOffering}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={addMajorOffering}
                disabled={
                  isAddingMajorOffering ||
                  !selectedMajorId ||
                  !availableMajors.length
                }
              >
                {isAddingMajorOffering ? "Adding..." : "Add Major Offering"}
              </Button>
            </div>
          </div>
        </AppDialog>
      </div>
    </AppDialog>
  );
}
