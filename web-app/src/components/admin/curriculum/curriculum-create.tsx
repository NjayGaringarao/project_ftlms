"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CirclePlus } from "lucide-react";
import { createCurriculum } from "@/lib/admin/actions";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import {
  CurriculumInitialForm,
  type CurriculumFormState,
} from "./curriculum-initial-form";

const initialFormState: CurriculumFormState = {
  major_id: "",
  title: "",
  series_year: "",
  revised_year: "",
};

type CurriculumCreateProps = {
  basePath?: string;
};

export const CurriculumCreate = ({
  basePath = "/curriculums",
}: CurriculumCreateProps) => {
  const router = useRouter();
  const [formData, setFormData] =
    useState<CurriculumFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof CurriculumFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setError("");
    setShowSuccess(false);
  };

  const handleCreate = async () => {
    const parsedSeriesYear = Number(formData.series_year);
    const parsedRevisedYear = formData.revised_year.trim()
      ? Number(formData.revised_year)
      : null;

    if (!formData.major_id.trim()) {
      setError("Major is required");
      return;
    }
    if (!formData.title.trim()) {
      setError("Curriculum title is required");
      return;
    }
    if (!Number.isInteger(parsedSeriesYear)) {
      setError("Series year is required");
      return;
    }
    if (
      parsedRevisedYear !== null &&
      (!Number.isInteger(parsedRevisedYear) ||
        parsedRevisedYear < parsedSeriesYear)
    ) {
      setError("Revised year must be greater than or equal to series year");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createCurriculum({
      major_id: formData.major_id,
      title: formData.title,
      series_year: parsedSeriesYear,
      revised_year: parsedRevisedYear,
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`${basePath}/${data.id}`);
      } else {
        router.push(basePath);
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Create Curriculum"
      icon={CirclePlus}
      onClose={() => router.push(basePath)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          success={
            showSuccess
              ? {
                  title: "Curriculum created",
                  message: "Record created successfully. Redirecting...",
                }
              : undefined
          }
          error={error}
        />

        <CurriculumInitialForm
          formData={formData}
          onChange={handleChange}
          onReset={handleReset}
          onSubmit={handleCreate}
          isSaving={isSaving}
          submitLabel="Create Curriculum"
          submitLoadingLabel="Creating..."
        />
      </div>
    </AdminPanel>
  );
};
