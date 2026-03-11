"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CirclePlus } from "lucide-react";
import { createAcademicYear } from "@/lib/admin/actions";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import { YearFormState, YearInitialForm } from "./year-initial-form";

const initialFormState: YearFormState = {
  code: "",
  start_year: "",
  end_year: "",
};

const generateAcademicYearCode = (startYear: string, endYear: string) => {
  const start = Number(startYear);
  const end = Number(endYear);

  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return "";
  }

  return `${start}-${end}`;
};

export const YearCreate = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<YearFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof YearFormState, value: string) => {
    setFormData((prev) => {
      const nextState = { ...prev, [field]: value };

      if (field !== "code") {
        nextState.code = generateAcademicYearCode(
          nextState.start_year,
          nextState.end_year,
        );
      }

      return nextState;
    });
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

    if (!formData.code.trim()) {
      setError("Academic year code is required");
      return;
    }

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
      code: formData.code,
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
          isCodeReadOnly
        />
      </div>
    </AdminPanel>
  );
};
