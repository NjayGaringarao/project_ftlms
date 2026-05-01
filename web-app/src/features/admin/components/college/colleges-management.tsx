"use client";

import { useMemo, useState } from "react";
import { Building2, GraduationCap } from "lucide-react";
import { ManagementContainer } from "@/components/layout/management-container";
import { AdminManagementList } from "@/features/admin/components/management/admin-management-list";
import { AdminInlineListSection } from "@/features/admin/components/management/admin-inline-list-section";
import { ManagementPlaceholder } from "@/features/admin/components/management/management-placeholder";
import { useAdminManagementNavigation } from "@/features/admin/hooks/use-admin-management-navigation";
import type { CollegeListItem } from "@/features/admin/lib/colleges";
import type { ExtendedProgram } from "@/features/shared/types/models";
import {
  createDepartment,
  createProgram,
  deleteDepartment,
  deleteProgram,
  updateDepartment,
  updateProgram,
} from "@/features/admin/lib/actions";
import {
  DepartmentInitialForm,
  type DepartmentFormState,
} from "./department-initial-form";
import FormStatusBanner from "../form-status-banner";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCreatedRecordId } from "@/features/admin/lib/action-result-helpers";

type CollegesManagementProps = {
  colleges: CollegeListItem[];
  selectedCollege: CollegeListItem | null;
  programs: ExtendedProgram[];
  selectedId: string | null;
  isCreating: boolean;
};

const emptyForm: DepartmentFormState = {
  code: "",
  name: "",
  description: "",
};

const toForm = (college: CollegeListItem | null): DepartmentFormState =>
  college
    ? {
        code: college.code,
        name: college.name,
        description: college.description ?? "",
      }
    : emptyForm;

export function CollegesManagement({
  colleges,
  selectedCollege,
  programs,
  selectedId,
  isCreating,
}: CollegesManagementProps) {
  const nav = useAdminManagementNavigation();
  const [query, setQuery] = useState("");
  const filteredColleges = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return colleges;
    return colleges.filter((college) =>
      [college.code, college.name, college.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [colleges, query]);

  return (
    <ManagementContainer
      list={
        <AdminManagementList
          query={query}
          onQueryChange={setQuery}
          selectedId={selectedId}
          createLabel="Create College"
          searchPlaceholder="Search colleges"
          emptyMessage="No colleges match your search."
          onCreate={nav.openCreate}
          onSelect={nav.openItem}
          items={filteredColleges.map((college) => ({
            id: college.id,
            title: college.code,
            subtitle: [college.name],
            icon: <Building2 className="h-5 w-5" />,
          }))}
        />
      }
      panel={{
        open: isCreating || Boolean(selectedId),
        title: isCreating
          ? "Create College"
          : selectedCollege?.name ?? "College not found",
        description: isCreating
          ? "Add a college."
          : "Edit college details and manage inline programs.",
        content: (
          <CollegePanel
            college={selectedCollege}
            programs={programs}
            isCreating={isCreating}
            onClose={nav.closePanel}
            onCreated={nav.replaceWithItem}
            onRefresh={nav.refresh}
          />
        ),
        onOpenChange: (open) => {
          if (!open) nav.closePanel();
        },
      }}
      panelPlaceholder={
        <ManagementPlaceholder
          title="Select a college"
          description="College fields and programs will appear here."
        />
      }
    />
  );
}

function CollegePanel({
  college,
  programs,
  isCreating,
  onClose,
  onCreated,
  onRefresh,
}: {
  college: CollegeListItem | null;
  programs: ExtendedProgram[];
  isCreating: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  onRefresh: () => void;
}) {
  const initial = toForm(college);
  const [formData, setFormData] = useState<DepartmentFormState>(initial);
  const [savedFormData, setSavedFormData] = useState<DepartmentFormState>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [programDialogId, setProgramDialogId] = useState<string | "new" | null>(
    null,
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
    setSuccess(isCreating ? "College created successfully" : "College updated successfully");
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

  if (!isCreating && !college) {
    return <p className="text-sm text-foreground/70">Select another college from the list.</p>;
  }

  return (
    <div className="space-y-4">
      <DepartmentInitialForm
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
        submitLabel={isCreating ? "Create College" : "Save Changes"}
        submitLoadingLabel={isCreating ? "Creating..." : "Saving..."}
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
          <AdminInlineListSection
            title="Programs"
            emptyMessage="No programs added for this college."
            createLabel="Add Program"
            onCreate={() => setProgramDialogId("new")}
            onEdit={(id) => setProgramDialogId(id)}
            items={programs.map((program) => ({
              id: program.id,
              title: program.name,
              description: program.description ?? "No description",
              meta: (
                <span className="inline-flex items-center gap-1 text-xs text-foreground/70">
                  <GraduationCap className="h-3 w-3" />
                  {program.code}
                </span>
              ),
            }))}
          />
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
            program={programs.find((program) => program.id === programDialogId) ?? null}
            collegeId={college.id}
            onClose={() => setProgramDialogId(null)}
            onRefresh={onRefresh}
          />
        </>
      ) : null}
    </div>
  );
}

function ProgramDialog({
  open,
  program,
  collegeId,
  onClose,
  onRefresh,
}: {
  open: boolean;
  program: ExtendedProgram | null;
  collegeId: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [code, setCode] = useState(program?.code ?? "");
  const [name, setName] = useState(program?.name ?? "");
  const [description, setDescription] = useState(program?.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
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

  const remove = async () => {
    if (!program) return;
    setIsSaving(true);
    setError("");
    const result = await deleteProgram(program.id);
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
      title={isCreating ? "Add Program" : "Edit Program"}
    >
      <div className="space-y-4">
        <FormStatusBanner variant="compact" error={error} />
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label className="text-xs" htmlFor="program-code">Program Code *</Label>
            <Input id="program-code" value={code} onChange={(event) => setCode(event.target.value)} />
          </div>
          <div>
            <Label className="text-xs" htmlFor="program-name">Program Name *</Label>
            <Input id="program-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div>
            <Label className="text-xs" htmlFor="program-description">Description</Label>
            <Input
              id="program-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-between gap-2 border-t pt-4">
          {!isCreating ? (
            <Button type="button" variant="destructive" onClick={remove} disabled={isSaving}>
              Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </AppDialog>
  );
}
