"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Term } from "@/models/term";
import { updateTerm } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import { TermInitialForm, type TermFormState } from "./term-initial-form";

type TermEditFormProps = {
  term: Term;
};

const termToFormState = (term: Term): TermFormState => ({
  academic_year: term.academic_year,
  term_code: term.term_code,
  sequence: String(term.sequence),
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
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(savedFormData);
    setError("");
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!formData.academic_year.trim()) {
      setError("Academic year is required");
      return;
    }

    if (!formData.term_code.trim()) {
      setError("Term code is required");
      return;
    }

    const parsedSequence = Number(formData.sequence);
    if (!Number.isFinite(parsedSequence)) {
      setError("Term sequence must be a number");
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
      academic_year: formData.academic_year,
      term_code: formData.term_code,
      sequence: parsedSequence,
      start: formData.start,
      end: formData.end,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    const newSavedState = {
      academic_year: formData.academic_year.trim(),
      term_code: formData.term_code.trim(),
      sequence: String(parsedSequence),
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
            normalizeSequenceOnBlur={false}
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
