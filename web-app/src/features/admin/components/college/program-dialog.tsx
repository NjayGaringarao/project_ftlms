"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { AddTile } from "@/components/ui/add-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProgram,
  deleteMajor,
  updateProgram,
} from "@/features/admin/lib/actions";
import type { MajorListItem } from "@/features/admin/lib/majors";
import type { ExtendedProgram } from "@/features/shared/types/models";
import DeleteConfirmModal from "../delete-confirm-modal";
import FormStatusBanner from "../form-status-banner";
import { MajorDialog } from "./major-dialog";

type ProgramDialogProps = {
  open: boolean;
  program: ExtendedProgram | null;
  majors: MajorListItem[];
  collegeId: string;
  onClose: () => void;
  onRefresh: () => void;
};

export function ProgramDialog({
  open,
  program,
  majors,
  collegeId,
  onClose,
  onRefresh,
}: ProgramDialogProps) {
  const [code, setCode] = useState(program?.code ?? "");
  const [name, setName] = useState(program?.name ?? "");
  const [description, setDescription] = useState(program?.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [majorDialogId, setMajorDialogId] = useState<string | "new" | null>(
    null,
  );
  const [majorToDelete, setMajorToDelete] = useState<MajorListItem | null>(
    null,
  );
  const [isDeletingMajor, setIsDeletingMajor] = useState(false);
  const [majorDeleteError, setMajorDeleteError] = useState("");
  const isCreating = !program;

  const save = async () => {
    setIsSaving(true);
    setError("");
    const result = isCreating
      ? await createProgram({ college_id: collegeId, code, name, description })
      : await updateProgram({
          id: program.id,
          college_id: collegeId,
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

  const removeMajor = async () => {
    if (!majorToDelete) return;
    setIsDeletingMajor(true);
    setMajorDeleteError("");
    const result = await deleteMajor(majorToDelete.id);
    setIsDeletingMajor(false);
    if (result.error) {
      setMajorDeleteError(result.error);
      return;
    }
    setMajorToDelete(null);
    onRefresh();
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={isCreating ? "Add Program" : "Edit Program"}
      variant="floating-medium"
    >
      <div className="space-y-4 p-4">
        <FormStatusBanner variant="compact" error={error} />
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label className="text-xs" htmlFor="program-code">
              Program Code *
            </Label>
            <Input
              id="program-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="program-name">
              Program Name *
            </Label>
            <Input
              id="program-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="program-description">
              Description
            </Label>
            <textarea
              id="program-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
            />
          </div>
        </div>
        {!isCreating && program ? (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Majors</p>
                <p className="text-xs text-foreground/70">
                  {majors.length} total
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <AddTile
                title="Add Major"
                description="Create a major under this program"
                onClick={() => setMajorDialogId("new")}
              />
              {majors.map((major) => (
                <div
                  key={major.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-background transition-colors hover:bg-foreground/5"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 px-4 py-3 text-left"
                    onClick={() => setMajorDialogId(major.id)}
                  >
                    <p className="truncate text-sm font-semibold">
                      [{major.code}] {major.name}
                    </p>
                    <p className="truncate text-xs text-foreground/70">
                      {major.description ?? "No description"}
                    </p>
                  </button>
                  <button
                    type="button"
                    className="mr-3 rounded-md p-1.5 text-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setMajorDeleteError("");
                      setMajorToDelete(major);
                    }}
                    aria-label={`Delete ${major.name}`}
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
          <Button type="button" onClick={save} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
        {!isCreating && program ? (
          <>
            <MajorDialog
              key={majorDialogId ?? "closed-major"}
              open={majorDialogId !== null}
              major={
                majors.find((major) => major.id === majorDialogId) ?? null
              }
              programId={program.id}
              onClose={() => setMajorDialogId(null)}
              onRefresh={onRefresh}
            />
            <DeleteConfirmModal
              isOpen={majorToDelete !== null}
              title="Delete Major"
              description={
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{majorToDelete?.name}</strong>?
                </p>
              }
              confirmLabel="Delete Major"
              isDeleting={isDeletingMajor}
              error={majorDeleteError}
              onCancel={() => {
                setMajorDeleteError("");
                setMajorToDelete(null);
              }}
              onConfirm={removeMajor}
            />
          </>
        ) : null}
      </div>
    </AppDialog>
  );
}
