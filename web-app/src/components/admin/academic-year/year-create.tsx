"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CirclePlus } from "lucide-react";
import { createAcademicYear } from "@/lib/admin/actions";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import { YearFormState, YearInitialForm } from "./year-initial-form";

const initialFormState: YearFormState = {
  start_year: "",
  end_year: "",
};

export const YearCreate = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<YearFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof YearFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setError("");
    setShowSuccess(false);
  };

  const handleCreate = async () => {
    const startYear = Number(formData.start_year);
    const endYear = Number(formData.end_year);

    if (!Number.isInteger(startYear)) {
      setError("Start year is required");
      return;
    }

    if (!Number.isInteger(endYear)) {
      setError("End year is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createAcademicYear({
      start_year: startYear,
      end_year: endYear,
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`/academic-years/${data.id}`);
      } else {
        router.push("/academic-years");
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Create Academic Year"
      icon={CirclePlus}
      onClose={() => router.push("/academic-years")}
    >
      <div className="space-y-4">
        <FormStatusBanner
          success={
            showSuccess
              ? {
                  title: "Academic Year Created",
                  message: "Record created successfully. Redirecting...",
                }
              : undefined
          }
          error={error}
        />

      <YearInitialForm
        formData={formData}
        onChange={handleChange}
        onReset={handleReset}
        onSubmit={handleCreate}
        isSaving={isSaving}
        submitLabel="Create Academic Year"
        submitLoadingLabel="Creating..."
      />
      </div>
    </AdminPanel>
  );
};
