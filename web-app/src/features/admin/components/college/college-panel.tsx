"use client";

import { useMemo, useState } from "react";
import { GraduationCap, X } from "lucide-react";
import { AddTile } from "@/components/ui/add-tile";
import type { CollegeListItem } from "@/features/admin/lib/colleges";
import type { MajorListItem } from "@/features/admin/lib/majors";
import type { ExtendedProgram } from "@/features/shared/types/models";
import {
  createDepartment,
  deleteDepartment,
  deleteProgram,
  updateDepartment,
} from "@/features/admin/lib/actions";
import { getCreatedRecordId } from "@/features/admin/lib/action-result-helpers";
import {
  InitialForm,
  type CollegeFormState,
} from "./initial-form";
import { CollegeLogoField } from "./college-logo-field";
import { ProgramDialog } from "./program-dialog";
import { ResourceSection } from "./resource-section";
import FormStatusBanner from "../form-status-banner";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";

type CollegePanelProps = {
  college: CollegeListItem | null;
  programs: ExtendedProgram[];
  majors: MajorListItem[];
  isCreating: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  onRefresh: () => void;
};

const emptyForm: CollegeFormState = {
  code: "",
  name: "",
  description: "",
};

const toForm = (college: CollegeListItem | null): CollegeFormState =>
  college
    ? {
        code: college.code,
        name: college.name,
        description: college.description ?? "",
      }
    : emptyForm;

export function CollegePanel({
  college,
  programs,
  majors,
  isCreating,
  onClose,
  onCreated,
  onRefresh,
}: CollegePanelProps) {
  const initial = toForm(college);
  const [formData, setFormData] = useState<CollegeFormState>(initial);
  const [savedFormData, setSavedFormData] =
    useState<CollegeFormState>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [programDialogId, setProgramDialogId] = useState<
    string | "new" | null
  >(null);
  const [areProgramsOpen, setAreProgramsOpen] = useState(true);
  const [programToDelete, setProgramToDelete] =
    useState<ExtendedProgram | null>(null);
  const [isDeletingProgram, setIsDeletingProgram] = useState(false);
  const [programDeleteError, setProgramDeleteError] = useState("");
  const hasFormChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedFormData),
    [formData, savedFormData],
  );

  const handleSubmit = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    const result = isCreating
      ? await createDepartment(formData)
      : college
        ? await updateDepartment({ id: college.id, ...formData })
        : { error: "College not found" };
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const nextSaved = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim(),
    };
    setSavedFormData(nextSaved);
    setFormData(nextSaved);
    setSuccess(
      isCreating
        ? "College created successfully"
        : "College updated successfully",
    );
    onRefresh();
    const createdId = "data" in result ? getCreatedRecordId(result.data) : null;
    if (isCreating && createdId) onCreated(createdId);
  };

  const handleDelete = async () => {
    if (!college) return;
    setIsSaving(true);
    setError("");
    const result = await deleteDepartment(college.id);
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowDeleteConfirm(false);
    onRefresh();
    onClose();
  };

  const handleDeleteProgram = async () => {
    if (!programToDelete) return;
    setIsDeletingProgram(true);
    setProgramDeleteError("");
    const result = await deleteProgram(programToDelete.id);
    setIsDeletingProgram(false);
    if (result.error) {
      setProgramDeleteError(result.error);
      return;
    }
    setProgramToDelete(null);
    onRefresh();
  };

  if (!isCreating && !college) {
    return (
      <p className="text-sm text-foreground/70">
        Select another college from the list.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <InitialForm
        formData={formData}
        onChange={(field, value) => {
          setFormData((current) => ({ ...current, [field]: value }));
          setError("");
        }}
        onReset={() => {
          setFormData(isCreating ? emptyForm : savedFormData);
          setError("");
          setSuccess("");
        }}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        isEditing={!isCreating}
        submitLabel={isCreating ? "Create College" : "Save Changes"}
        submitLoadingLabel={isCreating ? "Creating..." : "Saving..."}
        showActions={hasFormChanges}
        statusSlot={
          <FormStatusBanner
            variant="compact"
            success={success ? { title: success } : undefined}
            error={error}
          />
        }
      />

      {!isCreating && college ? (
        <>
          <CollegeLogoField
            collegeId={college.id}
            currentLogoPath={college.logo_path ?? null}
            disabled={isSaving}
          />
          <ResourceSection
            title="Programs"
            count={programs.length}
            isOpen={areProgramsOpen}
            onToggle={() => setAreProgramsOpen((current) => !current)}
          >
            <AddTile
              title="Add Program"
              description="Create a program for this college"
              onClick={() => setProgramDialogId("new")}
            />
            {!!programs.length && (
              programs.map((program) => (
                <div
                  key={program.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-background transition-colors hover:bg-foreground/5"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 px-4 py-3 text-left"
                    onClick={() => setProgramDialogId(program.id)}
                  >
                    <p className="truncate text-sm font-semibold">
                      {program.name}
                    </p>
                    <p className="truncate text-xs text-foreground/70">
                      {program.description ?? "No description"}
                    </p>
                  </button>
                  <div className="mr-3 flex shrink-0 items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-foreground/70">
                      <GraduationCap className="h-3 w-3" />
                      {program.code}
                    </span>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setProgramDeleteError("");
                        setProgramToDelete(program);
                      }}
                      aria-label={`Delete ${program.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </ResourceSection>

          <DangerZone
            description="Deleting this college removes related programs and linked user affiliations."
            buttonLabel="Delete College"
            onDeleteClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving}
          />
          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            title="Delete College"
            description={
              <p>
                Are you sure you want to delete <strong>{college.name}</strong>?
              </p>
            }
            confirmLabel="Delete College"
            isDeleting={isSaving}
            error={error}
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
          />
          <ProgramDialog
            key={programDialogId ?? "closed-program"}
            open={programDialogId !== null}
            program={
              programs.find((program) => program.id === programDialogId) ?? null
            }
            majors={majors.filter(
              (major) => major.program_id === programDialogId,
            )}
            collegeId={college.id}
            onClose={() => setProgramDialogId(null)}
            onRefresh={onRefresh}
          />
          <DeleteConfirmModal
            isOpen={programToDelete !== null}
            title="Delete Program"
            description={
              <p>
                Are you sure you want to delete{" "}
                <strong>{programToDelete?.name}</strong>?
              </p>
            }
            confirmLabel="Delete Program"
            isDeleting={isDeletingProgram}
            error={programDeleteError}
            onCancel={() => {
              setProgramDeleteError("");
              setProgramToDelete(null);
            }}
            onConfirm={handleDeleteProgram}
          />
        </>
      ) : null}
    </div>
  );
}
