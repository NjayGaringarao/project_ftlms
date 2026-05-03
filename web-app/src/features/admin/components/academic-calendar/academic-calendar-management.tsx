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
import { ACADEMIC_TERM_NAMES } from "@/features/admin/lib/academic-terms";

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
  terms: {
    "FIRST SEMESTER": { start: "", end: "" },
    "SECOND SEMESTER": { start: "", end: "" },
    MIDYEAR: { start: "", end: "" },
  },
};

const toForm = (
  year: AcademicYearListItem | null,
): AcademicCalendarFormState =>
  year
    ? {
        ...emptyForm,
        start_year: String(year.start_year),
        end_year: String(year.end_year),
      }
    : emptyForm;

const termsOverlap = (
  first: { start: string; end: string },
  second: { start: string; end: string },
) =>
  new Date(first.start) <= new Date(second.end) &&
  new Date(first.end) >= new Date(second.start);

const hasCompleteCreateCalendar = (formData: AcademicCalendarFormState) => {
  const startYear = Number(formData.start_year);
  const endYear = Number(formData.end_year);

  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) return false;
  if (endYear < startYear) return false;

  const hasCompleteTerms = ACADEMIC_TERM_NAMES.every((termName) => {
    const term = formData.terms[termName];
    if (!term.start || !term.end) return false;

    return new Date(term.start) < new Date(term.end);
  });

  if (!hasCompleteTerms) return false;

  for (let index = 0; index < ACADEMIC_TERM_NAMES.length; index += 1) {
    const term = formData.terms[ACADEMIC_TERM_NAMES[index]];

    for (
      let nextIndex = index + 1;
      nextIndex < ACADEMIC_TERM_NAMES.length;
      nextIndex += 1
    ) {
      const nextTerm = formData.terms[ACADEMIC_TERM_NAMES[nextIndex]];
      if (termsOverlap(term, nextTerm)) return false;
    }
  }

  return true;
};

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
          createLabel="Create Academic Calendar"
          searchPlaceholder="Search Academic Calendar..."
          emptyMessage="No academic calendar match your search."
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
                    <div
                      key="default-academic-term"
                      className="h-full flex flex-col justify-center"
                    >
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
          ? "Create Academic Calendar"
          : (selectedYear?.code ? `Academic Calendar ${selectedYear.code}` : "Academic year not found"),
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
          title="Select an academic calendar"
          description="Academic calendar fields and terms will appear here."
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
      ? await createAcademicYear({
          start_year: startYear,
          end_year: endYear,
          terms: ACADEMIC_TERM_NAMES.map((name) => ({
            name,
            start: formData.terms[name].start,
            end: formData.terms[name].end,
          })),
        })
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
      ...emptyForm,
      start_year: String(startYear),
      end_year: String(endYear),
      terms: formData.terms,
    };
    setSavedFormData(nextSaved);
    setFormData(nextSaved);
    setSuccess(
      isCreating
        ? "Academic calendar created successfully"
        : "Academic calendar updated successfully",
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
        Select another academic calendar from the list.
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
        onTermChange={(name, field, value) => {
          setFormData((current) => ({
            ...current,
            terms: {
              ...current.terms,
              [name]: {
                ...current.terms[name],
                [field]: value,
              },
            },
          }));
          setError("");
        }}
        onReset={() => {
          setFormData(isCreating ? emptyForm : savedFormData);
          setError("");
          setSuccess("");
        }}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        isCreating={isCreating}
        submitDisabled={
          isCreating ? !hasCompleteCreateCalendar(formData) : false
        }
        submitLabel={isCreating ? "Create Academic Year" : "Save Changes"}
        submitLoadingLabel={isCreating ? "Creating..." : "Saving..."}
        showActions={isCreating || hasFormChanges}
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
