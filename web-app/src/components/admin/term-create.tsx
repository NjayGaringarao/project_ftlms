"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createTerm } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import { TermInitialForm, type TermFormState } from "./term-initial-form";

const initialFormState: TermFormState = {
  academic_year: "",
  term_code: "",
  sequence: "",
  start: "",
  end: "",
};

export const TermCreate = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<TermFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof TermFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setError("");
    setShowSuccess(false);
  };

  const handleCreate = async () => {
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
    setShowSuccess(false);

    const { data, error: createError } = await createTerm({
      academic_year: formData.academic_year,
      term_code: formData.term_code,
      sequence: parsedSequence,
      start: formData.start,
      end: formData.end,
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`/academic-terms/${data.id}`);
      } else {
        router.push("/academic-terms");
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Term Information"
      icon={Plus}
      onClose={() => router.push("/academic-terms")}
    >
      <>
        <div className="space-y-4">
          <FormStatusBanner
            success={
              showSuccess
                ? {
                    title: "Term Created",
                    message: "Record created successfully. Redirecting...",
                  }
                : undefined
            }
            error={error}
          />

          <TermInitialForm
            formData={formData}
            onChange={handleChange}
            onReset={handleReset}
            onSubmit={handleCreate}
            isSaving={isSaving}
            submitLabel="Create Term"
            submitLoadingLabel="Creating..."
            termCodePlaceholder="e.g. FIRST"
          />
        </div>
      </>
    </AdminPanel>
  );
};
