"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { updateCurriculum } from "@/lib/admin/actions";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import {
  CurriculumInitialForm,
  type CurriculumFormState,
} from "./curriculum-initial-form";
import { CurriculumListItem } from "@/lib/admin/curriculums";

type CurriculumEditProps = {
  curriculum: CurriculumListItem;
  basePath: string;
};

const curriculumToFormState = (
  curriculum: CurriculumListItem,
): CurriculumFormState => ({
  major_id: curriculum.major_id,
  title: curriculum.title,
  series_year: String(curriculum.series_year),
  revised_year:
    curriculum.revised_year !== null ? String(curriculum.revised_year) : "",
});

export const CurriculumEdit = ({
  curriculum,
  basePath = "/curriculums",
}: CurriculumEditProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<CurriculumFormState>(() =>
    curriculumToFormState(curriculum),
  );
  const [savedState, setSavedState] = useState<CurriculumFormState>(() =>
    curriculumToFormState(curriculum),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof CurriculumFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(savedState);
    setError("");
    setSuccess(false);
  };

  const handleSave = async () => {
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
    setSuccess(false);

    const { error: updateError } = await updateCurriculum({
      id: curriculum.id,
      major_id: formData.major_id,
      title: formData.title,
      series_year: parsedSeriesYear,
      revised_year: parsedRevisedYear,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setSavedState({
      major_id: formData.major_id,
      title: formData.title.trim(),
      series_year: String(parsedSeriesYear),
      revised_year: parsedRevisedYear !== null ? String(parsedRevisedYear) : "",
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Curriculum"
      icon={Edit}
      onClose={() => router.push(`${basePath}/${curriculum.id}`)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          variant="compact"
          success={
            success ? { title: "Curriculum updated successfully" } : undefined
          }
          error={error}
        />

        <CurriculumInitialForm
          formData={formData}
          onChange={handleChange}
          onReset={handleReset}
          onSubmit={handleSave}
          isSaving={isSaving}
          submitLabel="Save Changes"
          submitLoadingLabel="Saving..."
        />
      </div>
    </AdminPanel>
  );
};
