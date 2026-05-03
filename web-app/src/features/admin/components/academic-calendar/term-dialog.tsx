"use client";

import { useState } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTerm } from "@/features/admin/lib/actions";
import type { AcademicTermName } from "@/features/shared/types/models";
import type { AcademicYear } from "@/features/shared/types/models/academic_year";
import FormStatusBanner from "../form-status-banner";

type TermDialogProps = {
  open: boolean;
  year: AcademicYear;
  availableNames: AcademicTermName[];
  onClose: () => void;
  onRefresh: () => void;
};

export function TermDialog({
  open,
  year,
  availableNames,
  onClose,
  onRefresh,
}: TermDialogProps) {
  const [name, setName] = useState<AcademicTermName | "">(
    availableNames[0] ?? "",
  );
  const [start, setStart] = useState(`${year.start_year}-01-01`);
  const [end, setEnd] = useState(`${year.end_year}-12-31`);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!name) {
      setError("Academic term name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    const result = await createTerm({
      academic_year_id: year.id,
      name,
      start,
      end,
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
      title="Add Term"
    >
      <div className="space-y-4 p-4">
        <FormStatusBanner variant="compact" error={error} />
        <div>
          <Label className="text-xs" htmlFor="term-name">
            Term Name *
          </Label>
          <select
            id="term-name"
            className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={name}
            onChange={(event) =>
              setName(event.target.value as AcademicTermName)
            }
            disabled={isSaving || availableNames.length === 0}
          >
            {availableNames.map((termName) => (
              <option key={termName} value={termName}>
                {termName}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs" htmlFor="term-start">
              Start Date *
            </Label>
            <Input
              id="term-start"
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="term-end">
              End Date *
            </Label>
            <Input
              id="term-end"
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              disabled={isSaving}
            />
          </div>
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
          <Button
            type="button"
            onClick={save}
            disabled={isSaving || !name || availableNames.length === 0}
          >
            {isSaving ? "Creating..." : "Create Term"}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
}
