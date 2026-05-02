"use client";

import { useState } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ExtendedProgram } from "@/features/shared/types/models";
import { createProgramOffering } from "@/features/admin/lib/actions";
import FormStatusBanner from "../form-status-banner";

type OfferingDialogProps = {
  open: boolean;
  campusId: string;
  programs: ExtendedProgram[];
  onClose: () => void;
  onRefresh: () => void;
};

export function OfferingDialog({
  open,
  campusId,
  programs,
  onClose,
  onRefresh,
}: OfferingDialogProps) {
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <AppDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title="Add Program Offering"
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
          >
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.code} - {program.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={isSaving || !programId}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
}
