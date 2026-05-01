"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddTile } from "@/components/ui/add-tile";
import FormStatusBanner from "../form-status-banner";
import DeleteConfirmModal from "../delete-confirm-modal";
import { createMajor, deleteMajor, updateMajor } from "@/features/admin/lib/actions";
import { getMajorsByProgram, MajorListItem } from "@/features/admin/lib/majors";
import { ExtendedProgram } from "@/features/shared/types/models";

type ProgramMajorsInlineProps = {
  program: ExtendedProgram;
};

type MajorFormState = {
  code: string;
  name: string;
  description: string;
};

const initialMajorFormState: MajorFormState = {
  code: "",
  name: "",
  description: "",
};

const majorToFormState = (major: MajorListItem): MajorFormState => ({
  code: major.code,
  name: major.name,
  description: major.description ?? "",
});

export const ProgramMajorsInline = ({ program }: ProgramMajorsInlineProps) => {
  const [majors, setMajors] = useState<MajorListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [majorToDelete, setMajorToDelete] = useState<MajorListItem | null>(
    null,
  );
  const [editingMajorId, setEditingMajorId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<MajorFormState>(initialMajorFormState);
  const [editForm, setEditForm] = useState<MajorFormState>(
    initialMajorFormState,
  );
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [success, setSuccess] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const programMajors = await getMajorsByProgram(program.id);
    setMajors(programMajors);
    setIsLoading(false);
  }, [program.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData]);

  const showSuccess = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  const handleAdd = async () => {
    if (!addForm.code.trim()) return setError("Major code is required");
    if (!addForm.name.trim()) return setError("Major name is required");

    setIsSubmitting(true);
    setError("");

    const { error: createError } = await createMajor({
      program_id: program.id,
      code: addForm.code,
      name: addForm.name,
      description: addForm.description,
    });

    setIsSubmitting(false);

    if (createError) {
      setError(createError);
      return;
    }

    await loadData();
    setAddForm(initialMajorFormState);
    setIsAddingOpen(false);
    showSuccess();
  };

  const handleStartEdit = (major: MajorListItem) => {
    setError("");
    setEditingMajorId(major.id);
    setEditForm(majorToFormState(major));
  };

  const handleSaveEdit = async () => {
    if (!editingMajorId) return;
    if (!editForm.code.trim()) return setError("Major code is required");
    if (!editForm.name.trim()) return setError("Major name is required");

    setIsSubmitting(true);
    setError("");

    const { error: updateError } = await updateMajor({
      id: editingMajorId,
      program_id: program.id,
      code: editForm.code,
      name: editForm.name,
      description: editForm.description,
    });

    setIsSubmitting(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    await loadData();
    setEditingMajorId(null);
    setEditForm(initialMajorFormState);
    showSuccess();
  };

  const handleDelete = async () => {
    if (!majorToDelete) return;

    setIsDeleting(true);
    setDeleteError("");

    const { error: removeError } = await deleteMajor(majorToDelete.id);

    setIsDeleting(false);

    if (removeError) {
      setDeleteError(removeError);
      return;
    }

    setMajorToDelete(null);
    await loadData();
    showSuccess();
  };

  return (
    <div className="space-y-3 pt-2 border-t">
      <h4 className="text-sm font-semibold">Majors</h4>

      <FormStatusBanner
        variant="compact"
        success={success ? { title: "Majors updated" } : undefined}
        error={error}
      />

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-xs text-foreground/70">Loading majors...</div>
        ) : majors.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-xs text-foreground/70">
            No majors linked to this program yet.
          </div>
        ) : (
          majors.map((major) => {
            const isEditing = editingMajorId === major.id;

            return (
              <div key={major.id} className="rounded-md border p-3 space-y-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label
                          className="text-xs"
                          htmlFor={`major-code-${major.id}`}
                        >
                          Code *
                        </Label>
                        <Input
                          id={`major-code-${major.id}`}
                          value={editForm.code}
                          onChange={(event) => {
                            setEditForm((prev) => ({
                              ...prev,
                              code: event.target.value,
                            }));
                            setError("");
                          }}
                          onBlur={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              code: event.target.value.trim().toUpperCase(),
                            }))
                          }
                          disabled={isSubmitting}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label
                          className="text-xs"
                          htmlFor={`major-name-${major.id}`}
                        >
                          Name *
                        </Label>
                        <Input
                          id={`major-name-${major.id}`}
                          value={editForm.name}
                          onChange={(event) => {
                            setEditForm((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }));
                            setError("");
                          }}
                          onBlur={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              name: event.target.value.trim(),
                            }))
                          }
                          disabled={isSubmitting}
                          className="mt-1"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label
                          className="text-xs"
                          htmlFor={`major-description-${major.id}`}
                        >
                          Description
                        </Label>
                        <Input
                          id={`major-description-${major.id}`}
                          value={editForm.description}
                          onChange={(event) => {
                            setEditForm((prev) => ({
                              ...prev,
                              description: event.target.value,
                            }));
                            setError("");
                          }}
                          onBlur={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              description: event.target.value.trim(),
                            }))
                          }
                          disabled={isSubmitting}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingMajorId(null);
                          setEditForm(initialMajorFormState);
                          setError("");
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit} disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{major.name}</p>
                      <p className="text-xs text-foreground/70">{major.code}</p>
                      <p className="text-xs text-foreground/70">
                        {major.description || "No description"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEdit(major)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeleteError("");
                          setMajorToDelete(major);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!isAddingOpen ? (
        <AddTile
          title="Add Major"
          description="Create a new major under this program."
          onClick={() => {
            setError("");
            setIsAddingOpen(true);
          }}
          disabled={isLoading || isSubmitting}
        />
      ) : (
        <div className="rounded-md border p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs" htmlFor="inline-major-code">
                Code *
              </Label>
              <Input
                id="inline-major-code"
                value={addForm.code}
                onChange={(event) => {
                  setAddForm((prev) => ({ ...prev, code: event.target.value }));
                  setError("");
                }}
                onBlur={(event) =>
                  setAddForm((prev) => ({
                    ...prev,
                    code: event.target.value.trim().toUpperCase(),
                  }))
                }
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="inline-major-name">
                Name *
              </Label>
              <Input
                id="inline-major-name"
                value={addForm.name}
                onChange={(event) => {
                  setAddForm((prev) => ({ ...prev, name: event.target.value }));
                  setError("");
                }}
                onBlur={(event) =>
                  setAddForm((prev) => ({
                    ...prev,
                    name: event.target.value.trim(),
                  }))
                }
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs" htmlFor="inline-major-description">
                Description
              </Label>
              <Input
                id="inline-major-description"
                value={addForm.description}
                onChange={(event) =>
                  setAddForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                onBlur={(event) =>
                  setAddForm((prev) => ({
                    ...prev,
                    description: event.target.value.trim(),
                  }))
                }
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddForm(initialMajorFormState);
                setError("");
                setIsAddingOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Major"}
            </Button>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!majorToDelete}
        title="Delete Major"
        description={
          <p>
            Delete <strong>{majorToDelete?.name ?? "this major"}</strong>?
          </p>
        }
        warning="Deleting this major also removes linked major offerings, blocks, and dependent class links. This cannot be undone."
        confirmLabel="Delete Major"
        isDeleting={isDeleting}
        error={deleteError}
        onCancel={() => setMajorToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
