"use client";

import { useState } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMajor, updateMajor } from "@/features/admin/lib/actions";
import type { MajorListItem } from "@/features/admin/lib/majors";
import FormStatusBanner from "../form-status-banner";

type MajorDialogProps = {
  open: boolean;
  major: MajorListItem | null;
  programId: string;
  onClose: () => void;
  onRefresh: () => void;
};

export function MajorDialog({
  open,
  major,
  programId,
  onClose,
  onRefresh,
}: MajorDialogProps) {
  const [code, setCode] = useState(major?.code ?? "");
  const [name, setName] = useState(major?.name ?? "");
  const [description, setDescription] = useState(major?.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isCreating = !major;

  const save = async () => {
    setIsSaving(true);
    setError("");
    const result = isCreating
      ? await createMajor({ program_id: programId, code, name, description })
      : await updateMajor({
          id: major.id,
          program_id: programId,
          code,
          name,
          description,
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
      title={isCreating ? "Add Major" : "Edit Major"}
    >
      <div className="space-y-4 p-4">
        <FormStatusBanner variant="compact" error={error} />
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label className="text-xs" htmlFor="major-code">
              Major Code *
            </Label>
            <Input
              id="major-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="major-name">
              Major Name *
            </Label>
            <Input
              id="major-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="major-description">
              Description
            </Label>
            <textarea
              id="major-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
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
          <Button type="button" onClick={save} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
}
