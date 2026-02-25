"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Term } from "@/models/term";
import { updateTerm } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import { TermInitialForm, type TermFormState } from "./term-initial-form";
import {
  generateAcademicTermCode,
  TERM_ORDERS_BY_TYPE,
} from "@/lib/admin/academic-terms";

type TermEditFormProps = {
  term: Term;
};

const termToFormState = (term: Term): TermFormState => ({
  academic_year_start: String(term.academic_year_start),
  academic_year_end: String(term.academic_year_end),
  type: term.type,
  term_order: term.term_order,
  start: term.start ?? "",
  end: term.end ?? "",
});

export const TermEdit = ({ term }: TermEditFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<TermFormState>(() =>
    termToFormState(term),
  );
  const [savedFormData, setSavedFormData] = useState<TermFormState>(() =>
    termToFormState(term),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof TermFormState, value: string) => {
    setFormData((prev) => {
      if (field === "type") {
        const nextType = value as TermFormState["type"];
        const allowedOrders = TERM_ORDERS_BY_TYPE[nextType];
        const nextOrder = allowedOrders.includes(prev.term_order)
          ? prev.term_order
          : allowedOrders[0];

        return {
          ...prev,
          type: nextType,
          term_order: nextOrder,
        };
      }

      return { ...prev, [field]: value };
    });

    setError("");
  };

  const handleReset = () => {
    setFormData(savedFormData);
    setError("");
    setSuccess(false);
  };

  const handleSave = async () => {
    const parsedYearStart = Number(formData.academic_year_start);
    if (!Number.isInteger(parsedYearStart)) {
      setError("Academic year start is required");
      return;
    }

    const parsedYearEnd = Number(formData.academic_year_end);
    if (!Number.isInteger(parsedYearEnd)) {
      setError("Academic year end is required");
      return;
    }

    if (parsedYearStart < 2000) {
      setError("Academic year start must be 2000 or later");
      return;
    }

    if (parsedYearEnd < parsedYearStart) {
      setError("Academic year end must be greater than or equal to start year");
      return;
    }

    if (!formData.start.trim()) {
      setError("Start date is required");
      return;
    }

    if (!formData.end.trim()) {
      setError("End date is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await updateTerm({
      id: term.id,
      academic_year_start: parsedYearStart,
      academic_year_end: parsedYearEnd,
      type: formData.type,
      term_order: formData.term_order,
      start: formData.start,
      end: formData.end,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    const newSavedState = {
      academic_year_start: String(parsedYearStart),
      academic_year_end: String(parsedYearEnd),
      type: formData.type,
      term_order: formData.term_order,
      start: formData.start,
      end: formData.end,
    };

    setSavedFormData(newSavedState);
    setFormData(newSavedState);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Term"
      icon={Save}
      onClose={() => router.push(`/academic-terms/${term.id}`)}
    >
      <>
        <div className="space-y-4">
          <TermInitialForm
            formData={formData}
            onChange={handleChange}
            onReset={handleReset}
            onSubmit={handleSave}
            isSaving={isSaving}
            submitLabel="Save Changes"
            submitLoadingLabel="Saving..."
            generatedCode={
              Number.isInteger(Number(formData.academic_year_start)) &&
              Number.isInteger(Number(formData.academic_year_end))
                ? generateAcademicTermCode({
                    academic_year_start: Number(formData.academic_year_start),
                    academic_year_end: Number(formData.academic_year_end),
                    type: formData.type,
                    term_order: formData.term_order,
                  })
                : "Requires year range, type, and order"
            }
            statusSlot={
              <FormStatusBanner
                variant="compact"
                success={
                  success
                    ? {
                        title: "Term updated successfully",
                      }
                    : undefined
                }
                error={error}
              />
            }
          />
        </div>
      </>
    </AdminPanel>
  );
};
