"use client";

import { useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { ManagementContainer } from "@/components/layout/management-container";
import { AdminManagementList } from "@/features/admin/components/management/admin-management-list";
import { ManagementPlaceholder } from "@/features/admin/components/management/management-placeholder";
import { useAdminManagementNavigation } from "@/features/admin/hooks/use-admin-management-navigation";
import type { AcademicYearListItem } from "@/features/admin/lib/academic-years";
import type { TermListItem } from "@/features/admin/lib/terms";
import {
  createAcademicYear,
  deleteAcademicYear,
  updateAcademicYear,
} from "@/features/admin/lib/actions";
import { getCreatedRecordId } from "@/features/admin/lib/action-result-helpers";
import DeleteConfirmModal from "../delete-confirm-modal";
import DangerZone from "../danger-zone";
import FormStatusBanner from "../form-status-banner";
import { AcademicCalendarFormState, InitialForm } from "./initial-form";
import { TermsGrid } from "./terms-grid";

type AcademicCalendarManagementProps = {
  years: AcademicYearListItem[];
  selectedYear: AcademicYearListItem | null;
  selectedTerms: TermListItem[];
  defaultTerm: TermListItem | null;
  selectedId: string | null;
  isCreating: boolean;
};

const emptyForm: AcademicCalendarFormState = {
  start_year: "",
  end_year: "",
};

const toForm = (
  year: AcademicYearListItem | null,
): AcademicCalendarFormState =>
  year
    ? { start_year: String(year.start_year), end_year: String(year.end_year) }
    : emptyForm;

export function AcademicCalendarManagement({
  years,
  selectedYear,
  selectedTerms,
  defaultTerm,
  selectedId,
  isCreating,
}: AcademicCalendarManagementProps) {
  const nav = useAdminManagementNavigation();
  const [query, setQuery] = useState("");

  const filteredYears = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return years;
    return years.filter((year) =>
      [year.code, String(year.start_year), String(year.end_year)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, years]);

  return (
    <ManagementContainer
      list={
        <AdminManagementList
          query={query}
          onQueryChange={setQuery}
          selectedId={selectedId}
          createLabel="Create Academic Year"
          searchPlaceholder="Search academic years"
          emptyMessage="No academic years match your search."
          onCreate={nav.openCreate}
          onSelect={nav.openItem}
          items={filteredYears.map((year) => ({
            id: year.id,
            title: `A.Y. ${year.code}`,
            subtitle: [],
            icon: <CalendarRange className="h-5 w-5" />,
            annotations:
              defaultTerm?.academic_year_id === year.id
                ? [
                    <div className="h-full flex flex-col justify-center">
                      <span className="text-xs py-1 px-3 bg-foreground/60 text-background rounded-xl">
                        Default
                      </span>
                    </div>,
                  ]
                : [],
          }))}
        />
      }
      panel={{
        open: isCreating || Boolean(selectedId),
        title: isCreating
          ? "Create Academic Year"
          : (selectedYear?.code ?? "Academic year not found"),
        description: isCreating
          ? "Add a new academic year."
          : "Edit academic year and manage calendar terms.",
        content: (
          <AcademicCalendarPanel
            key={isCreating ? "new" : (selectedYear?.id ?? "missing")}
            year={selectedYear}
            terms={selectedTerms}
            defaultTermId={defaultTerm?.id ?? null}
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
          title="Select an academic year"
          description="Academic year fields and terms will appear here."
        />
      }
    />
  );
}

function AcademicCalendarPanel({
  year,
  terms,
  defaultTermId,
  isCreating,
  onClose,
  onCreated,
  onRefresh,
}: {
  year: AcademicYearListItem | null;
  terms: TermListItem[];
  defaultTermId: string | null;
  isCreating: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  onRefresh: () => void;
}) {
  const initial = toForm(year);
  const [formData, setFormData] = useState<AcademicCalendarFormState>(initial);
  const [savedFormData, setSavedFormData] =
    useState<AcademicCalendarFormState>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasFormChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedFormData),
    [formData, savedFormData],
  );

  const handleSubmit = async () => {
    const startYear = Number(formData.start_year);
    const endYear = Number(formData.end_year);
    setIsSaving(true);
    setError("");
    setSuccess("");
    const result = isCreating
      ? await createAcademicYear({ start_year: startYear, end_year: endYear })
      : year
        ? await updateAcademicYear({
            id: year.id,
            start_year: startYear,
            end_year: endYear,
          })
        : { error: "Academic year not found" };
    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const nextSaved = {
      start_year: String(startYear),
      end_year: String(endYear),
    };
    setSavedFormData(nextSaved);
    setFormData(nextSaved);
    setSuccess(
      isCreating
        ? "Academic year created successfully"
        : "Academic year updated successfully",
    );
    onRefresh();
    const createdId = "data" in result ? getCreatedRecordId(result.data) : null;
    if (isCreating && createdId) onCreated(createdId);
  };

  const handleDelete = async () => {
    if (!year) return;
    setIsSaving(true);
    setError("");
    const result = await deleteAcademicYear(year.id);
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowDeleteConfirm(false);
    onRefresh();
    onClose();
  };

  if (!isCreating && !year) {
    return (
      <p className="text-sm text-foreground/70">
        Select another academic year from the list.
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
        submitLabel={isCreating ? "Create Academic Year" : "Save Changes"}
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
      {!isCreating && year ? (
        <>
          <TermsGrid
            year={year}
            terms={terms}
            defaultTermId={defaultTermId}
            onTermsChange={onRefresh}
          />
          <DangerZone
            description="Deleting this academic year is blocked while terms are attached."
            buttonLabel="Delete Academic Year"
            onDeleteClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving}
          />
          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            title="Delete Academic Year"
            description={
              <p>
                Are you sure you want to delete <strong>{year.code}</strong>?
              </p>
            }
            confirmLabel="Delete Academic Year"
            isDeleting={isSaving}
            error={error}
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
          />
        </>
      ) : null}
    </div>
  );
}
