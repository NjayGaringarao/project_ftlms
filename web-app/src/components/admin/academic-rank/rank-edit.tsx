"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { Rank } from "@/models/academic_rank";
import { updateRank } from "@/lib/admin/actions";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import { RankInitialForm, type RankFormState } from "./rank-initial-form";

type RankEditFormProps = {
  rank: Rank;
};

const rankToFormState = (rank: Rank): RankFormState => ({
  number: rank.number.toString(),
  title: rank.title,
  description: rank.description ?? "",
});

export const RankEdit = ({ rank }: RankEditFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<RankFormState>(() =>
    rankToFormState(rank),
  );
  const [savedFormData, setSavedFormData] = useState<RankFormState>(() =>
    rankToFormState(rank),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof RankFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(savedFormData);
    setError("");
    setSuccess(false);
  };

  const handleSave = async () => {
    const parsedNumber = Number(formData.number);

    if (!Number.isFinite(parsedNumber)) {
      setError("Rank number is required");
      return;
    }

    if (!formData.title.trim()) {
      setError("Rank title is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await updateRank({
      id: rank.id,
      number: parsedNumber,
      title: formData.title,
      description: formData.description,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    const newSavedState = {
      number: parsedNumber.toString(),
      title: formData.title.trim(),
      description: formData.description.trim(),
    };

    setSavedFormData(newSavedState);
    setFormData(newSavedState);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Rank"
      icon={Edit}
      onClose={() => router.push(`/academic-ranks/${rank.id}`)}
    >
      <>
        <div className="space-y-4">
          <RankInitialForm
            formData={formData}
            onChange={handleChange}
            onReset={handleReset}
            onSubmit={handleSave}
            isSaving={isSaving}
            submitLabel="Save Changes"
            submitLoadingLabel="Saving..."
            statusSlot={
              <FormStatusBanner
                variant="compact"
                success={
                  success
                    ? {
                        title: "Rank updated successfully",
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
